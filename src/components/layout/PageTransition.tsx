import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  variant?: "fade" | "slide";
}

type EasingType = [number, number, number, number] | "easeOut";
type VariantValue = { transform?: string; opacity: number; transitionEnd?: { transform: string } };
type AnimVariants = { initial: VariantValue; animate: VariantValue; exit: VariantValue };

/**
 * Le pagine FUORI dalle schede (accesso, dettagli). Le schede con la barra in
 * basso non passano più di qui: sono montate una volta e affiancate
 * (layout/Schede.tsx), e lo swipe fra loro lo fa il browser.
 *
 * FADE (accesso, onboarding): cambio ISTANTANEO. Era una dissolvenza
 * incrociata da 0,1s, che a metà mostrava DUE pagine intere al 50% (§12).
 */
const fadeVariants: AnimVariants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
};

/**
 * SLIDE (dettagli): entra da destra sopra la scheda, ed esce verso destra
 * scoprendola.
 *
 * ⚠️ `transform` scritto per intero, non `x`: framer manda al compositor
 * (WAAPI) solo `transform`, `opacity`, `filter` e `clipPath`
 * (motion-dom, `acceleratedValues`). Con `x` l'animazione girava sul thread
 * principale, fotogramma per fotogramma, proprio mentre React montava la
 * pagina che entrava: i primi fotogrammi si perdevano e la pagina «saltava»
 * dentro. Sul compositor scorre anche se React è occupato.
 */
const slideVariants: AnimVariants = {
  initial: { transform: "translateX(100%)", opacity: 1 },
  // `none` a riposo, come faceva `x: 0`: con una trasformazione rimasta, le
  // barre `fixed` delle pagine (Modifica profilo, Crea annuncio) si
  // misurerebbero sulla pagina invece che sullo schermo. ⚠️ Non come
  // destinazione: framer la converte in `translateX(0%)` e lì resta
  // (misurato). `transitionEnd` la applica a fine corsa.
  animate: { transform: "translateX(0%)", opacity: 1, transitionEnd: { transform: "none" } },
  exit: { transform: "translateX(100%)", opacity: 1 },
};

const iosEase: EasingType = [0.32, 0.72, 0, 1];

export function PageTransition({ children, variant = "fade" }: PageTransitionProps) {
  const isSlide = variant === "slide";

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={isSlide ? slideVariants : fadeVariants}
      transition={isSlide ? { duration: 0.3, ease: iosEase } : { duration: 0 }}
      className={`absolute inset-0 bg-background flex flex-col ${isSlide ? 'z-50' : 'pb-16'}`}
    >
      {children}
    </motion.div>
  );
}
