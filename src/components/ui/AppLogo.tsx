import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function AppLogo({ size = "md", showText = true, className }: AppLogoProps) {
  const sizeClasses = {
    sm: {
      diamond: "w-8 h-8",
      letter: "text-sm",
      title: "text-lg",
      subtitle: "text-[8px]",
    },
    md: {
      diamond: "w-12 h-12",
      letter: "text-xl",
      title: "text-2xl",
      subtitle: "text-[10px]",
    },
    lg: {
      diamond: "w-16 h-16",
      letter: "text-3xl",
      title: "text-4xl",
      subtitle: "text-xs",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Diamond Logo Mark */}
      <div 
        className={cn(
          sizes.diamond,
          "bg-primary rotate-45 rounded-md shadow-lg flex items-center justify-center relative"
        )}
      >
        {/* Inner diamond outline for depth */}
        <div className="absolute inset-1 border-2 border-primary-foreground/30 rounded-sm" />
        
        {/* Letter S - counter-rotated to appear straight */}
        <span 
          className={cn(
            sizes.letter,
            "font-extrabold text-primary-foreground -rotate-45 relative z-10"
          )}
        >
          S
        </span>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span 
            className={cn(
              sizes.title,
              "font-extrabold tracking-tighter text-foreground"
            )}
          >
            STAKK
          </span>
          <span 
            className={cn(
              sizes.subtitle,
              "font-semibold tracking-[0.3em] text-muted-foreground uppercase"
            )}
          >
            GENOVA
          </span>
        </div>
      )}
    </div>
  );
}
