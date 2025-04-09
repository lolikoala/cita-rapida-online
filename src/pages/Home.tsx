
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getServices } from "@/services/dataService";
import { Service } from "@/types";

const Home = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleBookAppointment = () => {
    navigate("/book");
  };

  const handleCheckAppointment = () => {
    navigate("/check");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Reserva tu cita en minutos</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
          Selecciona el servicio que necesitas, elige una fecha y hora disponible, y reserva tu cita de forma rápida y sencilla.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={handleBookAppointment} className="gap-2">
            <CalendarDays className="h-5 w-5" />
            Reservar Cita
          </Button>
          <Button variant="outline" size="lg" onClick={handleCheckAppointment} className="gap-2">
            <Clock className="h-5 w-5" />
            Consultar Cita
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">Nuestros Servicios</h2>
        {isLoading ? (
          <div className="text-center">Cargando servicios...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>Duración: {service.duration_minutes} minutos</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-2xl font-bold mb-4">
                    {service.price ? `${service.price.toFixed(2)} €` : "Consultar precio"}
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => navigate(`/book?serviceId=${service.id}`)}
                  >
                    Reservar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
