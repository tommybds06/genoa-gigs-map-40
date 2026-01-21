import { useProfile } from "@/hooks/useProfile";

export type RoleTheme = "worker" | "employer";

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  navActive: string;
  headerBg: string;
  headerText: string;
}

export const workerTheme: ThemeColors = {
  primary: "bg-primary",
  primaryHover: "hover:bg-primary/90",
  secondary: "bg-secondary",
  navActive: "text-secondary",
  headerBg: "bg-primary",
  headerText: "text-primary-foreground",
};

export const employerTheme: ThemeColors = {
  primary: "bg-blue-600",
  primaryHover: "hover:bg-blue-700",
  secondary: "bg-blue-800",
  navActive: "text-blue-600",
  headerBg: "bg-blue-600",
  headerText: "text-white",
};

export function useRoleTheme() {
  const { profile, loading } = useProfile();

  const isEmployer = profile?.role === "employer";
  const theme: ThemeColors = isEmployer ? employerTheme : workerTheme;
  const role: RoleTheme = isEmployer ? "employer" : "worker";

  return {
    theme,
    role,
    isEmployer,
    isWorker: !isEmployer,
    loading,
  };
}
