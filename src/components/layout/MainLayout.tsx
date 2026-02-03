import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface MainLayoutProps {
  children: ReactNode;
  /** Hide bottom nav for detail pages that have their own navigation */
  hideBottomNav?: boolean;
}

/**
 * Persistent layout wrapper that keeps BottomNav stable across route transitions.
 * The BottomNav never unmounts when switching between tab routes.
 */
export function MainLayout({ children, hideBottomNav = false }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-background">
      {/* Main content area - scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      
      {/* Bottom Navigation - always mounted, visibility controlled */}
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
