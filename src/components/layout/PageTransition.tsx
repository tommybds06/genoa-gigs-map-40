import { PresenceContext, usePresence } from "framer-motion";
import { ReactNode, useContext, useLayoutEffect, useRef } from "react";

interface PageTransitionProps {
  children: ReactNode;
  variant?: "fade" | "slide";
}

/**
 * Le pagine FUORI dalle schede (accesso, dettagli). Le schede con la barra in
 * basso non passano più di qui: sono montate una volta e affiancate
 * (layout/Schede.tsx).
 *
 * FADE (accesso, onboarding): cambio ISTANTANEO. Era una dissolvenza
 * incrociata da 0,1s, che a metà mostrava DUE pagine intere al 50% (§12).
 *
 * SLIDE (dettagli): entra da destra sopra la scheda, ed esce verso destra
 * scoprendola. Animazione NATIVA (`element.animate`, sul compositor), non
 * più framer.
 *
 * ⚠️ Perché non framer (7 novembre, video di Tommaso dal Pixel). Con framer
 * (`transform` animata via WAAPI) alla fine di OGNI ingresso e uscita c'era
 * un fotogramma sbagliato: entrando Impostazioni, per un fotogramma
 * ricompariva il Profilo sotto; uscendo, Impostazioni ricompariva intera.
 * Letto in motion-dom (`NativeAnimation`, `onfinish`): a fine corsa framer
 * CANCELLA l'animazione subito e scrive il valore finale nel motion value,
 * che arriva al DOM solo al fotogramma dopo. In mezzo il browser disegna lo
 * stile di PARTENZA dell'elemento: `translateX(100%)` in ingresso (pagina
 * fuori → si vede il profilo), `none` in uscita (pagina di nuovo al suo
 * posto). Misurato sul video fotogramma per fotogramma: un fotogramma
 * diverso, poi di nuovo quello giusto, a ogni cambio di pagina.
 *
 * Qui invece:
 * - INGRESSO: `fill: "backwards"` e nessun valore finale da scrivere — a fine
 *   corsa resta lo stile dell'elemento, cioè nessuna trasformazione, che
 *   coincide con l'ultimo fotogramma (`translateX(0)`). Niente salto, e a
 *   riposo nessuna `transform` (con una trasformazione rimasta, le barre
 *   `fixed` di Modifica profilo e Crea annuncio si misurerebbero sulla
 *   pagina invece che sullo schermo).
 * - USCITA: `fill: "forwards"`: la pagina RESTA fuori schermo finché React
 *   non la toglie (`safeToRemove` di AnimatePresence). Parte da dove si
 *   trova davvero, anche a metà di un ingresso.
 * - Al primo caricamento (`AnimatePresence initial={false}`) non anima.
 */
const DURATA = 300;
const CURVA = "cubic-bezier(0.32, 0.72, 0, 1)";
const FUORI = "translateX(100%)";

const riduciMovimento = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function PageTransition({ children, variant = "fade" }: PageTransitionProps) {
  const isSlide = variant === "slide";
  const rif = useRef<HTMLDivElement>(null);
  const [presente, rimuovi] = usePresence();
  // `initial === false` solo al primo giro di AnimatePresence: letto una volta.
  const presenza = useContext(PresenceContext);
  const animaIngresso = useRef(presenza?.initial !== false);

  useLayoutEffect(() => {
    const el = rif.current;
    if (!isSlide || !el || !animaIngresso.current || riduciMovimento()) return;
    el.animate([{ transform: FUORI }, { transform: "translateX(0)" }], {
      duration: DURATA,
      easing: CURVA,
      fill: "backwards",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (presente) return;
    const el = rif.current;
    if (!isSlide || !el || riduciMovimento()) {
      rimuovi?.();
      return;
    }
    // Da dove si trova adesso (anche a metà dell'ingresso), poi via.
    const da = getComputedStyle(el).transform;
    el.getAnimations().forEach((a) => a.cancel());
    const uscita = el.animate([{ transform: da === "none" ? "translateX(0)" : da }, { transform: FUORI }], {
      duration: DURATA,
      easing: CURVA,
      fill: "forwards",
    });
    uscita.onfinish = () => rimuovi?.();
  }, [presente, isSlide, rimuovi]);

  return (
    <div ref={rif} className={`absolute inset-0 bg-background flex flex-col ${isSlide ? "z-50" : "pb-16"}`}>
      {children}
    </div>
  );
}
