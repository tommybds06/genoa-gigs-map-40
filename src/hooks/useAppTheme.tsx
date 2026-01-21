import { useUser } from "@/contexts/UserContext";

export interface AppTheme {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryBg: string;
  primaryBgHover: string;
  primaryText: string;
  primaryBorder: string;
  primaryRing: string;
  
  // Secondary colors
  secondary: string;
  secondaryText: string;
  
  // Active navigation states
  navActive: string;
  navActiveBg: string;
  
  // Accent colors for light backgrounds
  accentBg: string;
  accentText: string;
  
  // Header theming
  headerBg: string;
  headerText: string;
  
  // Button variants
  btnFilled: string;
  btnFilledHover: string;
  btnOutline: string;
  btnOutlineHover: string;
  
  // Role indicator
  roleLabel: string;
}

export const workerTheme: AppTheme = {
  primary: "bg-primary",
  primaryHover: "hover:bg-primary/90",
  primaryBg: "bg-accent",
  primaryBgHover: "hover:bg-accent",
  primaryText: "text-primary",
  primaryBorder: "border-primary",
  primaryRing: "ring-primary",
  
  secondary: "bg-secondary",
  secondaryText: "text-secondary",
  
  navActive: "text-secondary",
  navActiveBg: "bg-accent",
  
  accentBg: "bg-accent",
  accentText: "text-accent-foreground",
  
  headerBg: "bg-primary",
  headerText: "text-primary-foreground",
  
  btnFilled: "bg-primary text-primary-foreground",
  btnFilledHover: "hover:bg-primary/90",
  btnOutline: "border-primary text-primary",
  btnOutlineHover: "hover:bg-accent",
  
  roleLabel: "Worker",
};

export const employerTheme: AppTheme = {
  primary: "bg-blue-600",
  primaryHover: "hover:bg-blue-700",
  primaryBg: "bg-blue-50",
  primaryBgHover: "hover:bg-blue-100",
  primaryText: "text-blue-600",
  primaryBorder: "border-blue-600",
  primaryRing: "ring-blue-500",
  
  secondary: "bg-blue-800",
  secondaryText: "text-blue-800",
  
  navActive: "text-blue-600",
  navActiveBg: "bg-blue-50",
  
  accentBg: "bg-blue-50",
  accentText: "text-blue-700",
  
  headerBg: "bg-blue-600",
  headerText: "text-white",
  
  btnFilled: "bg-blue-600 text-white",
  btnFilledHover: "hover:bg-blue-700",
  btnOutline: "border-blue-600 text-blue-600",
  btnOutlineHover: "hover:bg-blue-50",
  
  roleLabel: "Employer",
};

export function useAppTheme() {
  const { role, isEmployer, isWorker, loading, hasLoaded } = useUser();

  const theme: AppTheme = isEmployer ? employerTheme : workerTheme;

  return {
    theme,
    role,
    isEmployer,
    isWorker,
    loading,
    hasLoaded,
    // Convenience function for inline styles
    getColor: (workerColor: string, employerColor: string) => 
      isEmployer ? employerColor : workerColor,
  };
}
