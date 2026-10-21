import { useMemo } from "react";
import { useMisure } from "@/hooks/useMisure";
import { TRATTO } from "@/lib/tratto";
import { formaCartellino, semeDa } from "@/lib/formaCartellino";

/**
 * La sagoma a cartellino da pacco, disegnata sotto al contenuto.
 *
 * Riempie il genitore (che dev'essere `relative`) e ne legge le misure vere:
 * `offsetWidth/offsetHeight`, che NON risentono della rotazione del
 * cartellino — `getBoundingClientRect` invece restituirebbe il riquadro del
 * rettangolo ruotato, più grande. Rimisura con un ResizeObserver.
 *
 * Il FORO è davvero vuoto: il riempimento della card e quello dell'anello sono
 * tracciati con `fill-rule: evenodd` che includono il cerchio del foro, quindi
 * lì non viene dipinto niente e si vede la bacheca sotto.
 */

/**
 * Appena più scura del foglio della card: il rinforzo è cartoncino in più.
 * ⚠️ Non meno di così: con 60% di foglio veniva #F3EDE1, cioè il colore della
 * BACHECA (#F4EEE2) — anello e foro identici, il foro si leggeva solo dal
 * tratto. Al 35% è ~#EEE8D9: più scura della card e staccata dalla bacheca.
 */
const TINTA_ANELLO = "color-mix(in srgb, hsl(var(--card)) 35%, hsl(var(--paper-sunken)))";

interface SagomaCartellinoProps {
  /** Di solito l'id del cartellino: stesso tracciato a ogni render. */
  seme: string;
  variante: "piena" | "tratteggiata";
}

export function SagomaCartellino({ seme, variante }: SagomaCartellinoProps) {
  const { ref, misure } = useMisure();

  const forma = useMemo(
    () => (misure && misure.w > 0 ? formaCartellino(misure.w, misure.h, semeDa(seme)) : null),
    [misure, seme]
  );

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {forma && misure && (
        <svg width={misure.w} height={misure.h} className="absolute inset-0 overflow-visible">
          {variante === "piena" && (
            <path
              d={forma.contorno + forma.foro}
              style={{ fill: "hsl(var(--card))", fillRule: "evenodd" }}
            />
          )}
          <path
            d={forma.contorno}
            style={{
              fill: "none",
              stroke: TRATTO,
              // Piena: il filo delle card (1,1 px, §6). Tratteggiata: lo
              // stesso tratto e la stessa cadenza del disegno di prima
              // (2,3 di spessore, trattini da ~11,9 sulla tavola da 176).
              strokeWidth: variante === "piena" ? 1.1 : 2.2,
              strokeDasharray: variante === "piena" ? undefined : "11 11",
              strokeLinejoin: "round",
              strokeLinecap: variante === "piena" ? undefined : "round",
            }}
          />
          {/* Anello di rinforzo: corona tra il foro e il bordo esterno. */}
          <path
            d={forma.anello + forma.foro}
            style={{
              fill: TINTA_ANELLO,
              fillRule: "evenodd",
              stroke: TRATTO,
              strokeWidth: 1.1,
              strokeLinejoin: "round",
            }}
          />
        </svg>
      )}
    </div>
  );
}
