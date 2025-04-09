import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Ajusta esta ruta si tu cliente está en otra carpeta
import { Select, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function ConfiguracionCitas() {
  const [policy, setPolicy] = useState("same_day");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("booking_settings")
        .select("same_day_policy")
        .single();

      if (error) {
        toast.error("No se pudo cargar la configuración");
        console.error(error);
      }

      if (data) {
        setPolicy(data.same_day_policy);
      }

      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleUpdate = async (value: string) => {
    setPolicy(value);

    const { error } = await supabase
      .from("booking_settings")
      .update({ same_day_policy: value })
      .neq("same_day_policy", value); // solo actualiza si es distinto

    if (error) {
      toast.error("Error al guardar configuración");
      console.error(error);
    } else {
      toast.success("Configuración actualizada");
    }
  };

  if (loading) return <p className="p-4">Cargando configuración...</p>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de reservas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>¿Desde cuándo pueden los clientes reservar una cita?</p>
          <Select value={policy} onValueChange={handleUpdate}>
            <SelectItem value="same_day">Permitir citas para hoy</SelectItem>
            <SelectItem value="next_day">Solo desde mañana</SelectItem>
            <SelectItem value="next_week">Solo desde la próxima semana</SelectItem>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
