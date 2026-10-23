import { useId, type ComponentType, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PIN_CENTRO, PIN_PROPORZIONE, PIN_TRACCIATO, PIN_VIEWBOX } from "@/lib/formaPin";

interface PinMappaProps {
  /** L'icona dentro il cerchio superiore. */
  icona: ComponentType<{ className?: string }>;
  /** Larghezza in px (48 sulla mappa, 40 nel selettore). L'altezza segue la forma. */
  larghezza?: number;
  /** Riempimento: una classe `fill-*` del pin di prima (es. `fill-primary`). */
  classeFondo: string;
  /** Colore dell'icona: la classe `text-*` del pin di prima. */
  classeIcona: string;
  /** Lato dell'icona in px (24 sui pin da 48, 20 su quelli da 40). */
  latoIcona?: number;
  /**
   * Stato evidenziato: il contorno da 3 px che prima era il `border` del
   * cerchio. È un `stroke` da 6 tagliato sulla forma, così ne resta solo la
   * metà interna — 3 px, DENTRO il pin, come il bordo CSS di prima.
   */
  classeContorno?: string;
  /** Il numero del gruppo, o altro da sovrapporre. */
  children?: ReactNode;
  className?: string;
}

/**
 * Il pin disegnato (vedi `lib/formaPin.ts`): stessa misura in larghezza e
 * stessi colori dei pin cerchio + triangolo che sostituisce.
 */
export function PinMappa({
  icona: Icona,
  larghezza = 48,
  classeFondo,
  classeIcona,
  latoIcona = 24,
  classeContorno,
  children,
  className,
}: PinMappaProps) {
  const idTaglio = useId();
  return (
    <div
      className={cn("relative", className)}
      style={{
        width: larghezza,
        height: Math.round(larghezza * PIN_PROPORZIONE),
        // L'ombra di prima (`shadow-material-md`) era un box-shadow sul
        // cerchio: su una forma serve il drop-shadow, che segue il contorno.
        filter: "drop-shadow(0 1.5px 0 rgb(56 45 36 / 0.10)) drop-shadow(0 2px 2px rgb(56 45 36 / 0.13))",
      }}
    >
      <svg viewBox={PIN_VIEWBOX} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <clipPath id={idTaglio}>
            <path d={PIN_TRACCIATO} />
          </clipPath>
        </defs>
        <path d={PIN_TRACCIATO} className={cn("transition-colors duration-300", classeFondo)} />
        {classeContorno && (
          <path
            d={PIN_TRACCIATO}
            clipPath={`url(#${idTaglio})`}
            fill="none"
            strokeWidth={6}
            vectorEffect="non-scaling-stroke"
            className={cn("transition-colors duration-300", classeContorno)}
          />
        )}
      </svg>
      <span
        className="absolute flex -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${PIN_CENTRO.x}%`, top: `${PIN_CENTRO.y}%`, width: latoIcona, height: latoIcona }}
      >
        <Icona className={cn("h-full w-full transition-colors duration-300", classeIcona)} />
      </span>
      {children}
    </div>
  );
}
