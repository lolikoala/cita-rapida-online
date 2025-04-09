
import { Appointment, BusinessHour, Service, TimeSlot } from "@/types";
import { format, addMinutes, parse, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type DbService = Database['public']['Tables']['services']['Row'];
type DbBusinessHour = Database['public']['Tables']['business_hours']['Row'];
type DbAppointment = Database['public']['Tables']['appointments']['Row'];

// Helper function to convert from database service to app service
const mapDbServiceToService = (dbService: DbService): Service => ({
  id: dbService.id,
  name: dbService.name,
  duration_minutes: dbService.duration_minutes,
  price: dbService.price || undefined,
  created_at: dbService.created_at
});

// Helper function to convert from database business hour to app business hour
const mapDbBusinessHourToBusinessHour = (dbBusinessHour: DbBusinessHour): BusinessHour => ({
  id: dbBusinessHour.id,
  day_of_week: dbBusinessHour.day_of_week,
  start_time: dbBusinessHour.start_time,
  end_time: dbBusinessHour.end_time
});

// Helper function to convert from database appointment to app appointment
const mapDbAppointmentToAppointment = (dbAppointment: DbAppointment, service?: Service): Appointment => ({
  id: dbAppointment.id,
  service_id: dbAppointment.service_id,
  name: dbAppointment.name,
  phone: dbAppointment.phone,
  date: dbAppointment.date,
  time: dbAppointment.time,
  status: dbAppointment.status as 'pending' | 'accepted' | 'rejected',
  created_at: dbAppointment.created_at,
  service
});

// Services
export const getServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching services:", error);
    throw error;
  }
  
  return (data || []).map(mapDbServiceToService);
};

export const getServiceById = async (id: string): Promise<Service | undefined> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return undefined;
    }
    console.error("Error fetching service:", error);
    throw error;
  }
  
  return mapDbServiceToService(data);
};

export const createService = async (service: Omit<Service, "id" | "created_at">): Promise<Service> => {
  const { data, error } = await supabase
    .from('services')
    .insert([service])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating service:", error);
    throw error;
  }
  
  return mapDbServiceToService(data);
};

export const updateService = async (id: string, service: Partial<Service>): Promise<Service | undefined> => {
  const { data, error } = await supabase
    .from('services')
    .update(service)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating service:", error);
    throw error;
  }
  
  return mapDbServiceToService(data);
};

export const deleteService = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
  
  return true;
};

// Business Hours
export const getBusinessHours = async (): Promise<BusinessHour[]> => {
  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });
  
  if (error) {
    console.error("Error fetching business hours:", error);
    throw error;
  }
  
  return (data || []).map(mapDbBusinessHourToBusinessHour);
};

export const getBusinessHourById = async (id: string): Promise<BusinessHour | undefined> => {
  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return undefined;
    }
    console.error("Error fetching business hour:", error);
    throw error;
  }
  
  return mapDbBusinessHourToBusinessHour(data);
};

export const createBusinessHour = async (hour: Omit<BusinessHour, "id">): Promise<BusinessHour> => {
  const { data, error } = await supabase
    .from('business_hours')
    .insert([hour])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating business hour:", error);
    throw error;
  }
  
  return mapDbBusinessHourToBusinessHour(data);
};

export const updateBusinessHour = async (id: string, hour: Partial<BusinessHour>): Promise<BusinessHour | undefined> => {
  const { data, error } = await supabase
    .from('business_hours')
    .update(hour)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating business hour:", error);
    throw error;
  }
  
  return mapDbBusinessHourToBusinessHour(data);
};

export const deleteBusinessHour = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('business_hours')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Error deleting business hour:", error);
    throw error;
  }
  
  return true;
};

// Appointments
export const getAppointments = async (): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, service:service_id(name, duration_minutes, price)')
    .order('date', { ascending: true })
    .order('time', { ascending: true });
  
  if (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }
  
  // Map the nested service object to match our expected type
  return (data || []).map(appointment => {
    const service = appointment.service ? {
      id: appointment.service_id,
      name: appointment.service.name,
      duration_minutes: appointment.service.duration_minutes,
      price: appointment.service.price || undefined,
      created_at: '' // This field isn't used in the UI for the nested service
    } : undefined;
    
    return mapDbAppointmentToAppointment(appointment, service);
  });
};

