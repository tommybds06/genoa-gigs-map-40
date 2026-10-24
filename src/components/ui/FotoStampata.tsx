import type { ReactNode } from "react";
import { useMisure } from "@/hooks/useMisure";
import { formaStampa } from "@/lib/formaStampa";
import { semeDa, TRATTO } from "@/lib/tratto";
import { cn } from "@/lib/utils";
import { Scotch, type StrisciaScotch } from "@/components/ui/Scotch";

/**
 * UNA FOTO STAMPATA (Tommaso, 23 ottobre): le foto del profilo come stampe
 * fisiche, stile Polaroid, non come immagini digitali.
 *
 * - Cornice di carta (`--carta-foto`) con il margine in basso più alto, come
 *   una Polaroid: lì ci vanno la didascalia o i pallini del carosello.
 * - Angoli arrotondati come le card e il BORDO COL TRATTO delle card
 *   (`lib/formaStampa.ts`, calcolato sulle misure vere).
 * - Leggermente storta (dal seme: sempre uguale per la stessa foto) e tenuta
 *   dallo scotch.
 * - La foto dentro ha gli angoli vivi: in una stampa vera la finestra della
 *   foto è un taglio netto, l'arrotondamento è della carta.
 *
 * ⚠️ La cornice è un SVG sotto il contenuto, non una maschera: così lo
 * scotch può uscire dal bordo senza essere tagliato (sulle card lo taglia
 * la maschera, ed è per questo che lì serve `Foglietto`).
 */

const MISURE = {
  /** Miniature della griglia (~110 px). */
  // Il pezzo lungo (88 px) a 0,6 fa ~53 px: circa metà della miniatura.
  piccola: { lati: 5, fondo: 18, raggio: 9, gradi: 1.8, scalaScotch: 0.6 },
  /** La foto grande del profilo (tutta la larghezza). */
  grande: { lati: 11, fondo: 34, raggio: 16, gradi: 0.8, scalaScotch: 1 },
};

/* Carta appoggiata su carta: ombra bruna, corta e stretta (§5). */
const OMBRA = "drop-shadow(0 1px 0 rgb(56 45 36 / 0.10)) drop-shadow(0 2px 3px rgb(56 45 36 / 0.12))";

interface FotoStampataProps {
  /** Per il tremolio del bordo e l'inclinazione: l'URL della foto va benissimo. */
  seme: string;
  misura?: keyof typeof MISURE;
  /** Proporzione della finestra della foto, come `aspect-ratio` (es. "1 / 1", "4 / 3"). */
  formato?: string;
  /** La foto (o le foto sovrapposte di un carosello). */
  children: ReactNode;
  /** Quello che sta nel margine basso: una didascalia, i pallini del carosello. */
  fondo?: ReactNode;
  scotch?: StrisciaScotch[];
  /** Posto vuoto («Aggiungi»): cornice tratteggiata, senza carta né ombra. */
  vuota?: boolean;
  storta?: boolean;
  /** Il ruolo del PROFILO mostrato (colore dello scotch). */
  employer?: boolean;
  className?: string;
}

export function FotoStampata({
  seme,
  misura = "piccola",
  formato = "1 / 1",
  children,
  fondo,
  scotch = [],
  vuota = false,
  storta = true,
  employer,
  className,
}: FotoStampataProps) {
  const { ref, misure } = useMisure<HTMLDivElement>();
  const m = MISURE[misura];
  const n = semeDa(seme);
  const gradi = storta ? ((n % 1000) / 1000 - 0.5) * 2 * m.gradi : 0;
  const d = misure && misure.w > 0 ? formaStampa(misure.w, misure.h, seme, m.raggio) : null;

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      style={{
        padding: `${m.lati}px ${m.lati}px ${m.fondo}px`,
        // `rotate`, non `transform`: si somma all'oscillazione del Foglietto
        // che la contiene invece di cancellarla.
        rotate: `${gradi}deg`,
        // Finché la misura non c'è, un riquadro arrotondato: niente lampo.
        ...(!d && !vuota ? { background: "hsl(var(--carta-foto))", borderRadius: m.raggio } : null),
      }}
    >
      {d && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          style={vuota ? undefined : { filter: OMBRA }}
        >
          <path
            d={d}
            fill={vuota ? "none" : "hsl(var(--carta-foto))"}
            stroke={TRATTO}
            strokeWidth={vuota ? 1.6 : 1.1}
            strokeDasharray={vuota ? "6 5" : undefined}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      <div
        className={cn("relative overflow-hidden rounded-[2px]", !vuota && "bg-paper-sunken")}
        style={{ aspectRatio: formato }}
      >
        {children}
        {/* Il bordo della stampa: un filo appena più scuro attorno alla foto. */}
        {!vuota && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[2px] shadow-[inset_0_0_0_1px_rgb(56_45_36/0.08)]"
          />
        )}
      </div>

      {fondo && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center" style={{ height: m.fondo }}>
          {fondo}
        </div>
      )}

      {scotch.map((s, i) => (
        <Scotch key={i} {...s} seme={n + i * 7} employer={employer} scala={m.scalaScotch} />
      ))}
    </div>
  );
}
