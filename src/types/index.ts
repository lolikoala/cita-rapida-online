
export type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price?: number;
  created_at: string;
};

export type BusinessHour = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type Appointment = {
  id: string;
  service_id: string;
  service?: Service;
  name: string;
  phone: string;
  date: string;
  time: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};

export type TimeSlot = {
  time: string;
  available: boolean;
};

export type User = {
  id: string;
  username: string;
};

export type BlockedSlot = {
  id: string;
  date: string;
  start_time?: string;
  end_time?: string;
};

export type CustomizationSettings = {
  id: string;
  business_name: string;
  welcome_title: string;
  welcome_subtitle: string;
  booking_instructions: string;
  hero_image_url: string;
  primary_color?: string;
  created_at: string;
  updated_at: string;
};
