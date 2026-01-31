import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  variant?: "fade" | "slide";
}

// Fade variant for tab navigation (Mappa <-> Lista <-> Profilo)
const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Slide variant for detail navigation (List -> Detail)
const slideVariants = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
};

export function PageTransition({ children, variant = "fade" }: PageTransitionProps) {
  const variants = variant === "slide" ? slideVariants : fadeVariants;
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ 
        duration: variant === "fade" ? 0.1 : 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      style={{ 
        position: variant === "slide" ? "absolute" : "relative",
        top: 0,
        left: 0,
        width: "100%",
        minHeight: "100%",
        backgroundColor: "hsl(var(--background))"
      }}
    >
      {children}
    </motion.div>
  );
}
