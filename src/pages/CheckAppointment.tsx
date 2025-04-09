
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search } from "lucide-react";
import { getAppointmentsByPhone, getServiceById } from "@/services/dataService";
import { Appointment } from "@/types";

const CheckAppointment = () => {
  const [searchParams] = useSearchParams();
  const prefilledPhone = searchParams.get("phone");

  const [phone, setPhone] = useState(prefilledPhone || "");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (prefilledPhone) {
      handleSearch();
    }
  }, [prefilledPhone]);

  const handleSearch = async () => {
    if (!phone || phone.length < 9) {
      toast.error("Por favor, introduce un número de teléfono válido");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Fetch appointments by phone
      const appointments = await getAppointmentsByPhone(phone);
      
      // Fetch service details for each appointment
      const appointmentsWithService = await Promise.all(
        appointments.map(async (appointment) => {
          const service = await getServiceById(appointment.service_id);
          return { ...appointment, service };
        })
      );
      
      setAppointments(appointmentsWithService);
      
      if (appointmentsWithService.length === 0) {
        toast.info("No se encontraron citas con este número de teléfono");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Ha ocurrido un error al buscar las citas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  // Function to get the status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-warning/20 text-warning-foreground">Pendiente</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-success/20 text-success-foreground">Confirmada</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-destructive/20 text-destructive-foreground">Rechazada</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  // Format the date string
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Consultar Estado de Citas</CardTitle>
          <CardDescription>
            Introduce tu número de teléfono para ver el estado de tus citas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Número de teléfono</Label>
              <div className="flex space-x-2">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="600123456"
                  pattern="[0-9]{9}"
                  title="Introduce un número de teléfono válido de 9 dígitos"
                  required
                  maxLength={9}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Buscando..." : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </form>

          {hasSearched && (
            <div className="mt-8">
              {appointments.length > 0 ? (
                <Table>
                  <TableCaption>Listado de tus citas</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">
                          {appointment.service?.name || "Servicio no disponible"}
                        </TableCell>
                        <TableCell>{formatDate(appointment.date)}</TableCell>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No se encontraron citas asociadas a este número de teléfono
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckAppointment;
