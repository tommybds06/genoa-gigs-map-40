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
    <div className="flex flex-col h-screen h-[100dvh] bg-background overflow-hidden">
       {/* Main content area - takes remaining space with bottom nav padding and relative for animations */}
       <div className={`flex-1 flex flex-col overflow-hidden relative ${!hideBottomNav ? 'pb-16' : ''}`}>
        {children}
      </div>
      
      {/* Bottom Navigation - fixed at bottom */}
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
