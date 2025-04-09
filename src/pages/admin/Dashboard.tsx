
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppointments, getServices, getBusinessHours } from "@/services/dataService";
import { Calendar, Clock, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Dashboard = () => {
  const [appointmentsCount, setAppointmentsCount] = useState({
    pending: 0,
    accepted: 0,
    rejected: 0,
    total: 0,
  });
  const [servicesCount, setServicesCount] = useState(0);
  const [businessHoursCount, setBusinessHoursCount] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch appointments
        const appointments = await getAppointments();
        
        // Count by status
        const pending = appointments.filter(a => a.status === "pending").length;
        const accepted = appointments.filter(a => a.status === "accepted").length;
        const rejected = appointments.filter(a => a.status === "rejected").length;
        
        // Count today's appointments
        const today = format(new Date(), "yyyy-MM-dd");
        const todayCount = appointments.filter(a => a.date === today && a.status === "accepted").length;
        
        setAppointmentsCount({
          pending,
          accepted,
          rejected,
          total: appointments.length,
        });
        setTodayAppointments(todayCount);
        
        // Fetch services
        const services = await getServices();
        setServicesCount(services.length);
        
        // Fetch business hours
        const hours = await getBusinessHours();
        setBusinessHoursCount(hours.length);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">{today}</p>

      {isLoading ? (
        <div className="text-center py-8">Cargando datos...</div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Pendientes</CardTitle>
                <AlertCircle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appointmentsCount.pending}</div>
                <p className="text-xs text-muted-foreground">
                  {appointmentsCount.pending === 1 ? "Cita pendiente de confirmar" : "Citas pendientes de confirmar"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  {todayAppointments === 1 ? "Cita programada para hoy" : "Citas programadas para hoy"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Totales</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appointmentsCount.total}</div>
                <p className="text-xs text-muted-foreground">
                  {appointmentsCount.accepted} confirmadas, {appointmentsCount.rejected} rechazadas
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Configuración</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{servicesCount}</div>
                <p className="text-xs text-muted-foreground">
                  Servicios configurados, {businessHoursCount} franjas horarias
                </p>
              </CardContent>
            </Card>
          </section>
          
          <section className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Información rápida</CardTitle>
                <CardDescription>Resumen del sistema de citas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Franjas Horarias</p>
                    <p className="text-xs text-muted-foreground">{businessHoursCount} configuradas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Servicios</p>
                    <p className="text-xs text-muted-foreground">{servicesCount} disponibles para clientes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium">Tasa de Aceptación</p>
                    <p className="text-xs text-muted-foreground">
                      {appointmentsCount.total > 0
                        ? `${Math.round((appointmentsCount.accepted / appointmentsCount.total) * 100)}% de citas confirmadas`
                        : "No hay datos suficientes"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-sm font-medium">Pendientes de Revisión</p>
                    <p className="text-xs text-muted-foreground">
                      {appointmentsCount.pending === 0
                        ? "No hay citas pendientes de revisión"
                        : `${appointmentsCount.pending} citas requieren tu atención`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
