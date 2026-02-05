 // Global swipe state that survives across route changes
 // Used by both entering and exiting pages during transitions
 
 type SwipeDirection = "left" | "right" | null;
 
 let currentSwipeDirection: SwipeDirection = null;
 
 export function setSwipeDirection(direction: SwipeDirection) {
   currentSwipeDirection = direction;
   
   // Auto-reset after animation completes
   if (direction !== null) {
     setTimeout(() => {
       currentSwipeDirection = null;
     }, 400);
   }
 }
 
 export function getSwipeDirection(): SwipeDirection {
   return currentSwipeDirection;
 }