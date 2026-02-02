import { cn } from "@/lib/utils";
import { forwardRef, ReactNode } from "react";

interface DiamondButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "primary" | "muted";
  size?: "sm" | "md" | "lg";
  badge?: number;
}

export const DiamondButton = forwardRef<HTMLButtonElement, DiamondButtonProps>(
  ({ children, variant = "default", size = "md", badge, className, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    };

    const variantClasses = {
      default: "bg-background border-2 border-primary hover:bg-muted shadow-md",
      primary: "bg-primary text-primary-foreground border-2 border-primary shadow-lg",
      muted: "bg-muted border-2 border-primary hover:bg-accent",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "relative group",
          className
        )}
        {...props}
      >
        {/* Diamond shape container */}
        <div
          className={cn(
            sizeClasses[size],
            variantClasses[variant],
            "rotate-45 rounded-md transition-all duration-200",
            "group-hover:scale-105 group-active:scale-95",
            "flex items-center justify-center"
          )}
        >
          {/* Icon container - counter-rotate to keep icon straight */}
          <div className="-rotate-45 flex items-center justify-center">
            {children}
          </div>
        </div>

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium z-10">
            {badge}
          </span>
        )}
      </button>
    );
  }
);

DiamondButton.displayName = "DiamondButton";
