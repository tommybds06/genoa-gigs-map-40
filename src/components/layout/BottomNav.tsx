import {
  MappaIcon, ListaIcon, AnnunciIcon, MessaggiIcon, ProfiloIcon,
  MappaVuotaIcon, ListaVuotaIcon, AnnunciVuotaIcon, MessaggiVuotaIcon, ProfiloVuotaIcon,
} from "@/components/icons/uiIcons";
import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { posa } from "@/lib/aScatti";
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
  // L'ICONA SCELTA FA UNA POSA a scatti (19 novembre): si gonfia, rimbalza e
  // si assesta. Prima sfumava e si ingrandiva liscia in 300 ms: la carta va a
  // scatti (§30). Non alla prima apertura: solo quando si CAMBIA scheda.
  const icone = useRef(new Map<string, HTMLDivElement>());
  const prima = useRef<string | null>(null);
  useEffect(() => {
    const ora = location.pathname;
    if (prima.current !== null && prima.current !== ora) posa(icone.current.get(ora) ?? null);
    prima.current = ora;
  }, [location.pathname]);

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
    <nav className="fixed bottom-0 left-0 right-0 z-[49] material-nav linea-divisoria-sopra safe-bottom">
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
              {/* Il colore sta sulla SINGOLA voce, non su tutte.
                  Prima erano tutte del colore del ruolo e l'attiva si
                  distingueva solo per pieno contro vuoto: su schermo piccolo
                  la differenza era quasi impercettibile. Ora il salto e' di
                  colore — inattive in bruno tenue, attiva nel colore del
                  ruolo — che e' quello che fa il lavoro nello schema da cui
                  questa nav e' ripresa. */}
              <div
                ref={(el) => {
                  if (el) icone.current.set(item.path, el);
                  else icone.current.delete(item.path);
                }}
                className={`relative w-7 h-7 ${
                  isActive
                    ? `${colorClass} scale-110`
                    : "text-muted-foreground scale-100"
                }`}
              >
                <Outline
                  className={`absolute inset-0 w-7 h-7 ${item.iconClass ?? ""} ${
                    isActive ? "opacity-0" : "opacity-100"
                  }`}
                />
                <Filled
                  className={`absolute inset-0 w-7 h-7 ${item.iconClass ?? ""} ${
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
