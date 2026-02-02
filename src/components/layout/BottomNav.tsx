import { Map, List, MessageCircle, User, Store } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { motion } from "framer-motion";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

export function BottomNav() {
  const location = useLocation();
  const { isEmployer, loading, hasLoaded } = useUser();

  const navItems: NavItem[] = [
    { icon: Map, label: "Mappa", path: "/" },
    isEmployer 
      ? { icon: Store, label: "Annunci", path: "/annunci" }
      : { icon: List, label: "Lista", path: "/lista" },
    { icon: MessageCircle, label: "Messaggi", path: "/messaggi" },
    { icon: User, label: "Profilo", path: "/profilo" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 material-nav safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center gap-0.5 px-6 py-2 transition-all duration-100 active:scale-95 z-10"
            >
              {/* Diamond background indicator - only on active with rotation animation */}
              {isActive && (
                <motion.div
                  key={item.path}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  initial={{ opacity: 0, rotate: 0, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 45, scale: 1 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeOut",
                  }}
                >
                  <div 
                    className={`w-11 h-11 rounded-lg ${
                      loading && !hasLoaded 
                        ? "bg-muted" 
                        : isEmployer 
                          ? "bg-blue-600" 
                          : "bg-primary"
                    }`}
                  />
                </motion.div>
              )}

              {/* Icon */}
              <Icon 
                className={`w-5 h-5 relative z-10 transition-colors duration-100 ${
                  isActive 
                    ? "text-white" 
                    : "text-muted-foreground"
                }`} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              
              {/* Label */}
              <span 
                className={`text-[10px] relative z-10 transition-colors duration-100 ${
                  isActive 
                    ? "text-white font-semibold" 
                    : "text-muted-foreground font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
