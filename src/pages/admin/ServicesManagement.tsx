
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
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import { getServices, createService, updateService, deleteService } from "@/services/dataService";
import { Service } from "@/types";

const ServicesManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    duration_minutes: "30",
    price: "",
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Error al cargar los servicios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      duration_minutes: "30",
      price: "",
    });
    setIsEditing(false);
    setCurrentId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the form
    if (!formData.name || !formData.duration_minutes) {
      toast.error("Nombre y duración son campos obligatorios");
      return;
    }

    // Convert price and duration to appropriate format
    const duration = parseInt(formData.duration_minutes);
    const price = formData.price ? parseFloat(formData.price) : undefined;

    if (duration <= 0) {
      toast.error("La duración debe ser mayor que 0 minutos");
      return;
    }

    if (formData.price && price! <= 0) {
      toast.error("El precio debe ser mayor que 0");
      return;
    }

    try {
      if (isEditing && currentId) {
        // Update existing service
        await updateService(currentId, {
          name: formData.name,
          duration_minutes: duration,
          price,
        });
        toast.success("Servicio actualizado con éxito");
      } else {
        // Create new service
        await createService({
          name: formData.name,
          duration_minutes: duration,
          price,
        });
        toast.success("Servicio creado con éxito");
      }

      // Refresh services list
      fetchServices();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Error al guardar el servicio");
    }
  };

  const handleEdit = (service: Service) => {
    setIsEditing(true);
    setCurrentId(service.id);
    setFormData({
      name: service.name,
      duration_minutes: service.duration_minutes.toString(),
      price: service.price ? service.price.toString() : "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este servicio?")) {
      try {
        await deleteService(id);
        toast.success("Servicio eliminado con éxito");
        fetchServices();
      } catch (error) {
        console.error("Error deleting service:", error);
        toast.error("Error al eliminar el servicio");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Servicios</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Añadir Servicio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Servicio" : "Añadir Nuevo Servicio"}</DialogTitle>
              <DialogDescription>
                Define los servicios que ofreces a tus clientes.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del servicio</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Corte de cabello"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duración (minutos)</Label>
                  <Input
                    id="duration_minutes"
                    name="duration_minutes"
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (€) - Opcional</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Ej: 25.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{isEditing ? "Guardar Cambios" : "Crear Servicio"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Servicios Disponibles</CardTitle>
          <CardDescription>
            Gestiona los servicios que ofreces a tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando servicios...</div>
          ) : services.length > 0 ? (
            <Table>
              <TableCaption>Lista de servicios configurados</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Duración (min)</TableHead>
                  <TableHead>Precio (€)</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.duration_minutes}</TableCell>
                    <TableCell>
                      {service.price ? `${service.price.toFixed(2)} €` : "No especificado"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-red-50 hover:bg-red-100 hover:text-red-600"
                          onClick={() => handleDelete(service.id)}
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
                No hay servicios configurados. ¡Añade tu primer servicio!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicesManagement;
