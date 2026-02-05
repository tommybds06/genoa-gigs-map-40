import { motion } from "framer-motion";
import { ReactNode, useSyncExternalStore, useRef } from "react";
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
type VariantValue = { x: number | string; opacity: number };
type AnimVariants = { initial: VariantValue; animate: VariantValue; exit: VariantValue };

// Ultra-fast fade for tab navigation - explicit x:0 to prevent drift
const fadeVariants: AnimVariants = {
  initial: { opacity: 0, x: 0 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 0 },
};

// Slide from right for detail pages
const slideVariants: AnimVariants = {
  initial: { x: "100%", opacity: 1 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 1 },
};

// Swipe left = new page enters from right, old exits to left
const swipeLeftVariants: AnimVariants = {
  initial: { x: "100%", opacity: 1 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "-100%", opacity: 1 },
};

// Swipe right = new page enters from left, old exits to right
const swipeRightVariants: AnimVariants = {
  initial: { x: "-100%", opacity: 1 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 1 },
};

const iosEase: EasingType = [0.32, 0.72, 0, 1];

export function PageTransition({ children, variant = "fade" }: PageTransitionProps) {
  // Capture the CURRENT direction at mount time only (not on updates)
  // This ensures the entering page uses the direction that was set when navigation started
  const mountedDirection = useRef<"left" | "right" | null | undefined>(undefined);
  
  // Read current direction synchronously
  const currentDirection = useSyncExternalStore(
    subscribeToSwipeDirection,
    getSwipeDirectionSnapshot,
    getServerSnapshot
  );
  
  // Only capture on first render (undefined means not yet captured)
  if (mountedDirection.current === undefined) {
    mountedDirection.current = currentDirection;
  }
  
  const isSlide = variant === "slide";
  const effectiveDirection = mountedDirection.current;
  
  // Determine animation based on frozen direction
  let variants = fadeVariants;
  let duration = 0.1;
  let ease: EasingType = "easeOut";
  
  if (isSlide) {
    // Detail page slide
    variants = slideVariants;
    duration = 0.3;
    ease = iosEase;
  } else if (effectiveDirection === "left") {
    // Swipe navigation left (next tab)
    variants = swipeLeftVariants;
    duration = 0.3;
    ease = iosEase;
  } else if (effectiveDirection === "right") {
    // Swipe navigation right (previous tab)
    variants = swipeRightVariants;
    duration = 0.3;
    ease = iosEase;
  }
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ duration, ease }}
      // Use inset-0 for absolute positioning, pb-16 for bottom nav space on tab pages
      className={`absolute inset-0 bg-background flex flex-col ${isSlide ? 'z-50' : 'pb-16'}`}
    >
      {children}
    </motion.div>
  );
}