
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays } from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Cita Rápida</span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            Inicio
          </Link>
          <Link to="/check" className="text-muted-foreground hover:text-foreground">
            Consultar Cita
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/admin/dashboard" className="text-muted-foreground hover:text-foreground">
                Panel Admin
              </Link>
              <Button variant="outline" onClick={logout}>
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
