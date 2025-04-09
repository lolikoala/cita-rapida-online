
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, isAfter, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; // Import Supabase

import { getServices, getServiceById, getBusinessHours, getAvailableTimeSlots, createAppointment } from "@/services/dataService";
import { Service, TimeSlot } from "@/types";

const BookAppointment = () => {
  const [searchParams] = useSearchParams();
  const preSelectedServiceId = searchParams.get("serviceId");
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(preSelectedServiceId || "");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  
  const [sameDayPolicy, setSameDayPolicy] = useState<"same_day" | "next_day" | "next_week">("same_day");

  useEffect(() => {
    const fetchPolicy = async () => {
      const { data } = await supabase
        .from("booking_settings")
        .select("same_day_policy")
        .single();

      if (data?.same_day_policy) {
        setSameDayPolicy(data.same_day_policy);
      }
    };

    fetchPolicy();
  }, []);

  const [selectedTime, setSelectedTime] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);

  // Fetch available days based on business hours
  useEffect(() => {
    const fetchAvailableDays = async () => {
      try {
        const businessHours = await getBusinessHours();
        
        // Create an array of days of the week that have business hours (0-6)
        const availableDaysOfWeek = [...new Set(businessHours.map(hour => hour.day_of_week))];
        
        // Generate dates for the next 30 days that match available days of the week
        const today = new Date();
        const dates: Date[] = [];
        
        for (let i = 0; i < 30; i++) {
          const date = addDays(today, i);
          // Check if this day of the week has business hours
          if (availableDaysOfWeek.includes(date.getDay())) {
            dates.push(date);
          }
        }
        
        setAvailableDates(dates);
      } catch (error) {
        console.error("Error fetching available days:", error);
      }
    };

    fetchAvailableDays();
  }, []);

  // Fetch available time slots when date and service are selected
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (selectedServiceId && selectedDate) {
        try {
          const formattedDate = format(selectedDate, "yyyy-MM-dd");
          const slots = await getAvailableTimeSlots(formattedDate, selectedServiceId);
          setAvailableTimeSlots(slots);
          setSelectedTime(""); // Reset selected time when date or service changes
        } catch (error) {
          console.error("Error fetching time slots:", error);
          setAvailableTimeSlots([]);
        }
      } else {
        setAvailableTimeSlots([]);
      }
    };

    fetchTimeSlots();
  }, [selectedDate, selectedServiceId]);

  
  const getMinDate = () => {
    const today = new Date();
    if (sameDayPolicy === "next_day") return new Date(today.setDate(today.getDate() + 1));
    if (sameDayPolicy === "next_week") return new Date(today.setDate(today.getDate() + 7));
    return today;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedServiceId || !selectedDate || !selectedTime || !name || !phone) {
      toast.error("Por favor, completa todos los campos");
      return;
    }

    setIsLoading(true);
    
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      
      await createAppointment({
        service_id: selectedServiceId,
        name,
        phone,
        date: formattedDate,
        time: selectedTime,
      });
      
      toast.success("¡Cita solicitada con éxito! Recibirás confirmación pronto.");
      navigate(`/check?phone=${phone}`);
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error("Ha ocurrido un error al solicitar la cita");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check if a date is in the available dates list
  const isDateAvailable = (date: Date) => {
    return availableDates.some(availableDate => isSameDay(availableDate, date));
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Reservar Cita</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Select Service */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">1. Selecciona el servicio</h2>
          <div>
            <Label htmlFor="service">Servicio</Label>
            <Select 
              value={selectedServiceId} 
              onValueChange={setSelectedServiceId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.duration_minutes} min)
                    {service.price ? ` - ${service.price.toFixed(2)}€` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Step 2: Select Date */}
        {selectedServiceId && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">2. Selecciona una fecha</h2>
            <div className="border rounded-lg p-4 bg-card">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => 
                  isAfter(new Date(), date) || 
                  !isDateAvailable(date)
                }
                className="mx-auto"
                locale={es}
                modifiersClassNames={{
                  selected: "bg-primary text-primary-foreground",
                  disabled: "opacity-50 cursor-not-allowed",
                }}
              />
            </div>
          </div>
        )}
        
        {/* Step 3: Select Time */}
        {selectedDate && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">3. Selecciona una hora</h2>
            <p className="text-muted-foreground">
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
            
            {availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableTimeSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    type="button"
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    className={!slot.available ? "opacity-50 cursor-not-allowed" : ""}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-muted-foreground">No hay horarios disponibles para esta fecha</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Step 4: Contact Information */}
        {selectedTime && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">4. Tus datos de contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre y apellidos"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input 
                  id="phone" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  type="tel"
                  placeholder="600123456"
                  pattern="[0-9]{9}"
                  title="Introduce un número de teléfono válido de 9 dígitos"
                  required
                  maxLength={9}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? "Procesando..." : "Solicitar Cita"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default BookAppointment;
