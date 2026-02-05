import { motion } from "framer-motion";
import { ReactNode, useSyncExternalStore } from "react";
import { 
  getSwipeDirectionSnapshot, 
  subscribeToSwipeDirection,
  getServerSnapshot 
} from "@/lib/swipeState";

interface PageTransitionProps {
  children: ReactNode;
  variant?: "fade" | "slide";
}

type EasingType = [number, number, number, number] | "easeOut" | "easeIn" | "easeInOut" | "linear";

// Ultra-fast fade for tab navigation
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

// Swipe left = new page enters from right, old exits to left
const swipeLeftVariants = {
  initial: { x: "100%", opacity: 1 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "-100%", opacity: 1 },
};

// Swipe right = new page enters from left, old exits to right
const swipeRightVariants = {
  initial: { x: "-100%", opacity: 1 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 1 },
};

const iosEase: EasingType = [0.32, 0.72, 0, 1];

export function PageTransition({ children, variant = "fade" }: PageTransitionProps) {
  // Use sync external store for guaranteed synchronization with global state
  const direction = useSyncExternalStore(
    subscribeToSwipeDirection,
    getSwipeDirectionSnapshot,
    getServerSnapshot
  );
  
  const isSlide = variant === "slide";
  
  console.log("[PageTransition] render, direction:", direction, "variant:", variant);
  
  // Determine animation based on context
  let variants = fadeVariants;
  let duration = 0.1;
  let ease: EasingType = "easeOut";
  
  if (isSlide) {
    // Detail page slide
    variants = slideVariants;
    duration = 0.3;
    ease = iosEase;
  } else if (direction === "left") {
    // Swipe navigation left (next tab)
    variants = swipeLeftVariants;
    duration = 0.3;
    ease = iosEase;
  } else if (direction === "right") {
    // Swipe navigation right (previous tab)
    variants = swipeRightVariants;
    duration = 0.3;
    ease = iosEase;
  }
  
  // Use fixed positioning with explicit dimensions to ensure children get proper height
  // top/bottom/left/right: 0 with width/height: 100% guarantees the container fills the parent
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ duration, ease }}
      className="absolute top-0 left-0 right-0 bottom-0 bg-background flex flex-col"
      style={{ 
        width: '100%', 
        height: '100%',
        zIndex: isSlide ? 50 : undefined 
      }}
    >
      {children}
    </motion.div>
  );
}