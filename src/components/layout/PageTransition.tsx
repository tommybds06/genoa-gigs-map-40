import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  variant?: "fade" | "slide";
}

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

export function PageTransition({ children, variant = "fade" }: PageTransitionProps) {
  const isSlide = variant === "slide";
  const variants = isSlide ? slideVariants : fadeVariants;
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ 
        duration: isSlide ? 0.25 : 0.1,
        ease: isSlide ? [0.32, 0.72, 0, 1] : "easeOut", // iOS-like spring for slide
      }}
      className={isSlide ? "absolute inset-0 z-50 bg-background" : "relative w-full min-h-full"}
    >
      {children}
    </motion.div>
  );
}
