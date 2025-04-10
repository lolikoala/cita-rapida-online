
import { supabase } from "../lib/supabase";

// Interfaz para el usuario administrador
export interface AdminUser {
  id: string;
  username: string;
  password: string; // Esto es solo para uso local, en una app real nunca deberíamos devolver contraseñas
}

// Función para iniciar sesión
export const loginWithCredentials = async (username: string, password: string): Promise<AdminUser | null> => {
  try {
    // En una app real, NUNCA deberíamos hacer esto así (comparar contraseñas en el frontend)
    // Esto es solo para una demo simple
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error) {
      console.error("Error al iniciar sesión:", error);
      return null;
    }

    return data as AdminUser;
  } catch (error) {
    console.error("Error en el servicio de autenticación:", error);
    return null;
  }
};

// Función para verificar si hay un usuario en localStorage
export const getCurrentUser = (): AdminUser | null => {
  const userStr = localStorage.getItem('admin_user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as AdminUser;
  } catch (e) {
    console.error("Error al parsear el usuario desde localStorage:", e);
    return null;
  }
};
