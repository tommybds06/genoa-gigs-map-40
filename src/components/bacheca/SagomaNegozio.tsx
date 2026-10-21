import { useMemo } from "react";
import { formaNegozio } from "@/lib/formaNegozio";
import { semeDa, TRATTO } from "@/lib/tratto";
import { useMisure } from "@/hooks/useMisure";

/**
 * La sagoma a NEGOZIO delle card del worker (vedi lib/formaNegozio.ts):
 * tenda a festoni sopra, corpo sotto. Riempie il genitore (`relative`).
 *
 * Stesso foglio e stesso filo delle card employer: riempimento
 * `--card`, tratto `--paper-edge` da 1,1 px. Il corpo va disegnato prima:
 * la tenda, riempita, gli copre il lato alto.
 */
export function SagomaNegozio({ seme }: { seme: string }) {
  const { ref, misure } = useMisure();
  const forma = useMemo(
    () => (misure && misure.w > 0 ? formaNegozio(misure.w, misure.h, semeDa(seme)) : null),
    [misure, seme]
  );
  const stile = {
    fill: "hsl(var(--card))",
    stroke: TRATTO,
    strokeWidth: 1.1,
    strokeLinejoin: "round" as const,
  };

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {forma && misure && (
        <svg width={misure.w} height={misure.h} className="absolute inset-0 overflow-visible">
          <path d={forma.corpo} style={stile} />
          <path d={forma.tenda} style={stile} />
        </svg>
      )}
    </div>
  );
}
