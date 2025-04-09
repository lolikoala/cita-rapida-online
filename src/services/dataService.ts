
import { Appointment, BusinessHour, Service, TimeSlot } from "@/types";
import { mockAppointments, mockBusinessHours, mockServices } from "./mockData";
import { format, addMinutes, parse, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

// For now, we will use the mock data
// Later, this will be replaced with Supabase API calls
let services = [...mockServices];
let businessHours = [...mockBusinessHours];
let appointments = [...mockAppointments];

// Services
export const getServices = async (): Promise<Service[]> => {
  return [...services];
};

export const getServiceById = async (id: string): Promise<Service | undefined> => {
  return services.find((service) => service.id === id);
};

export const createService = async (service: Omit<Service, "id" | "created_at">): Promise<Service> => {
  const newService: Service = {
    id: Date.now().toString(),
    ...service,
    created_at: new Date().toISOString(),
  };
  services.push(newService);
  return newService;
};

export const updateService = async (id: string, service: Partial<Service>): Promise<Service | undefined> => {
  const index = services.findIndex((s) => s.id === id);
  if (index !== -1) {
    services[index] = { ...services[index], ...service };
    return services[index];
  }
  return undefined;
};

export const deleteService = async (id: string): Promise<boolean> => {
  const initialLength = services.length;
  services = services.filter((service) => service.id !== id);
  return initialLength > services.length;
};

// Business Hours
export const getBusinessHours = async (): Promise<BusinessHour[]> => {
  return [...businessHours];
};

export const getBusinessHourById = async (id: string): Promise<BusinessHour | undefined> => {
  return businessHours.find((hour) => hour.id === id);
};

export const createBusinessHour = async (hour: Omit<BusinessHour, "id">): Promise<BusinessHour> => {
  const newHour: BusinessHour = {
    id: Date.now().toString(),
    ...hour,
  };
  businessHours.push(newHour);
  return newHour;
};

export const updateBusinessHour = async (id: string, hour: Partial<BusinessHour>): Promise<BusinessHour | undefined> => {
  const index = businessHours.findIndex((h) => h.id === id);
  if (index !== -1) {
    businessHours[index] = { ...businessHours[index], ...hour };
    return businessHours[index];
  }
  return undefined;
};

export const deleteBusinessHour = async (id: string): Promise<boolean> => {
  const initialLength = businessHours.length;
  businessHours = businessHours.filter((hour) => hour.id !== id);
  return initialLength > businessHours.length;
};

// Appointments
export const getAppointments = async (): Promise<Appointment[]> => {
  return [...appointments];
};

export const getAppointmentById = async (id: string): Promise<Appointment | undefined> => {
  return appointments.find((appointment) => appointment.id === id);
};

export const getAppointmentsByPhone = async (phone: string): Promise<Appointment[]> => {
  return appointments.filter((appointment) => appointment.phone === phone);
};

export const createAppointment = async (appointment: Omit<Appointment, "id" | "created_at" | "status">): Promise<Appointment> => {
  const newAppointment: Appointment = {
    id: Date.now().toString(),
    ...appointment,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  appointments.push(newAppointment);
  return newAppointment;
};

export const updateAppointmentStatus = async (id: string, status: "pending" | "accepted" | "rejected"): Promise<Appointment | undefined> => {
  const index = appointments.findIndex((a) => a.id === id);
  if (index !== -1) {
    appointments[index] = { ...appointments[index], status };
    return appointments[index];
  }
  return undefined;
};

// Time Slots
export const getAvailableTimeSlots = async (date: string, serviceId: string): Promise<TimeSlot[]> => {
  // Get day of week for the selected date (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = new Date(date).getDay();
  const dayHours = businessHours.filter((hour) => hour.day_of_week === dayOfWeek);
  
  if (dayHours.length === 0) {
    return [];
  }

  // Get the service to know the duration
  const service = await getServiceById(serviceId);
  if (!service) {
    return [];
  }

  const allTimeSlots: TimeSlot[] = [];
  
  // Generate time slots for each business hour block
  for (const hourBlock of dayHours) {
    const { start_time, end_time } = hourBlock;
    
    // Parse start and end times
    const startTime = parse(start_time, "HH:mm", new Date());
    const endTime = parse(end_time, "HH:mm", new Date());
    
    // Generate slots in 15-minute intervals
    let currentSlot = startTime;
    while (addMinutes(currentSlot, service.duration_minutes) <= endTime) {
      const slotTime = format(currentSlot, "HH:mm");
      
      // Check if the slot is available (not booked)
      const isBooked = appointments.some(
        (appointment) => 
          appointment.date === date && 
          appointment.status !== "rejected" &&
          isTimeSlotOverlapping(
            appointment.time, 
            slotTime, 
            appointment.service_id, 
            serviceId
          )
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

// Helper function to check if two time slots overlap
const isTimeSlotOverlapping = (
  bookedTime: string,
  requestedTime: string,
  bookedServiceId: string,
  requestedServiceId: string
): boolean => {
  const bookedService = services.find((s) => s.id === bookedServiceId);
  const requestedService = services.find((s) => s.id === requestedServiceId);
  
  if (!bookedService || !requestedService) {
    return false;
  }
  
  const bookedStart = parse(bookedTime, "HH:mm", new Date());
  const bookedEnd = addMinutes(bookedStart, bookedService.duration_minutes);
  
  const requestedStart = parse(requestedTime, "HH:mm", new Date());
  const requestedEnd = addMinutes(requestedStart, requestedService.duration_minutes);
  
  // Check if the time slots overlap
  return (
    isWithinInterval(requestedStart, { start: bookedStart, end: bookedEnd }) ||
    isWithinInterval(requestedEnd, { start: bookedStart, end: bookedEnd }) ||
    isWithinInterval(bookedStart, { start: requestedStart, end: requestedEnd })
  );
};

// Helper function to get day name
export const getDayName = (dayNumber: number): string => {
  const date = new Date(2023, 0, dayNumber + 2); // January 2, 2023 was a Monday
  return format(date, "EEEE", { locale: es });
};