export const getAppointmentById = async (id: string): Promise<Appointment | undefined> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, service:service_id(name, duration_minutes, price)')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return undefined;
    }
    console.error("Error fetching appointment:", error);
    throw error;
  }
  
  // Map the nested service object to match our expected type
  const service = data.service ? {
    id: data.service_id,
    name: data.service.name,
    duration_minutes: data.service.duration_minutes,
    price: data.service.price || undefined,
    created_at: '' // This field isn't used in the UI for the nested service
  } : undefined;
  
  return mapDbAppointmentToAppointment(data, service);
};

export const getAppointmentsByPhone = async (phone: string): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, service:service_id(name, duration_minutes, price)')
    .eq('phone', phone)
    .order('date', { ascending: true })
    .order('time', { ascending: true });
  
  if (error) {
    console.error("Error fetching appointments by phone:", error);
    throw error;
  }
  
  // Map the nested service object to match our expected type
  return (data || []).map(appointment => {
    const service = appointment.service ? {
      id: appointment.service_id,
      name: appointment.service.name,
      duration_minutes: appointment.service.duration_minutes,
      price: appointment.service.price || undefined,
      created_at: '' // This field isn't used in the UI for the nested service
    } : undefined;
    
    return mapDbAppointmentToAppointment(appointment, service);
  });
};


export const updateAppointmentStatus = async (id: string, status: "pending" | "accepted" | "rejected"): Promise<Appointment | undefined> => {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating appointment status:", error);
    throw error;
  }
  
  return {
    ...data,
    status: data.status as 'pending' | 'accepted' | 'rejected'
  };
};

// Time Slots
export const getAvailableTimeSlots = async (
  date: string,
  serviceId: string
): Promise<TimeSlot[]> => {
  const [hoursRes, appointmentsRes, blockedRes] = await Promise.all([
    supabase.from("business_hours").select("*"),
    supabase
      .from("appointments")
      .select("*")
      .eq("date", date)
      .eq("status", "accepted"),
    supabase
      .from("blocked_slots")
      .select("*")
      .eq("date", date)
  ]);

  const businessHours = hoursRes.data || [];
  const appointments = appointmentsRes.data || [];
  const blockedSlots = blockedRes.data || [];

  const dayOfWeek = new Date(date).getDay();
  const todayHours = businessHours.filter((h) => h.day_of_week === dayOfWeek);

  if (todayHours.length === 0) return [];

  const serviceRes = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single();

  const duration = serviceRes.data?.duration_minutes || 30;

  // Verificar si el día está bloqueado completo
  const isDayBlocked = blockedSlots.some((b) => !b.start_time && !b.end_time);
  if (isDayBlocked) return [];

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];

    for (const block of todayHours) {
      const [startHour, startMin] = block.start_time.split(":").map(Number);
      const [endHour, endMin] = block.end_time.split(":").map(Number);

      const start = new Date(`${date}T${block.start_time}`);
      const end = new Date(`${date}T${block.end_time}`);

      for (
        let time = new Date(start);
        time <= new Date(end.getTime() - duration * 60000);
        time.setMinutes(time.getMinutes() + duration)
      ) {
        const timeString = time.toTimeString().slice(0, 5);

        const isTaken = appointments.some((a) => a.time === timeString);
        const isBlocked = blockedSlots.some((b) => {
          if (!b.start_time || !b.end_time) return false;
          return timeString >= b.start_time && timeString < b.end_time;
        });

        slots.push({
          time: timeString,
          available: !isTaken && !isBlocked,
        });
      }
    }

    return slots;
  };

  return generateTimeSlots();
};

export const getAppointmentsWithService = async (date: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, service:service_id(duration_minutes)')
    .eq('date', date)
    .neq('status', 'rejected'); // Exclude rejected appointments

  if (error) {
    console.error("Error fetching appointments with services:", error);
    return [];
  }

  return data;
};


// Helper function to get day name
export const getDayName = (dayNumber: number): string => {
  const date = new Date(2023, 0, dayNumber + 1); // 0 (domingo) → lunes
  return format(date, "EEEE", { locale: es });
};



export const createAppointment = async (
  appointment: Omit<Appointment, "id" | "created_at"> & { status?: "pending" | "accepted" | "rejected" }
): Promise<Appointment> => {
  const newAppointment = {
    ...appointment,
    status: appointment.status || "pending"
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert([newAppointment])
    .select()
    .single();

  if (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }

  return {
    ...data,
    status: data.status as "pending" | "accepted" | "rejected"
  };
};

export const deleteAppointments = async (ids: string[]): Promise<void> => {
  const { error } = await supabase
    .from("appointments")
    .delete()
    .in("id", ids);

  if (error) {
    console.error("Error deleting appointments:", error);
    throw error;
  }
};
