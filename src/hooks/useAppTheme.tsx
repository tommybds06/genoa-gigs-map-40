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
  primary: "bg-employer",
  primaryHover: "hover:bg-employer-700",
  primaryBg: "bg-employer-50",
  primaryBgHover: "hover:bg-employer-100",
  primaryText: "text-employer",
  primaryBorder: "border-employer",
  primaryRing: "ring-employer",

  secondary: "bg-employer-700",
  secondaryText: "text-employer-700",

  navActive: "text-employer",
  navActiveBg: "bg-employer-50",

  accentBg: "bg-employer-50",
  accentText: "text-employer",

  headerBg: "bg-employer",
  headerText: "text-white",

  btnFilled: "bg-employer text-employer-foreground",
  btnFilledHover: "hover:bg-employer-700",
  btnOutline: "border-employer text-employer",
  btnOutlineHover: "hover:bg-employer-50",

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
