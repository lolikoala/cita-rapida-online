
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";

// Public pages
import Home from "@/pages/Home";
import BookAppointment from "@/pages/BookAppointment";
import CheckAppointment from "@/pages/CheckAppointment";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

// Admin pages
import Dashboard from "@/pages/admin/Dashboard";
import BusinessHoursManagement from "@/pages/admin/BusinessHoursManagement";
import ServicesManagement from "@/pages/admin/ServicesManagement";
import AppointmentsManagement from "@/pages/admin/AppointmentsManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Routes */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/book" element={<BookAppointment />} />
              <Route path="/check" element={<CheckAppointment />} />
              <Route path="/login" element={<Login />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="business-hours" element={<BusinessHoursManagement />} />
              <Route path="services" element={<ServicesManagement />} />
              <Route path="appointments" element={<AppointmentsManagement />} />
            </Route>
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
