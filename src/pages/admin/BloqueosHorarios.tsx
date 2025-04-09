import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface BlockedSlot {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
}

const BloqueosHorarios = () => {
  const [date, setDate] = useState<Date | undefined>();
  const [blockAllDay, setBlockAllDay] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [bloqueos, setBloqueos] = useState<BlockedSlot[]>([]);

  const fetchBloqueos = async () => {
    const { data, error } = await supabase
      .from("blocked_slots")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      toast.error("Error al cargar bloqueos");
    } else {
      setBloqueos(data || []);
    }
  };

  useEffect(() => {
    fetchBloqueos();
  }, []);

  const handleSave = async () => {
    if (!date) {
      toast.error("Selecciona una fecha");
      return;
    }

    if (!blockAllDay && (!startTime || !endTime)) {
      toast.error("Completa el horario a bloquear");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("blocked_slots").insert({
      date: format(date, "yyyy-MM-dd"),
      start_time: blockAllDay ? null : startTime,
      end_time: blockAllDay ? null : endTime,
    });

    setLoading(false);

    if (error) {
      toast.error("Error al guardar el bloqueo");
    } else {
      toast.success("Bloqueo registrado");
      setDate(undefined);
      setStartTime("");
      setEndTime("");
      setBlockAllDay(true);
      fetchBloqueos(); // recargar
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blocked_slots").delete().eq("id", id);

    if (error) {
      toast.error("No se pudo eliminar");
    } else {
      toast.success("Bloqueo eliminado");
      setBloqueos((prev) => prev.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bloquear horario o día</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Selecciona una fecha</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="mt-2"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="block-all"
              checked={blockAllDay}
              onCheckedChange={() => setBlockAllDay(!blockAllDay)}
            />
            <Label htmlFor="block-all">Bloquear día completo</Label>
          </div>

          {!blockAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start">Desde</Label>
                <Input
                  id="start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end">Hasta</Label>
                <Input
                  id="end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Guardando..." : "Guardar bloqueo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Listado de bloqueos */}
      <Card>
        <CardHeader>
          <CardTitle>Bloqueos existentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {bloqueos.length === 0 ? (
            <p className="text-muted-foreground">No hay bloqueos registrados</p>
          ) : (
            bloqueos.map((b) => (
              <div
                key={b.id}
                className="flex justify-between items-center border rounded-md p-3 bg-muted"
              >
                <div>
                  <p className="font-medium">
                    {format(parseISO(b.date), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {b.start_time && b.end_time
                      ? `Bloqueado de ${b.start_time} a ${b.end_time}`
                      : "Bloqueo de día completo"}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(b.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BloqueosHorarios;
