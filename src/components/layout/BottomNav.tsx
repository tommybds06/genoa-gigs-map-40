import { Map, List, MessageCircle, User, Store } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

export function BottomNav() {
  const location = useLocation();
  const { isEmployer, loading, hasLoaded } = useUser();
  const { theme } = useAppTheme();

  const navItems: NavItem[] = [
    { icon: Map, label: "Mappa", path: "/" },
    isEmployer 
      ? { icon: Store, label: "Annunci", path: "/annunci" }
      : { icon: List, label: "Lista", path: "/lista" },
    { icon: MessageCircle, label: "Messaggi", path: "/messaggi" },
    { icon: User, label: "Profilo", path: "/profilo" },
  ];

  // Use neutral colors while loading to prevent flash
  const getActiveClasses = () => {
    if (loading && !hasLoaded) {
      return "text-muted-foreground bg-muted";
    }
    return `${theme.navActive} ${theme.navActiveBg}`;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 material-nav safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 px-6 py-2 rounded-2xl transition-all duration-100 active:scale-95 ${
                isActive 
                  ? getActiveClasses() 
                  : "text-muted-foreground hover:bg-muted"
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
