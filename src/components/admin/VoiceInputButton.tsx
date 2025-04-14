import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Service } from "@/types";

interface VoiceInputButtonProps {
  services: Service[];
  onDataExtracted: (data: {
    name?: string;
    phone?: string;
    date?: string;
    time?: string;
    service_id?: string;
  }) => void;
}

const VoiceInputButton = ({ services, onDataExtracted }: VoiceInputButtonProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Tu navegador no soporta reconocimiento de voz");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onerror = (event: any) => {
      console.error("SpeechRecognition error:", event);
      toast.error(`Error en reconocimiento de voz: ${event.error}`);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log("Texto reconocido:", transcript);
      const extracted = parseSpeech(transcript);
      if (extracted) {
        onDataExtracted(extracted);
        toast.success("Datos extraídos correctamente");
        setIsOpen(false);
      } else {
        toast.error("No se pudieron extraer los datos de la cita");
      }
    };

    recognition.start();
  };

  const parseSpeech = (text: string) => {
    const data: any = {};

    // Teléfono (buscar cualquier grupo de 9 dígitos)
    const phoneMatch = text.match(/\b(\d{9})\b/);
    if (phoneMatch) {
      data.phone = phoneMatch[1];
    }

    // Nombre: buscar "a X", "para X" (evitando palabras como "una cita para")
    const nombreMatch = text.match(/(?:agendar a|cita para|para|a)\s+([a-záéíóúñ]+)/i);
    if (nombreMatch) {
      const nombreDetectado = nombreMatch[1];
      if (!['una', 'la', 'cita'].includes(nombreDetectado)) {
        data.name = nombreDetectado.charAt(0).toUpperCase() + nombreDetectado.slice(1);
      }
    }

    // Fecha
    const dayMatch = text.match(/(lunes|martes|miércoles|jueves|viernes|sábado|domingo|mañana|pasado mañana|hoy|\d{1,2} de \w+)/);
    const now = new Date();
    const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

    if (dayMatch) {
      const dia = dayMatch[1];
      let fecha: Date | null = null;

      if (diasSemana.includes(dia)) {
        const targetDay = diasSemana.indexOf(dia);
        const currentDay = now.getDay();
        const daysToAdd = (targetDay - currentDay + 7) % 7 || 7;
        fecha = addDays(now, daysToAdd);
      } else if (dia === "mañana") {
        fecha = addDays(now, 1);
      } else if (dia === "pasado mañana") {
        fecha = addDays(now, 2);
      } else if (dia === "hoy") {
        fecha = now;
      } else {
        const parsed = new Date(`${dia} ${now.getFullYear()}`);
        if (!isNaN(parsed.getTime())) fecha = parsed;
      }

      if (fecha) data.date = format(fecha, "yyyy-MM-dd");
    }

    // Hora
    const hourMatch = text.match(/a\s+las\s+(\d{1,2})(?::(\d{2}))?/);
    if (hourMatch) {
      const h = hourMatch[1].padStart(2, '0');
      const m = hourMatch[2] || "00";
      data.time = `${h}:${m}`;
    }

    // Servicio
    const servicioDetectado = services.find(service =>
      text.includes(service.name.toLowerCase())
    );
    if (servicioDetectado) {
      data.service_id = servicioDetectado.id;
    }

    return Object.keys(data).length ? data : null;
  };

  return (
    <div className="absolute top-2 right-2 z-10">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" onClick={startListening}>
            <Mic className="mr-2 h-4 w-4" /> Dictar cita
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <Badge variant="secondary">
              {isListening ? "Escuchando..." : "Procesando..."}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Di algo como: "Agenda a María el jueves a las 4 de la tarde para masaje"
            </p>
            <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
              Cerrar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VoiceInputButton;
