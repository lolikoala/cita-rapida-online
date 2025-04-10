
import React, { createContext, useContext, useState, useEffect } from "react";
import { loginWithCredentials, getCurrentUser, AdminUser } from "@/services/authService";
import { toast } from "sonner";

interface AuthContextType {
  currentUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const initialContext: AuthContextType = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
};

const AuthContext = createContext<AuthContextType>(initialContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setCurrentUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const user = await loginWithCredentials(username, password);
      
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('admin_user', JSON.stringify(user));
        toast.success(`Bienvenido, ${user.username}`);
        return true;
      } else {
        toast.error("Credenciales incorrectas");
        return false;
      }
    } catch (error) {
      console.error("Error de autenticación:", error);
      toast.error("Error al iniciar sesión");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('admin_user');
    setCurrentUser(null);
    toast.info("Has cerrado sesión");
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
