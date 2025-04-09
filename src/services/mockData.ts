
import { Appointment, BusinessHour, Service } from "@/types";

// Mock data for services
export const mockServices: Service[] = [
  {
    id: "1",
    name: "Corte de cabello",
    duration_minutes: 30,
    price: 15.0,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Tinte completo",
    duration_minutes: 120,
    price: 45.0,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Manicura",
    duration_minutes: 45,
    price: 20.0,
    created_at: new Date().toISOString(),
  },
];

// Mock data for business hours
export const mockBusinessHours: BusinessHour[] = [
  {
    id: "1",
    day_of_week: 1, // Monday
    start_time: "09:00",
    end_time: "14:00",
  },
  {
    id: "2",
    day_of_week: 1, // Monday
    start_time: "16:00",
    end_time: "20:00",
  },
  {
    id: "3",
    day_of_week: 2, // Tuesday
    start_time: "09:00",
    end_time: "14:00",
  },
  {
    id: "4",
    day_of_week: 2, // Tuesday
    start_time: "16:00",
    end_time: "20:00",
  },
  {
    id: "5",
    day_of_week: 3, // Wednesday
    start_time: "09:00",
    end_time: "14:00",
  },
  {
    id: "6",
    day_of_week: 3, // Wednesday
    start_time: "16:00",
    end_time: "20:00",
  },
];

// Mock data for appointments
export const mockAppointments: Appointment[] = [
  {
    id: "1",
    service_id: "1",
    name: "Juan Pérez",
    phone: "600123456",
    date: "2025-04-10",
    time: "10:00",
    status: "accepted",
    created_at: "2025-04-09T10:30:00Z",
  },
  {
    id: "2",
    service_id: "2",
    name: "María López",
    phone: "600789123",
    date: "2025-04-10",
    time: "16:00",
    status: "pending",
    created_at: "2025-04-09T11:45:00Z",
  },
  {
    id: "3",
    service_id: "3",
    name: "Carlos Rodríguez",
    phone: "600456789",
    date: "2025-04-11",
    time: "11:00",
    status: "rejected",
    created_at: "2025-04-09T14:20:00Z",
  },
];
