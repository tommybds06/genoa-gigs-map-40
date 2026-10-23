import { useLayoutEffect, useRef, type ReactNode } from "react";
import { CURVA_PIN, DURATA_PIN } from "@/lib/zoneMappa";

/** Da dove arriva un pin che compare: lo scostamento in px dal punto in cui stava. */
export interface Ingresso {
  x: number;
  y: number;
  /** Scala di partenza: < 1 quando il pin nasce da un'unione (zoom indietro). */
  scala: number;
}

/**
 * L'animazione con cui un pin COMPARE quando si cambia zoom.
 *
 * - zoom avanti: una zona si divide e ogni pin parte dal punto in cui stava
 *   la zona e scivola al suo posto — si vede da dove viene;
 * - zoom indietro: più pin si uniscono, e la zona nuova «si gonfia» sul posto.
 *
 * Parte TRASPARENTE (non al 40% come la prima versione: quel salto si
 * vedeva) e si incrocia col pin che esce (`PinUscente`), stessa durata e
 * stessa curva. Con «riduci
 * movimento» il pin compare e basta. L'origine della trasformazione è la
 * punta (in basso al centro), che è il punto esatto sulla mappa.
 *
 * ⚠️ NON framer-motion. App.tsx avvolge le pagine in
 * `<AnimatePresence initial={false}>` (perché non si animino al primo
 * caricamento), e framer passa quel `initial={false}` per contesto a TUTTI i
 * `motion.*` dentro la pagina: i pin nascevano già alla fine dell'animazione.
 * Verificato: elemento appena montato con `transform: none` e zero animazioni.
 * Qui si usa l'animazione nativa del browser (`element.animate`), che quel
 * contesto non lo legge — e costa una chiamata sola, al montaggio.
 */
export function IngressoPin({ da, children }: { da?: Ingresso; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // Solo l'ingresso del PRIMO disegno: se il marker si ridisegna (una ricerca,
  // un cambio di evidenziazione) non deve ripartire.
  const ingresso = useRef(da);

  useLayoutEffect(() => {
    const el = ref.current;
    const d = ingresso.current;
    if (!el || !d) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Una volta sola: StrictMode in sviluppo esegue l'effetto due volte, e
    // due animazioni uguali sovrapposte sullo stesso elemento non servono.
    ingresso.current = undefined;
    el.animate(
      [
        { transform: `translate(${d.x}px, ${d.y}px) scale(${d.scala})`, opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: DURATA_PIN, easing: CURVA_PIN }
    );
  }, []);

  return (
    <div ref={ref} style={{ transformOrigin: "50% 100%" }}>
      {children}
    </div>
  );
}
