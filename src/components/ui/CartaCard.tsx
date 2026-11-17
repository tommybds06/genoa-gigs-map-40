import { forwardRef, type HTMLAttributes, type MutableRefObject } from "react";
import { useMisure } from "@/hooks/useMisure";
import { formaStampa } from "@/lib/formaStampa";
import { TRATTO } from "@/lib/tratto";
import { cn } from "@/lib/utils";

/**
 * LA CARD DI CARTA — prototipo (Atlante 2-2, 17 novembre).
 *
 * Tommaso: le card «non sembrano carta». La `.material-card` è la sagoma di
 * Illustrator montata a 9 sezioni: sui lati lunghi la banda centrale viene
 * STIRATA, e il tremolio del disegno diventa un'onda lunga e molle.
 *
 * Qui il contorno è CALCOLATO sulla misura vera, come la Polaroid
 * (`formaStampa`, lo stesso tratto: un vertice ogni ~5,5 px, ±0,5 px): il
 * margine a mano corre su tutti e quattro i lati. In più lo SPESSORE: la
 * stessa forma un pixel e mezzo più in basso, nel colore della linea, come
 * il bordo di un cartoncino appoggiato. Niente `filter` (§25: un filtro per
 * card, in una lista, si paga a ogni scorrimento).
 *
 * ⚠️ Il disegno sta a `-z-10` dentro un contesto proprio (`isolate`): un
 * `absolute` senza z-index si dipingerebbe SOPRA il contenuto non posizionato.
 *
 * `raggio`: gli angoli. Provati 12 e 20 (Tommaso teme che piccoli «sembrino
 * datati»): per ora 20, in attesa della sua scelta.
 */
export const CartaCard = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { seme: string; raggio?: number }
>(function CartaCard({ seme, raggio = 20, className, style, children, ...resto }, avanti) {
  const { ref, misure } = useMisure<HTMLDivElement>();
  const d = misure && misure.w > 0 ? formaStampa(misure.w, misure.h, seme, raggio) : null;

  return (
    <div
      // Due ref: le misure, e chi la avvolge (il Foglietto la fa oscillare).
      ref={(el) => {
        (ref as MutableRefObject<HTMLDivElement | null>).current = el;
        if (typeof avanti === "function") avanti(el);
        else if (avanti) avanti.current = el;
      }}
      className={cn("relative isolate", className)}
      style={{ ...(d ? null : { background: "hsl(var(--paper-sheet))", borderRadius: raggio }), ...style }}
      {...resto}
    >
      {d && (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-visible">
          <path d={d} transform="translate(0 1.6)" fill="hsl(var(--paper-line))" />
          <path
            d={d}
            fill="hsl(var(--paper-sheet))"
            stroke={TRATTO}
            strokeWidth={1.1}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {children}
    </div>
  );
});
