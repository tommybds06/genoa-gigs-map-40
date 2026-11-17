import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type MutableRefObject } from "react";
import { useMisure } from "@/hooks/useMisure";
import { formaStampa } from "@/lib/formaStampa";
import { semeDa, TRATTO } from "@/lib/tratto";
import { cn } from "@/lib/utils";

/**
 * LA CARD DI CARTA — la card di tutta l'app (18 novembre).
 *
 * Tommaso: «le card devono essere carta». La `.material-card` di prima era la
 * sagoma di Illustrator montata a 9 sezioni: sui lati lunghi la banda
 * centrale veniva STIRATA e il tremolio del disegno diventava un'onda lunga e
 * molle; nessuno spessore. Provata in Lista e Profilo il 17 novembre,
 * approvata e passata a tutta l'app il 18.
 *
 * - Il contorno è CALCOLATO sulla misura vera, come la Polaroid
 *   (`formaStampa`, lo stesso tratto delle sagome: un vertice ogni ~5,5 px,
 *   ±0,5 px): il margine a mano corre su tutti e quattro i lati, e due card
 *   di misura diversa hanno lo stesso tratto, non uno più stirato.
 * - Lo SPESSORE: la stessa forma 1,6 px più in basso, nel colore della linea,
 *   come il bordo di un cartoncino appoggiato. Niente `filter` (§25: un
 *   filtro per card, in una lista, si paga a ogni scorrimento).
 * - Il disegno sta a `-z-10` dentro un contesto proprio (`isolate`): un
 *   `absolute` senza z-index si dipingerebbe SOPRA il contenuto.
 *
 * `raggio`: 20 (provati 12, 14 ± 2 e 20: fra 14 e 20 a misura di telefono la
 * differenza quasi non si vede; il «carta» lo fanno bordo e spessore).
 *
 * `ritaglia`: per le card con righe che toccano il bordo e si colorano
 * premendole (Impostazioni, il menu della pressione lunga). La vecchia card
 * era una MASCHERA e ritagliava tutto; questa disegna sotto, e senza
 * ritaglio il fondo premuto di una riga uscirebbe dagli angoli. Si ritaglia
 * con un `clip-path` sulla forma più lo spessore; il filo raddoppia (2,2)
 * perché della linea resta solo la metà interna.
 *
 * `fondo`: la classe del riempimento (`fill-…`), per le card che cambiano
 * colore (le tessere dei ruoli scelte). Mai `bg-…`: il disegno lo coprirebbe.
 *
 * `come="button"`: la card che è anche un bottone.
 */
type Props = HTMLAttributes<HTMLElement> &
  Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "disabled"> & {
    seme: string;
    raggio?: number;
    /** ± px sugli angoli, dal seme (provata: a misura di telefono non si vede). */
    variazione?: number;
    ritaglia?: boolean;
    fondo?: string;
    come?: "div" | "button";
  };

const SPESSORE = 1.6;

/** La stessa forma spostata in basso, per lo spessore e per il ritaglio. */
const spostaGiu = (d: string, dy: number) =>
  d.replace(/([ML])(-?[\d.]+) (-?[\d.]+)/g, (_, c, x, y) => `${c}${x} ${(Number(y) + dy).toFixed(2)}`);

export const CartaCard = forwardRef<HTMLElement, Props>(function CartaCard(
  {
    seme,
    raggio: base = 20,
    variazione = 0,
    ritaglia = false,
    fondo = "fill-card",
    come = "div",
    className,
    style,
    children,
    ...resto
  },
  avanti
) {
  const { ref, misure } = useMisure<HTMLElement>();
  const raggio = base + (((semeDa(seme) % 1000) / 1000) * 2 - 1) * variazione;
  const d = misure && misure.w > 0 ? formaStampa(misure.w, misure.h, seme, raggio) : null;
  const sotto = d ? spostaGiu(d, SPESSORE) : null;
  const Tag = come;

  return (
    <Tag
      // Due ref: le misure, e chi la avvolge (il Foglietto la fa oscillare).
      ref={(el: HTMLElement | null) => {
        (ref as MutableRefObject<HTMLElement | null>).current = el;
        if (typeof avanti === "function") avanti(el);
        else if (avanti) avanti.current = el;
      }}
      className={cn("relative isolate", className)}
      style={{
        // Prima della misura (un fotogramma): un rettangolo arrotondato.
        ...(d ? null : { background: "hsl(var(--card))", borderRadius: raggio }),
        ...(ritaglia && d ? { clipPath: `path("${d}${sotto}")` } : null),
        ...style,
      }}
      {...resto}
    >
      {d && (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-visible">
          <path d={sotto!} fill="hsl(var(--paper-line))" />
          <path
            d={d}
            className={cn(fondo, "transition-[fill] duration-300")}
            stroke={TRATTO}
            strokeWidth={ritaglia ? 2.2 : 1.1}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {children}
    </Tag>
  );
});
