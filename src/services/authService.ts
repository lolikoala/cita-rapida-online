
import { supabase } from "@/integrations/supabase/client";

export const signInWithCredentials = async (username: string, password: string) => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Credenciales incorrectas");
  }

  return data;
};

export const getCurrentUser = async () => {
  // Check if user is stored in localStorage
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return null;
  }
  
  return JSON.parse(storedUser);
};

export const getSession = async () => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return null;
  }
  
  return { user: JSON.parse(storedUser) };
};
