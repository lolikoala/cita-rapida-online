
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { format, parse, addDays, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Service } from "@/types";

// Define the WebkitSpeechRecognition type for TypeScript
interface Window {
  webkitSpeechRecognition: any;
}

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
  const [transcript, setTranscript] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if the browser supports speech recognition
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Tu navegador no soporta reconocimiento de voz");
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "es-ES";
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      parseTranscript(transcript);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Error en reconocimiento de voz:", event.error);
      toast.error("Error en reconocimiento de voz");
      stopListening();
    };

    recognitionRef.current.onend = () => {
      stopListening();
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    setIsListening(true);
    setTranscript("");
    setIsOpen(true);
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  const parseTranscript = (text: string) => {
    const data: {
      name?: string;
      phone?: string;
      date?: string;
      time?: string;
      service_id?: string;
    } = {};

    // Extract name (assume the first proper noun is the name)
    const nameRegex = /(?:para|a)\s+([A-ZÁ-Úa-zá-ú]+(?:\s+[A-ZÁ-Úa-zá-ú]+)?)/i;
    const nameMatch = text.match(nameRegex);
    if (nameMatch && nameMatch[1]) {
      data.name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
    }

    // Extract phone (if mentioned, it's digits in sequence)
    const phoneRegex = /\b(\d{9,10})\b/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch && phoneMatch[1]) {
      data.phone = phoneMatch[1];
    }

    // Extract date (handle weekdays, tomorrow, specific dates)
    const today = new Date();
    
    // Check for "mañana"
    if (text.toLowerCase().includes("mañana")) {
      const tomorrow = addDays(today, 1);
      data.date = format(tomorrow, "yyyy-MM-dd");
    } 
    // Check for weekdays
    else {
      const weekdayRegex = /(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/i;
      const weekdayMatch = text.match(weekdayRegex);
      
      if (weekdayMatch && weekdayMatch[1]) {
        const weekdays = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
        const targetDay = weekdays.indexOf(weekdayMatch[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        
        if (targetDay !== -1) {
          // Calculate days until the next occurrence of the target day
          const currentDay = today.getDay();
          let daysUntilTarget = targetDay - currentDay;
          if (daysUntilTarget <= 0) daysUntilTarget += 7; // If the day has passed this week, get next week
          
          const targetDate = addDays(today, daysUntilTarget);
          data.date = format(targetDate, "yyyy-MM-dd");
        }
      } else {
        // Try to extract a specific date like "14 de abril" or "14/04"
        const dateRegex = /(\d{1,2})(?:\s+de\s+|\/)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|\d{1,2})/i;
        const dateMatch = text.match(dateRegex);
        
        if (dateMatch) {
          const day = parseInt(dateMatch[1], 10);
          let month;
          
          if (isNaN(parseInt(dateMatch[2], 10))) {
            // Month as word
            const months = {
              "enero": 0, "febrero": 1, "marzo": 2, "abril": 3, "mayo": 4, "junio": 5, 
              "julio": 6, "agosto": 7, "septiembre": 8, "octubre": 9, "noviembre": 10, "diciembre": 11
            };
            month = months[dateMatch[2].toLowerCase() as keyof typeof months];
          } else {
            // Month as number
            month = parseInt(dateMatch[2], 10) - 1;
          }
          
          if (month !== undefined && day > 0 && day <= 31) {
            const extractedDate = new Date(today.getFullYear(), month, day);
            // If the date has passed this year, move to next year
            if (extractedDate < today) {
              extractedDate.setFullYear(today.getFullYear() + 1);
            }
            if (isValid(extractedDate)) {
              data.date = format(extractedDate, "yyyy-MM-dd");
            }
          }
        }
      }
    }

    // Extract time
    const timeRegex = /(?:a las|las)\s+(\d{1,2})(?::(\d{2}))?(?:\s+(am|pm|de la tarde|de la mañana|de la manana))?/i;
    const timeMatch = text.match(timeRegex);
    
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const period = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
      
      // Adjust hours based on period
      if (period === "pm" || period?.includes("tarde")) {
        if (hours < 12) hours += 12;
      } else if ((period === "am" || period?.includes("mañana") || period?.includes("manana")) && hours === 12) {
        hours = 0;
      }
      
      // If no period is specified and hour is 1-11, assume it's afternoon (common in Spanish)
      if (!period && hours >= 1 && hours <= 11) {
        hours += 12;
      }
      
      data.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Extract service
    services.forEach(service => {
      const serviceRegex = new RegExp(`(para|de)\\s+${service.name.toLowerCase()}`, 'i');
      if (serviceRegex.test(text.toLowerCase())) {
        data.service_id = service.id;
      }
    });

    // If no service found, check for common keywords
    if (!data.service_id) {
      const serviceKeywords: { [key: string]: string[] } = {};
      
      // Map services to keywords
      services.forEach(service => {
        serviceKeywords[service.id] = [service.name.toLowerCase()];
        
        // Add common variations or abbreviations
        if (service.name.toLowerCase().includes("corte")) {
          serviceKeywords[service.id].push("cortar", "pelo", "cabello", "peluquería", "peluqueria");
        }
        if (service.name.toLowerCase().includes("uña")) {
          serviceKeywords[service.id].push("uñas", "manicura", "manicure");
        }
        if (service.name.toLowerCase().includes("depil")) {
          serviceKeywords[service.id].push("depilación", "depilacion", "depilar", "cera");
        }
        if (service.name.toLowerCase().includes("masa")) {
          serviceKeywords[service.id].push("masaje", "relajante", "terapia");
        }
      });
      
      // Check text against service keywords
      for (const [id, keywords] of Object.entries(serviceKeywords)) {
        for (const keyword of keywords) {
          if (text.toLowerCase().includes(keyword)) {
            data.service_id = id;
            break;
          }
        }
        if (data.service_id) break;
      }
    }

    // Only proceed if we have at least some data
    if (data.name || data.date || data.time || data.service_id) {
      onDataExtracted(data);
      toast.success("Datos reconocidos correctamente");
    } else {
      toast.error("No se pudieron reconocer los datos. Intenta de nuevo.");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="absolute right-4 top-12 lg:right-6 lg:top-16 shadow-md hover:shadow-lg bg-white z-10 rounded-full w-12 h-12"
          onClick={startListening}
        >
          {isListening ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5 text-primary" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {isListening ? (
              <Badge className="bg-red-500">Escuchando...</Badge>
            ) : (
              <Badge>Procesando...</Badge>
            )}
          </div>
          
          <div className="text-sm">
            <p className="font-medium">Di algo como:</p>
            <p className="text-muted-foreground italic mt-1">"Agendar a María el jueves a las 4 de la tarde para manicura"</p>
          </div>
          
          {transcript && (
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Texto reconocido:</p>
              <p className="text-sm italic">{transcript}</p>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                stopListening();
                setIsOpen(false);
              }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default VoiceInputButton;
