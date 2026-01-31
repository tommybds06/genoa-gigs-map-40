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
  exit: { x: "-20%", opacity: 0 },
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
        duration: variant === "fade" ? 0.15 : 0.25,
        ease: "easeOut"
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
