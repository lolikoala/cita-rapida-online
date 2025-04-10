import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckIcon, XIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  getAppointments,
  getServices,
  updateAppointmentStatus,
  createAppointment,
  deleteAppointments,
} from "@/services/dataService";
import { Appointment, Service } from "@/types";

const AppointmentsManagement = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [newAppointment, setNewAppointment] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    service_id: "",
  });

  const fetchAppointmentsAndServices = async () => {
    try {
      const [appointmentsData, servicesData] = await Promise.all([
        getAppointments(),
        getServices(),
      ]);

      const sortedAppointments = appointmentsData.sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        return a.time.localeCompare(b.time);
      });

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

  useEffect(() => {
    fetchAppointmentsAndServices();
  }, []);

  const handleUpdateStatus = async (id: string, status: "accepted" | "rejected") => {
    try {
      await updateAppointmentStatus(id, status);
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status } : a)
      );
      toast.success(`Cita ${status === "accepted" ? "aceptada" : "rechazada"} con éxito`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar la cita");
    }
  };

  const handleSelect = (id: string) => {
    setSelectedAppointments(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allIds = filteredAppointments.map(a => a.id);
    const allSelected = allIds.every(id => selectedAppointments.includes(id));
    setSelectedAppointments(allSelected ? [] : allIds);
  };

  const handleDeleteSelected = async () => {
    try {
      await deleteAppointments(selectedAppointments);
      setAppointments(prev =>
        prev.filter(a => !selectedAppointments.includes(a.id))
      );
      setSelectedAppointments([]);
      toast.success("Citas eliminadas");
    } catch {
      toast.error("Error al eliminar citas");
    }
  };

  const handleCreate = async () => {
    const { name, phone, date, time, service_id } = newAppointment;
    if (!name || !phone || !date || !time || !service_id) {
      toast.error("Completa todos los campos");
      return;
    }

    try {
      await createAppointment({ ...newAppointment, status: "accepted" });
      toast.success("Cita creada correctamente");
      setNewAppointment({ name: "", phone: "", date: "", time: "", service_id: "" });
      await fetchAppointmentsAndServices(); // Refrescar lista después de crear
    } catch {
      toast.error("Error al crear la cita");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Pendiente</Badge>;
      case "accepted":
        return <Badge className="bg-green-600 text-white hover:bg-green-700">Confirmada</Badge>;
      case "rejected":
        return <Badge className="bg-red-600 text-white hover:bg-red-700">Rechazada</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEEE, d 'de' MMMM", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const filteredAppointments = statusFilter === "all"
    ? appointments
    : appointments.filter(a => a.status === statusFilter);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Citas</h1>
        {selectedAppointments.length > 0 && (
          <Button variant="destructive" onClick={handleDeleteSelected}>
            <Trash2Icon className="w-4 h-4 mr-2" />
            Eliminar seleccionadas
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear nueva cita</CardTitle>
          <CardDescription>Se marcará como confirmada automáticamente</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <Input placeholder="Nombre" value={newAppointment.name} onChange={(e) => setNewAppointment({ ...newAppointment, name: e.target.value })} />
          <Input placeholder="Teléfono" value={newAppointment.phone} onChange={(e) => setNewAppointment({ ...newAppointment, phone: e.target.value })} />
          <Input type="date" value={newAppointment.date} onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })} />
          <Input type="time" value={newAppointment.time} onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })} />
          <Select value={newAppointment.service_id} onValueChange={(value) => setNewAppointment({ ...newAppointment, service_id: value })}>
            <SelectTrigger><SelectValue placeholder="Servicio" /></SelectTrigger>
            <SelectContent>
              {services.map(service => (
                <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreate}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Crear
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Citas</CardTitle>
          <CardDescription>Gestiona solicitudes y estados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Label htmlFor="status-filter">Filtrar por estado:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
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
              <TableCaption>Lista de todas las citas</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={selectedAppointments.length === filteredAppointments.length}
                      onChange={handleSelectAll}
                    />
                  </TableHead>
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
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedAppointments.includes(appointment.id)}
                        onChange={() => handleSelect(appointment.id)}
                      />
                    </TableCell>
                    <TableCell>{appointment.name}</TableCell>
                    <TableCell>{appointment.phone}</TableCell>
                    <TableCell>{appointment.service?.name || "—"}</TableCell>
                    <TableCell>{formatDate(appointment.date)}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {appointment.status === "pending" && (
                          <>
                            <Button size="icon" onClick={() => handleUpdateStatus(appointment.id, "accepted")}>
                              <CheckIcon className="h-4 w-4" />
                            </Button>
                            <Button size="icon" onClick={() => handleUpdateStatus(appointment.id, "rejected")}>
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {appointment.status === "rejected" && (
                          <Button size="icon" onClick={() => handleUpdateStatus(appointment.id, "accepted")}>
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                        )}
                        {appointment.status === "accepted" && (
                          <Button size="icon" onClick={() => handleUpdateStatus(appointment.id, "rejected")}>
                            <XIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay citas para mostrar
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentsManagement;
