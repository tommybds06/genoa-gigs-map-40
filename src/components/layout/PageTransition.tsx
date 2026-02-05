import { motion } from "framer-motion";
  import { ReactNode } from "react";
 import { useSwipeDirection } from "@/contexts/SwipeDirectionContext";

interface PageTransitionProps {
  children: ReactNode;
  variant?: "fade" | "slide";
}

 type EasingType = [number, number, number, number] | "easeOut" | "easeIn" | "easeInOut" | "linear";
 
// Ultra-fast fade for tab navigation - imperceptible but smooth
const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Slide from right for detail pages
const slideVariants = {
  initial: { x: "100%", opacity: 1 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 1 },
};

 // Swipe left = new page enters from right
 const swipeLeftVariants = {
   initial: { x: "100%", opacity: 1 },
   animate: { x: 0, opacity: 1 },
   exit: { x: "-100%", opacity: 1 },
 };
 
 // Swipe right = new page enters from left
 const swipeRightVariants = {
   initial: { x: "-100%", opacity: 1 },
   animate: { x: 0, opacity: 1 },
   exit: { x: "100%", opacity: 1 },
 };
 
 const iosEase: EasingType = [0.32, 0.72, 0, 1];
 
export function PageTransition({ children, variant = "fade" }: PageTransitionProps) {
   const { direction } = useSwipeDirection();
  const isSlide = variant === "slide";
   
   // Determine animation based on context
   let variants = fadeVariants;
   let duration = 0.1;
   let ease: EasingType = "easeOut";
   let className = "relative w-full min-h-full";
   
   if (isSlide) {
     // Detail page slide
     variants = slideVariants;
     duration = 0.25;
     ease = iosEase;
     className = "absolute inset-0 z-50 bg-background";
   } else if (direction === "left") {
     // Swipe navigation left (next tab)
     variants = swipeLeftVariants;
     duration = 0.25;
     ease = iosEase;
     className = "absolute inset-0 bg-background";
   } else if (direction === "right") {
     // Swipe navigation right (previous tab)
     variants = swipeRightVariants;
     duration = 0.25;
     ease = iosEase;
     className = "absolute inset-0 bg-background";
   }
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
       transition={{ duration, ease }}
       className={className}
    >
      {children}
    </motion.div>
  );
}
