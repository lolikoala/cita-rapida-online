
import { NavLink } from "react-router-dom";
import { CalendarDays, Clock, ShoppingBag, Users, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const AdminSidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    {
      title: "Dashboard",
      path: "/admin/dashboard",
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      title: "Horarios",
      path: "/admin/business-hours",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      title: "Servicios",
      path: "/admin/services",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: "Citas",
      path: "/admin/appointments",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <div className="w-64 bg-card border-r h-screen sticky top-0">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Admin Panel
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              {item.icon}
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 mt-auto">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
