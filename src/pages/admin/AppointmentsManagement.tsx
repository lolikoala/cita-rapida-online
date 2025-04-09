
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckIcon, XIcon } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getAppointments, getServices, updateAppointmentStatus } from "@/services/dataService";
import { Appointment, Service } from "@/types";

const AppointmentsManagement = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentsData, servicesData] = await Promise.all([
          getAppointments(),
          getServices(),
        ]);
        
        // Sort appointments by date (newest first)
        const sortedAppointments = appointmentsData.sort((a, b) => {
          // First by date (newest first)
          const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateComparison !== 0) return dateComparison;
          
          // Then by time
          return a.time.localeCompare(b.time);
        });
        
        // Add service details to appointments
        const appointmentsWithService = sortedAppointments.map(appointment => {
          const service = servicesData.find(s => s.id === appointment.service_id);
          return { ...appointment, service };
        });
        
        setAppointments(appointmentsWithService);
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching appointments data:", error);
        toast.error("Error al cargar las citas");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleUpdateStatus = async (id: string, status: "accepted" | "rejected") => {
    try {
      await updateAppointmentStatus(id, status);
      
      // Update the local state
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === id ? { ...appointment, status } : appointment
        )
      );
      
      toast.success(`Cita ${status === "accepted" ? "aceptada" : "rechazada"} con éxito`);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Error al actualizar el estado de la cita");
    }
  };
  
  // Get the status badge
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
  
  // Format date string
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEEE, d 'de' MMMM", { locale: es });
    } catch {
      return dateStr;
    }
  };
  
  // Filter appointments based on status
  const filteredAppointments = statusFilter === "all" 
    ? appointments 
    : appointments.filter(a => a.status === statusFilter);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Citas</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Citas</CardTitle>
          <CardDescription>
            Gestiona las solicitudes de citas y actualiza su estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Label htmlFor="status-filter">Filtrar por estado:</Label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger id="status-filter" className="w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="accepted">Confirmadas</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">Cargando citas...</div>
          ) : filteredAppointments.length > 0 ? (
            <Table>
              <TableCaption>
                Lista de todas las citas {statusFilter !== "all" && `(Filtrado: ${statusFilter})`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.name}</TableCell>
                    <TableCell>{appointment.phone}</TableCell>
                    <TableCell>{appointment.service?.name || "Desconocido"}</TableCell>
                    <TableCell>{formatDate(appointment.date)}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {appointment.status === "pending" && (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 bg-success/10 hover:bg-success/20 hover:text-success-foreground"
                                    onClick={() => handleUpdateStatus(appointment.id, "accepted")}
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Aceptar cita</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 bg-destructive/10 hover:bg-destructive/20 hover:text-destructive-foreground"
                                    onClick={() => handleUpdateStatus(appointment.id, "rejected")}
                                  >
                                    <XIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Rechazar cita</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                        
                        {appointment.status === "accepted" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-destructive/10 hover:bg-destructive/20 hover:text-destructive-foreground"
                                  onClick={() => handleUpdateStatus(appointment.id, "rejected")}
                                >
                                  <XIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cancelar cita</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {appointment.status === "rejected" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-success/10 hover:bg-success/20 hover:text-success-foreground"
                                  onClick={() => handleUpdateStatus(appointment.id, "accepted")}
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Aceptar cita</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {statusFilter === "all"
                  ? "No hay citas registradas"
                  : `No hay citas con estado "${statusFilter}"`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentsManagement;
