
import { useState, useEffect } from "react";
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
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import { getBusinessHours, createBusinessHour, updateBusinessHour, deleteBusinessHour, getDayName } from "@/services/dataService";
import { BusinessHour } from "@/types";

const BusinessHoursManagement = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string>("");
  const [formData, setFormData] = useState({
    day_of_week: "1",
    start_time: "09:00",
    end_time: "14:00",
  });

  useEffect(() => {
    fetchBusinessHours();
  }, []);

  const fetchBusinessHours = async () => {
    try {
      const data = await getBusinessHours();
      
      // Sort by day of week, then start time
      const sortedData = data.sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) {
          return a.day_of_week - b.day_of_week;
        }
        return a.start_time.localeCompare(b.start_time);
      });
      
      setBusinessHours(sortedData);
    } catch (error) {
      console.error("Error fetching business hours:", error);
      toast.error("Error al cargar los horarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      day_of_week: "1",
      start_time: "09:00",
      end_time: "14:00",
    });
    setIsEditing(false);
    setCurrentId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the time range
    if (formData.start_time >= formData.end_time) {
      toast.error("La hora de inicio debe ser anterior a la hora de fin");
      return;
    }

    try {
      if (isEditing && currentId) {
        // Update existing business hour
        await updateBusinessHour(currentId, {
          day_of_week: parseInt(formData.day_of_week),
          start_time: formData.start_time,
          end_time: formData.end_time,
        });
        toast.success("Horario actualizado con éxito");
      } else {
        // Create new business hour
        await createBusinessHour({
          day_of_week: parseInt(formData.day_of_week),
          start_time: formData.start_time,
          end_time: formData.end_time,
        });
        toast.success("Horario creado con éxito");
      }

      // Refresh business hours list
      fetchBusinessHours();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving business hour:", error);
      toast.error("Error al guardar el horario");
    }
  };

  const handleEdit = (hour: BusinessHour) => {
    setIsEditing(true);
    setCurrentId(hour.id);
    setFormData({
      day_of_week: hour.day_of_week.toString(),
      start_time: hour.start_time,
      end_time: hour.end_time,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este horario?")) {
      try {
        await deleteBusinessHour(id);
        toast.success("Horario eliminado con éxito");
        fetchBusinessHours();
      } catch (error) {
        console.error("Error deleting business hour:", error);
        toast.error("Error al eliminar el horario");
      }
    }
  };

  const dayOptions = [
  { value: "0", label: "Lunes" },
  { value: "1", label: "Martes" },
  { value: "2", label: "Miércoles" },
  { value: "3", label: "Jueves" },
  { value: "4", label: "Viernes" },
  { value: "5", label: "Sábado" },
  { value: "6", label: "Domingo" },
];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Horarios</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Añadir Horario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Horario" : "Añadir Nuevo Horario"}</DialogTitle>
              <DialogDescription>
                Define los días y horas de atención al público.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Día de la semana</Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) => handleSelectChange("day_of_week", value)}
                  >
                    <SelectTrigger id="day_of_week">
                      <SelectValue placeholder="Selecciona un día" />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Hora de inicio</Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Hora de fin</Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{isEditing ? "Guardar Cambios" : "Crear Horario"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horarios de Atención</CardTitle>
          <CardDescription>
            Gestiona los días y horas en que tu negocio atiende al público
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando horarios...</div>
          ) : businessHours.length > 0 ? (
            <Table>
              <TableCaption>Lista de horarios de atención configurados</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Día</TableHead>
                  <TableHead>Hora de Inicio</TableHead>
                  <TableHead>Hora de Fin</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessHours.map((hour) => (
                  <TableRow key={hour.id}>
                    <TableCell className="font-medium">
                      {getDayName(hour.day_of_week)}
                    </TableCell>
                    <TableCell>{hour.start_time}</TableCell>
                    <TableCell>{hour.end_time}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(hour)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-red-50 hover:bg-red-100 hover:text-red-600"
                          onClick={() => handleDelete(hour.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay horarios configurados. ¡Añade tu primer horario!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessHoursManagement;
