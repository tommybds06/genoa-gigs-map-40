import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/hooks/useAppTheme";

/**
 * LA PISTA — una scelta fra poche opzioni (7 novembre): l'unità della paga,
 * netti o lordi.
 *
 * Erano bottoni separati, tutti uguali, in una griglia («brutta e spoglia»,
 * Tommaso): dodici pillole in tre gruppi fra Durata e Paga, e le non scelte
 * quasi dello stesso colore della carta. Una pista è UN oggetto solo — la
 * stessa delle linguette di Lista (`bg-muted sagoma-quartiere`) — e la scelta
 * è un pezzo pieno del colore del ruolo che SCORRE da un'opzione all'altra.
 *
 * - Ogni opzione è larga quanto il suo testo, più una parte uguale dello
 *   spazio che avanza: a larghezze uguali «Settimana» non ci stava con
 *   cinque opzioni (390 px). La linguetta si MISURA sull'opzione scelta
 *   (`offsetLeft`/`offsetWidth`, e di nuovo se la pista cambia misura) e ci
 *   scorre sopra; cambiando durata, se le opzioni cambiano, la segue.
 * - Senza valore (netti/lordi non ancora scelto) la linguetta non c'è.
 * - `role="radiogroup"`: le frecce cambiano scelta, come un gruppo di radio.
 *
 * ⚠️ Alta 48 px (`h-12`, quella dei campi): la maschera della pista vuole
 * 22 + 22 px. La linguetta, 40 px, ha la sagoma del chip (15 + 15).
 */
export function Pista<T extends string | boolean>({
  opzioni,
  valore,
  onScegli,
  etichetta,
  className,
}: {
  opzioni: { valore: T; testo: string }[];
  valore: T | null;
  onScegli: (v: T) => void;
  /** Il nome del gruppo, per chi usa un lettore di schermo. */
  etichetta: string;
  className?: string;
}) {
  const { theme, isEmployer } = useAppTheme();
  const rif = useRef<HTMLDivElement>(null);
  const indice = opzioni.findIndex((o) => o.valore === valore);
  const n = opzioni.length;
  const testi = opzioni.map((o) => o.testo).join("|");

  // Dove sta la linguetta: sotto l'opzione scelta, misurata.
  const [posto, setPosto] = useState<{ x: number; w: number } | null>(null);
  useLayoutEffect(() => {
    const pista = rif.current;
    if (!pista || indice < 0) return;
    const misura = () => {
      const b = pista.querySelectorAll<HTMLElement>("[role=radio]")[indice];
      if (b) setPosto({ x: b.offsetLeft, w: b.offsetWidth });
    };
    misura();
    const ro = new ResizeObserver(misura);
    ro.observe(pista);
    return () => ro.disconnect();
  }, [indice, testi]);

  const tasto = (e: KeyboardEvent) => {
    const passo = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    const prossimo = (Math.max(indice, 0) + passo + n) % n;
    onScegli(opzioni[prossimo].valore);
    rif.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[prossimo]?.focus();
  };

  return (
    <div
      ref={rif}
      role="radiogroup"
      aria-label={etichetta}
      onKeyDown={tasto}
      className={cn("relative flex h-12 p-1 bg-muted sagoma-quartiere rounded-[19px]", className)}
    >
      {/* La linguetta, sotto l'opzione scelta. */}
      {posto && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1 left-0 sagoma-chip rounded-full transition-[transform,width,opacity] [transition-duration:240ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            theme.btnFilled,
            indice < 0 && "opacity-0",
          )}
          style={{ width: posto.w, transform: `translateX(${posto.x}px)` }}
        />
      )}
      {opzioni.map((o, i) => {
        const scelta = i === indice;
        return (
          <button
            key={String(o.valore)}
            type="button"
            role="radio"
            aria-checked={scelta}
            tabIndex={scelta || (indice < 0 && i === 0) ? 0 : -1}
            onClick={() => onScegli(o.valore)}
            className={cn(
              "relative z-10 flex-auto whitespace-nowrap rounded-full px-2.5 text-[15px] font-medium leading-tight transition-[color,transform] duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              scelta ? (isEmployer ? "text-employer-foreground" : "text-primary-foreground") : "text-ink",
            )}
          >
            {o.testo}
          </button>
        );
      })}
    </div>
  );
}
