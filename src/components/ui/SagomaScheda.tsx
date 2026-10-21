import { useId, useMemo } from "react";
import { useMisure } from "@/hooks/useMisure";
import { TRATTO } from "@/lib/tratto";
import { formaScheda } from "@/lib/formaScheda";

/**
 * La carta della scheda, disegnata SOTTO al contenuto (`-z-10`: DrawerContent
 * è `fixed z-50`, quindi fa da contesto e il disegno resta sopra il suo fondo
 * — trasparente — e sotto i figli). Vedi `lib/formaScheda.ts`.
 *
 * `useMisure` funziona qui perché questo componente nasce insieme al portal
 * del drawer: quando misura, il nodo c'è già.
 */
export function SagomaScheda() {
  const { ref, misure } = useMisure();
  const idTaglio = useId();

  const forma = useMemo(
    () => (misure && misure.w > 0 && misure.h > 0 ? formaScheda(misure.w, misure.h) : null),
    [misure]
  );

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {forma && misure && (
        <svg width={misure.w} height={misure.h} className="absolute inset-0 overflow-visible">
          <defs>
            <clipPath id={idTaglio}>
              <path d={forma.fessura} />
            </clipPath>
          </defs>
          <path d={forma.carta + forma.fessura} style={{ fill: "hsl(var(--background))", fillRule: "evenodd" }} />
          <path d={forma.fasce} style={{ fill: "hsl(var(--background))" }} />
          <path
            d={forma.bordo}
            style={{ fill: "none", stroke: TRATTO, strokeWidth: 1.1, strokeLinejoin: "round" }}
          />
          {/* Lo spessore del cartoncino: il bordo alto della fessura fa
              un'ombra sottile dentro il buco, così si legge come un taglio e
              non come una pillola disegnata sopra. */}
          <path
            d={forma.fessura}
            clipPath={`url(#${idTaglio})`}
            transform="translate(0 1.6)"
            style={{ fill: "none", stroke: "hsl(var(--ink) / 0.28)", strokeWidth: 2.4 }}
          />
          <path
            d={forma.fessura}
            style={{ fill: "none", stroke: TRATTO, strokeWidth: 1.1, strokeLinejoin: "round" }}
          />
        </svg>
      )}
    </div>
  );
}
