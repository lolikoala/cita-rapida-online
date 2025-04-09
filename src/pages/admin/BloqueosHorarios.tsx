import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BloqueosHorarios = () => {
  const [date, setDate] = useState<Date | undefined>();
  const [blockAllDay, setBlockAllDay] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

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
      console.error(error);
    } else {
      toast.success("Bloqueo registrado con éxito");
      setStartTime("");
      setEndTime("");
      setDate(undefined);
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
    </div>
  );
};

export default BloqueosHorarios;
