
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <>
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
    </>
  );

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Cita Rápida</span>
        </Link>
        
        {isMobile ? (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px]">
              <div className="mt-8 flex flex-col space-y-6">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="flex items-center space-x-6">
            <NavLinks />
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
