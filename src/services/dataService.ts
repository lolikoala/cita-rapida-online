
import { Appointment, BusinessHour, Service, TimeSlot } from "@/types";
import { format, addMinutes, parse, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

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
  
  return data || [];
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
  
  return data;
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
  
  return data;
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
  
  return data;
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
  
  return data || [];
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
  
  return data;
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
  
  return data;
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
  
  return data;
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
  return (data || []).map(appointment => ({
    ...appointment,
    service: appointment.service ? {
      id: appointment.service_id,
      name: appointment.service.name,
      duration_minutes: appointment.service.duration_minutes,
      price: appointment.service.price,
      created_at: '',  // This field isn't used in the UI for the nested service
    } : undefined
  }));
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
  return data ? {
    ...data,
    service: data.service ? {
      id: data.service_id,
      name: data.service.name,
      duration_minutes: data.service.duration_minutes,
      price: data.service.price,
      created_at: '',  // This field isn't used in the UI for the nested service
    } : undefined
  } : undefined;
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
  return (data || []).map(appointment => ({
    ...appointment,
    service: appointment.service ? {
      id: appointment.service_id,
      name: appointment.service.name,
      duration_minutes: appointment.service.duration_minutes,
      price: appointment.service.price,
      created_at: '',  // This field isn't used in the UI for the nested service
    } : undefined
  }));
};

export const createAppointment = async (appointment: Omit<Appointment, "id" | "created_at" | "status">): Promise<Appointment> => {
  const newAppointment = {
    ...appointment,
    status: "pending" as const,
  };
  
  const { data, error } = await supabase
    .from('appointments')
    .insert([newAppointment])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
  
  return data;
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
  
  return data;
};

// Time Slots
export const getAvailableTimeSlots = async (date: string, serviceId: string): Promise<TimeSlot[]> => {
  // Get day of week for the selected date (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = new Date(date).getDay();
  
  // Get business hours for the selected day
  const { data: dayHours, error: hoursError } = await supabase
    .from('business_hours')
    .select('*')
    .eq('day_of_week', dayOfWeek);
  
  if (hoursError) {
    console.error("Error fetching business hours:", hoursError);
    throw hoursError;
  }
  
  if (dayHours.length === 0) {
    return [];
  }

  // Get the service to know the duration
  const service = await getServiceById(serviceId);
  if (!service) {
    return [];
  }

  // Get all appointments for the selected date to check availability
  const { data: dateAppointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*, service:service_id(duration_minutes)')
    .eq('date', date)
    .neq('status', 'rejected'); // Exclude rejected appointments
  
  if (appointmentsError) {
    console.error("Error fetching appointments:", appointmentsError);
    throw appointmentsError;
  }

  const allTimeSlots: TimeSlot[] = [];
  
  // Generate time slots for each business hour block
  for (const hourBlock of dayHours) {
    const { start_time, end_time } = hourBlock;
    
    // Parse start and end times
    const startTime = parse(start_time, "HH:mm:ss", new Date());
    const endTime = parse(end_time, "HH:mm:ss", new Date());
    
    // Generate slots in 15-minute intervals
    let currentSlot = startTime;
    while (addMinutes(currentSlot, service.duration_minutes) <= endTime) {
      const slotTime = format(currentSlot, "HH:mm");
      
      // Check if the slot is available (not booked)
      const isBooked = dateAppointments.some(
        (appointment) => {
          // Convert appointment time to Date for comparison
          const appointmentStart = parse(appointment.time, "HH:mm:ss", new Date());
          const appointmentEnd = addMinutes(
            appointmentStart, 
            appointment.service?.duration_minutes || 30
          );
          
          // Convert current slot time to Date for comparison
          const slotStart = parse(slotTime, "HH:mm", new Date());
          const slotEnd = addMinutes(slotStart, service.duration_minutes);
          
          // Check if the slots overlap
          return (
            isWithinInterval(slotStart, { start: appointmentStart, end: appointmentEnd }) ||
            isWithinInterval(slotEnd, { start: appointmentStart, end: appointmentEnd }) ||
            isWithinInterval(appointmentStart, { start: slotStart, end: slotEnd })
          );
        }
      );
      
      allTimeSlots.push({
        time: slotTime,
        available: !isBooked,
      });
      
      // Move to next 15-minute slot
      currentSlot = addMinutes(currentSlot, 15);
    }
  }
  
  return allTimeSlots;
};

// Helper function to get day name
export const getDayName = (dayNumber: number): string => {
  const date = new Date(2023, 0, dayNumber + 2); // January 2, 2023 was a Monday
  return format(date, "EEEE", { locale: es });
};
