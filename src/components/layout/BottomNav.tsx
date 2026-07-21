import {
  MappaIcon, ListaIcon, AnnunciIcon, MessaggiIcon, ProfiloIcon,
  MappaVuotaIcon, ListaVuotaIcon, AnnunciVuotaIcon, MessaggiVuotaIcon, ProfiloVuotaIcon,
} from "@/components/icons/uiIcons";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

interface NavItem {
  outline: React.ElementType;
  filled: React.ElementType;
  label: string;
  path: string;
  iconClass?: string;
}

export function BottomNav() {
  const location = useLocation();
  const { isEmployer, loading, hasLoaded } = useUser();

  // Colore del ruolo; neutro finché il profilo non è caricato per evitare flash
  const colorClass =
    loading && !hasLoaded
      ? "text-muted-foreground"
      : isEmployer
      ? "text-employer"
      : "text-primary";

  const navItems: NavItem[] = [
    { outline: MappaVuotaIcon, filled: MappaIcon, label: "Mappa", path: "/" },
    isEmployer
      ? { outline: AnnunciVuotaIcon, filled: AnnunciIcon, label: "Annunci", path: "/annunci" }
      : { outline: ListaVuotaIcon, filled: ListaIcon, label: "Lista", path: "/lista" },
    { outline: MessaggiVuotaIcon, filled: MessaggiIcon, label: "Messaggi", path: "/messaggi" },
    { outline: ProfiloVuotaIcon, filled: ProfiloIcon, label: "Profilo", path: "/profilo" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 material-nav safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Outline = item.outline;
          const Filled = item.filled;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className="flex items-center justify-center px-6 py-3 touch-feedback"
            >
              <div
                className={`relative w-7 h-7 ${colorClass} transition-transform duration-300 ${
                  isActive ? "scale-110" : "scale-100"
                }`}
              >
                <Outline
                  className={`absolute inset-0 w-7 h-7 transition-opacity duration-300 ${item.iconClass ?? ""} ${
                    isActive ? "opacity-0" : "opacity-100"
                  }`}
                />
                <Filled
                  className={`absolute inset-0 w-7 h-7 transition-opacity duration-300 ${item.iconClass ?? ""} ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
