 import { useSwipeable, SwipeEventData } from "react-swipeable";
 import { useNavigate, useLocation } from "react-router-dom";
 import { ReactNode, useCallback, useRef } from "react";
 import { useSwipeDirection } from "@/contexts/SwipeDirectionContext";
 
 // Tab order for swipe navigation
 const TAB_ORDER = ["/", "/lista", "/messaggi", "/profilo"];
 
 interface SwipeNavigatorProps {
   children: ReactNode;
   /** Only trigger swipe in a specific zone (for map page) */
   zoneRestricted?: boolean;
 }
 
 /**
  * Wrapper component that enables horizontal swipe navigation between main tabs.
  * 
  * For the map page, use zoneRestricted=true and wrap only the header area,
  * leaving the map itself outside to allow panning.
  */
 export function SwipeNavigator({ children, zoneRestricted = false }: SwipeNavigatorProps) {
   const navigate = useNavigate();
   const location = useLocation();
   const isNavigating = useRef(false);
   const { setDirection } = useSwipeDirection();
 
   const currentIndex = TAB_ORDER.indexOf(location.pathname);
 
   const handleSwipe = useCallback((direction: "LEFT" | "RIGHT") => {
     // Prevent multiple navigations
     if (isNavigating.current) return;
     if (currentIndex === -1) return;
 
     let nextIndex: number;
     
     if (direction === "LEFT") {
       // Swipe left = go to next tab
       nextIndex = currentIndex + 1;
       if (nextIndex >= TAB_ORDER.length) return; // Already at last tab
       setDirection("left");
     } else {
       // Swipe right = go to previous tab
       nextIndex = currentIndex - 1;
       if (nextIndex < 0) return; // Already at first tab
       setDirection("right");
     }
 
     isNavigating.current = true;
     navigate(TAB_ORDER[nextIndex]);
     
     // Reset after navigation completes
     setTimeout(() => {
       isNavigating.current = false;
       setDirection(null);
     }, 300);
   }, [currentIndex, navigate, setDirection]);
 
   const swipeHandlers = useSwipeable({
     onSwipedLeft: () => handleSwipe("LEFT"),
     onSwipedRight: () => handleSwipe("RIGHT"),
     preventScrollOnSwipe: false,
     trackMouse: false,
     delta: 50, // Minimum swipe distance
     swipeDuration: 500,
   });
 
   return (
     <div {...swipeHandlers} className={zoneRestricted ? "" : "h-full"}>
       {children}
     </div>
   );
 }
 
 /**
  * Hook to get swipe handlers for custom integration.
  * Useful when you need more control over which element captures the swipe.
  */
 export function useSwipeNavigation() {
   const navigate = useNavigate();
   const location = useLocation();
   const isNavigating = useRef(false);
   const { setDirection } = useSwipeDirection();
 
   const currentIndex = TAB_ORDER.indexOf(location.pathname);
 
   const handleSwipe = useCallback((direction: "LEFT" | "RIGHT") => {
     if (isNavigating.current) return;
     if (currentIndex === -1) return;
 
     let nextIndex: number;
     
     if (direction === "LEFT") {
       nextIndex = currentIndex + 1;
       if (nextIndex >= TAB_ORDER.length) return;
       setDirection("left");
     } else {
       nextIndex = currentIndex - 1;
       if (nextIndex < 0) return;
       setDirection("right");
     }
 
     isNavigating.current = true;
     navigate(TAB_ORDER[nextIndex]);
     
     setTimeout(() => {
       isNavigating.current = false;
       setDirection(null);
     }, 300);
   }, [currentIndex, navigate, setDirection]);
 
   return useSwipeable({
     onSwipedLeft: () => handleSwipe("LEFT"),
     onSwipedRight: () => handleSwipe("RIGHT"),
     preventScrollOnSwipe: false,
     trackMouse: false,
     delta: 50,
     swipeDuration: 500,
   });
 }