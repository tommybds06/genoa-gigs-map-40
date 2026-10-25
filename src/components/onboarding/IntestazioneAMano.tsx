import { useMemo, type ReactNode } from "react";
import { useMisure } from "@/hooks/useMisure";
import { aMano, generatore, lungoSegmento, semeDa, tracciato } from "@/lib/tratto";
import { cn } from "@/lib/utils";

/* Il bordo basso è un taglio della carta colorata, senza filo sopra (§6: la
   forma sì, la linea no): con lo scarto delle card (±0,5 px) su un bordo
   pieno non si vedrebbe, quindi qui è il doppio. Stesso passo (5,5 px). */
const SCARTO_TAGLIO = 1.1;
const MARGINE = 3;

/**
 * IL RIQUADRO COLORATO IN CIMA ALLA CONFIGURAZIONE (Tommaso, 24 ottobre):
 * resta blu o ruggine, ma la linea in basso non è più dritta: è tagliata a
 * mano, con il tratto calcolato delle sagome (`lib/tratto.ts`).
 *
 * - STABILE: il seme è fisso, quindi a ogni apertura è lo stesso taglio.
 * - Sulla LARGHEZZA VERA: il tracciato si ricalcola dalla misura del
 *   riquadro (anche ruotando il telefono), non da un disegno stirato.
 */
export function IntestazioneAMano({ className, children }: { className?: string; children: ReactNode }) {
  const { ref, misure } = useMisure<HTMLDivElement>();

  const taglio = useMemo(() => {
    if (!misure || misure.w === 0) return undefined;
    const { w, h } = misure;
    const caso = generatore(semeDa("intestazione-configura"));
    const fondo = h - MARGINE;
    // Da destra a sinistra lungo il fondo: la normale (dy, -dx) punta in basso.
    const bordo = aMano(lungoSegmento(w, fondo, 0, fondo), caso, SCARTO_TAGLIO);
    const punti = [{ x: 0, y: 0 }, { x: w, y: 0 }, ...bordo, { x: 0, y: fondo }];
    return `path("${tracciato(punti)}")`;
  }, [misure]);

  return (
    <div ref={ref} className={cn(className)} style={taglio ? { clipPath: taglio } : undefined}>
      {children}
    </div>
  );
}
