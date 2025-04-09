import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const ConfiguracionCitas = () => {
  const [policy, setPolicy] = useState<"same_day" | "next_day" | "next_week">("same_day");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("booking_settings")
        .select("same_day_policy")
        .single();

      if (data) setPolicy(data.same_day_policy);
      if (error) toast.error("No se pudo cargar la configuración");

      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleUpdate = async (value: "same_day" | "next_day" | "next_week") => {
    setPolicy(value);

    const { error } = await supabase
      .from("booking_settings")
      .update({ same_day_policy: value })
      .neq("same_day_policy", value);

    if (error) {
      toast.error("Error al guardar configuración");
      console.error(error);
    } else {
      toast.success("Configuración actualizada");
    }
  };

  const renderPolicyText = () => {
    switch (policy) {
      case "same_day":
        return "Actualmente los clientes pueden reservar para hoy mismo.";
      case "next_day":
        return "Los clientes pueden reservar solo a partir de mañana.";
      case "next_week":
        return "Los clientes solo pueden reservar a partir de la próxima semana.";
      default:
        return null;
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
          <p>{renderPolicyText()}</p>
          <Select value={policy} onValueChange={handleUpdate}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="same_day">Permitir citas para hoy</SelectItem>
              <SelectItem value="next_day">Solo desde mañana</SelectItem>
              <SelectItem value="next_week">Solo desde la próxima semana</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracionCitas;
