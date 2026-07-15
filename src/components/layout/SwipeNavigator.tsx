 import { useSwipeable } from "react-swipeable";
 import { useNavigate, useLocation } from "react-router-dom";
 import { ReactNode, useCallback, useRef } from "react";
 import { setSwipeDirection } from "@/lib/swipeState";
 import { useUser } from "@/contexts/UserContext";

 // Tab order for swipe navigation (role-aware second tab)
 const WORKER_TAB_ORDER = ["/", "/lista", "/messaggi", "/profilo"];
 const EMPLOYER_TAB_ORDER = ["/", "/annunci", "/messaggi", "/profilo"];

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
   const { isEmployer } = useUser();
   const isNavigating = useRef(false);

   const tabOrder = isEmployer ? EMPLOYER_TAB_ORDER : WORKER_TAB_ORDER;
   const currentIndex = tabOrder.indexOf(location.pathname);

   const handleSwipe = useCallback((direction: "LEFT" | "RIGHT") => {
     if (isNavigating.current) return;
     if (currentIndex === -1) return;

     let nextIndex: number;

     if (direction === "LEFT") {
       nextIndex = currentIndex + 1;
       if (nextIndex >= tabOrder.length) return;
       setSwipeDirection("left");
     } else {
       nextIndex = currentIndex - 1;
       if (nextIndex < 0) return;
       setSwipeDirection("right");
     }

     isNavigating.current = true;
     navigate(tabOrder[nextIndex]);

     setTimeout(() => {
       isNavigating.current = false;
     }, 350);
   }, [currentIndex, navigate, tabOrder]);

   const swipeHandlers = useSwipeable({
     onSwipedLeft: () => handleSwipe("LEFT"),
     onSwipedRight: () => handleSwipe("RIGHT"),
     preventScrollOnSwipe: false,
     trackMouse: false,
     delta: 50,
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
  */
 export function useSwipeNavigation() {
   const navigate = useNavigate();
   const location = useLocation();
   const { isEmployer } = useUser();
   const isNavigating = useRef(false);

   const tabOrder = isEmployer ? EMPLOYER_TAB_ORDER : WORKER_TAB_ORDER;
   const currentIndex = tabOrder.indexOf(location.pathname);

   const handleSwipe = useCallback((direction: "LEFT" | "RIGHT") => {
     if (isNavigating.current) return;
     if (currentIndex === -1) return;

     let nextIndex: number;

     if (direction === "LEFT") {
       nextIndex = currentIndex + 1;
       if (nextIndex >= tabOrder.length) return;
       setSwipeDirection("left");
     } else {
       nextIndex = currentIndex - 1;
       if (nextIndex < 0) return;
       setSwipeDirection("right");
     }

     isNavigating.current = true;
     navigate(tabOrder[nextIndex]);

     setTimeout(() => {
       isNavigating.current = false;
     }, 350);
   }, [currentIndex, navigate, tabOrder]);

   return useSwipeable({
     onSwipedLeft: () => handleSwipe("LEFT"),
     onSwipedRight: () => handleSwipe("RIGHT"),
     preventScrollOnSwipe: false,
     trackMouse: false,
     delta: 50,
     swipeDuration: 500,
   });
 }
