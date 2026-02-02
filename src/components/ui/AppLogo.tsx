import { cn } from "@/lib/utils";
import stakkLogo from "@/assets/stakk-logo.svg";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AppLogo({ size = "md", className }: AppLogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
  };

  return (
    <img 
      src={stakkLogo} 
      alt="STAKK GENOVA" 
      className={cn(sizeClasses[size], "w-auto", className)}
    />
  );
}