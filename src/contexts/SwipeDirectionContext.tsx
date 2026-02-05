 import { createContext, useContext, useState, ReactNode } from "react";
 
 type SwipeDirection = "left" | "right" | null;
 
 interface SwipeDirectionContextType {
   direction: SwipeDirection;
   setDirection: (dir: SwipeDirection) => void;
 }
 
 const SwipeDirectionContext = createContext<SwipeDirectionContextType>({
   direction: null,
   setDirection: () => {},
 });
 
 export function SwipeDirectionProvider({ children }: { children: ReactNode }) {
   const [direction, setDirection] = useState<SwipeDirection>(null);
   
   return (
     <SwipeDirectionContext.Provider value={{ direction, setDirection }}>
       {children}
     </SwipeDirectionContext.Provider>
   );
 }
 
 export function useSwipeDirection() {
   return useContext(SwipeDirectionContext);
 }