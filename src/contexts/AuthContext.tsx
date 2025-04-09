
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Establish auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        if (currentSession?.user) {
          const user = { 
            id: currentSession.user.id, 
            username: currentSession.user.email || "admin" 
          };
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          const user = { 
            id: currentSession.user.id, 
            username: currentSession.user.email || "admin" 
          };
          setUser(user);
          setSession(currentSession);
          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        const user = { 
          id: data.user.id, 
          username: data.user.email || "admin" 
        };
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        toast({
          title: "Login successful",
          variant: "default",
        });
        navigate("/admin/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Check for specific error cases
      if (error.message?.includes("Email not confirmed")) {
        toast({
          title: "Email not confirmed",
          description: "Please check your email and confirm your account",
          variant: "destructive",
        });
      } else if (error.message?.includes("Invalid login credentials")) {
        toast({
          title: "Invalid credentials",
          description: "Please check your email and password",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: error.message || "An error occurred during login",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem("user");
      toast({
        title: "Logged out successfully",
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
