import { Map, List, MessageCircle, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Map, label: "Mappa", path: "/" },
  { icon: List, label: "Lista", path: "/lista" },
  { icon: MessageCircle, label: "Messaggi", path: "/messaggi" },
  { icon: User, label: "Profilo", path: "/profilo" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-foreground safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 px-4 py-2 transition-colors ${
                isActive ? "nav-active" : "nav-inactive hover:text-foreground"
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
