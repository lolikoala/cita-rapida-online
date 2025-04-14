
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getServices } from "@/services/dataService";
import { Service, CustomizationSettings } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const Home = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customization, setCustomization] = useState<CustomizationSettings | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch services
        const servicesData = await getServices();
        setServices(servicesData);
        
        // Fetch customization settings
        const { data, error } = await supabase
          .from("customization_settings")
          .select("*")
          .limit(1)
          .single();
          
        if (!error && data) {
          setCustomization(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBookAppointment = () => {
    navigate("/book");
  };

  const handleCheckAppointment = () => {
    navigate("/check");
  };

  // Default values if no customization is found
  const businessName = customization?.business_name || "Mi Negocio";
  const welcomeTitle = customization?.welcome_title || "Reserva tu cita en minutos";
  const welcomeSubtitle = customization?.welcome_subtitle || 
    "Selecciona el servicio que necesitas, elige una fecha y hora disponible, y reserva tu cita de forma rápida y sencilla.";
  const heroImage = customization?.hero_image_url || 
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2684&auto=format&fit=crop";
  const primaryColor = customization?.primary_color || "#9b87f5";

  // Apply custom primary color if available
  const buttonStyle = customization?.primary_color ? {
    backgroundColor: primaryColor,
    borderColor: primaryColor
  } : {};

  return (
    <div className="space-y-12">
      <section className="relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            opacity: 1,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        <div className="text-center py-12 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{welcomeTitle}</h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8">
            {welcomeSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleBookAppointment} 
              className="gap-2"
              style={buttonStyle}
            >
              <CalendarDays className="h-5 w-5" />
              Reservar Cita
            </Button>
            <Button variant="outline" size="lg" onClick={handleCheckAppointment} className="gap-2">
              <Clock className="h-5 w-5" />
              Consultar Cita
            </Button>
            {!isAuthenticated && (
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={() => navigate("/login")} 
                className="gap-2"
              >
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">Nuestros Servicios</h2>
        {isLoading ? (
          <div className="text-center">Cargando servicios...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    style={buttonStyle}
                  >
                    Reservar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {services.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">
                  No hay servicios disponibles actualmente.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
