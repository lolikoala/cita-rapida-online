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
import { supabase } from "@/lib/supabase";
import { Sun, Sunset } from "lucide-react";

import {
  getServices,
  getBusinessHours,
  getAvailableTimeSlots,
  createAppointment,
} from "@/services/dataService";

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
  const [maxMonthsAhead, setMaxMonthsAhead] = useState<number>(1);

  const [selectedTime, setSelectedTime] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'morning' | 'afternoon'>('morning');

  useEffect(() => {
    const fetchPolicy = async () => {
      const { data } = await supabase
        .from("booking_settings")
        .select("same_day_policy, max_months_ahead")
        .single();

      if (data?.same_day_policy) {
        setSameDayPolicy(data.same_day_policy);
      }

      if (data?.max_months_ahead) {
        setMaxMonthsAhead(data.max_months_ahead);
      }
    };

    fetchPolicy();
  }, []);

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

  useEffect(() => {
    const fetchAvailableDays = async () => {
      try {
        const businessHours = await getBusinessHours();
        const availableDaysOfWeek = [...new Set(businessHours.map((hour) => hour.day_of_week))];

        const today = new Date();
        const maxDate = new Date(today);
        maxDate.setMonth(today.getMonth() + maxMonthsAhead);

        const dates: Date[] = [];
        let date = new Date(today);

        while (date <= maxDate) {
          const dbDay = date.getDay();
          if (availableDaysOfWeek.includes(dbDay)) {
            dates.push(new Date(date));
          }
          date = addDays(date, 1);
        }

        setAvailableDates(dates);
      } catch (error) {
        console.error("Error fetching available days:", error);
      }
    };

    fetchAvailableDays();
  }, [maxMonthsAhead]);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (selectedServiceId && selectedDate) {
        try {
          const formattedDate = format(selectedDate, "yyyy-MM-dd");
          const slots = await getAvailableTimeSlots(formattedDate, selectedServiceId);
          setAvailableTimeSlots(slots);
          setSelectedTime("");
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
    today.setHours(0, 0, 0, 0);
    if (sameDayPolicy === "next_day") {
      today.setDate(today.getDate() + 1);
    } else if (sameDayPolicy === "next_week") {
      today.setDate(today.getDate() + 7);
    }
    return today;
  };

  const getMaxDate = () => {
    const max = new Date();
    max.setMonth(max.getMonth() + maxMonthsAhead);
    return max;
  };

  const isDateAvailable = (date: Date) => {
    return availableDates.some((availableDate) => isSameDay(availableDate, date));
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
        status: "pending"
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
  const filteredSlots = availableTimeSlots.filter((slot) => {
    const hour = parseInt(slot.time.split(":")[0], 10);
    if (selectedPeriod === "morning") {
      return hour < 14;
    } else {
      return hour >= 14;
    }
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Reservar Cita</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Paso 1: Selección de servicio */}
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

        {/* Paso 2: Selección de fecha */}
        {selectedServiceId && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">2. Selecciona una fecha</h2>
            <div className="border rounded-lg p-4 bg-card">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) =>
                  date < getMinDate() || date > getMaxDate() || !isDateAvailable(date)
                }
                className="mx-auto"
                locale={es}
                modifiersClassNames={{
                  selected: "bg-primary text-primary-foreground",
                  disabled: "opacity-50 cursor-not-allowed",
                }}
                weekStartsOn={1}
              />
            </div>
          </div>
        )}

        {/* Paso 3: Selección de hora */}
        {selectedDate && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">3. Selecciona una hora</h2>
            <p className="text-muted-foreground">
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>

            <div className="flex gap-4">
              <Button
                type="button"
                variant={selectedPeriod === "morning" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("morning")}
              >
                <Sun className="mr-2 h-4 w-4" />
                Mañana
              </Button>
              <Button
                type="button"
                variant={selectedPeriod === "afternoon" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("afternoon")}
              >
                <Sunset className="mr-2 h-4 w-4" />
                Tarde
              </Button>
            </div>

            {filteredSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredSlots.map((slot) => (
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
                  <p className="text-muted-foreground">
                    No hay horarios disponibles en este periodo
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {/* Paso 4: Información de contacto */}
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
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
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
