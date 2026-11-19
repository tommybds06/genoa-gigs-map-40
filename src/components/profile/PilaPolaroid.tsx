import { useEffect, useRef, type ReactNode } from "react";
import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { FotoStampata } from "@/components/ui/FotoStampata";
import { useMisure } from "@/hooks/useMisure";
import { MISURA_FOTO, ripiegaFoto, urlFoto } from "@/lib/foto";
import { movimentoRidotto } from "@/lib/aScatti";
import { semeDa } from "@/lib/tratto";
import { cn } from "@/lib/utils";

/**
 * SFOGLIARE LE FOTO COME POLAROID VERE (Tommaso, 19 novembre: «sfogliare tra
 * le immagini è veramente come sfogliare delle polaroid, e non immagini dentro
 * il riquadro della polaroid»). Prima era `CaroselloFoto`: una striscia di
 * foto che scorreva DENTRO una cornice ferma.
 *
 * Ora è una PILA: ogni foto è una stampa sua (`FotoStampata`), e sotto quella
 * in cima si vedono i bordi delle due dopo, storte ognuna a modo suo.
 * - La stampa in cima si trascina e segue il dito LISCIA (la regola del
 *   movimento: il dito va liscio), girando un po' mentre va.
 * - Lasciata oltre un quinto della larghezza (o con un colpo veloce) VOLA VIA
 *   e la pila scorre: verso sinistra la prossima, verso destra la precedente.
 *   È un giro: dopo l'ultima torna la prima, come una pila vera.
 * - Le stampe sotto si assestano di colpo (pochi pixel): carta, a scatti.
 * - Niente scotch con più foto: una pila che si sfoglia non è attaccata.
 *   Con una foto sola resta lo scotch lungo, come prima.
 * - `data-senza-swipe-tab`: qui il trascinamento non cambia scheda;
 *   `touch-action: pan-y`: la pagina scorre ancora in verticale.
 * - Con «riduci movimento» niente volo: cambia e basta.
 */

/** Come stanno le stampe sotto quella in cima: [x, y, gradi]. */
const SOTTO: [number, number, number][] = [
  [0, 0, 0],
  [7, 5, 2.6],
  [-6, 9, -2.2],
];

export function PilaPolaroid({
  foto,
  indice,
  onIndice,
  seme,
  fondo,
  employer,
  className,
}: {
  foto: string[];
  indice: number;
  onIndice: (i: number) => void;
  seme: string;
  /** Cosa va nel margine basso di ogni stampa (i pallini), dato il suo indice. */
  fondo?: (i: number) => ReactNode;
  /** Il ruolo del PROFILO mostrato (colore dello scotch). */
  employer?: boolean;
  className?: string;
}) {
  const n = foto.length;
  const { ref, misure } = useMisure<HTMLDivElement>();
  const w = misure?.w ?? 360;
  const x = useMotionValue(0);
  const gira = useTransform(x, [-w, 0, w], [-14, 0, 14]);
  const volo = useRef(false);

  // Cambiando foto dai pallini, la nuova in cima parte ferma.
  useEffect(() => {
    if (!volo.current) x.set(0);
  }, [indice, x]);

  const vai = (verso: 1 | -1) => {
    const prossimo = (indice + (verso === 1 ? 1 : -1) + n) % n;
    if (movimentoRidotto()) {
      x.set(0);
      onIndice(prossimo);
      return;
    }
    volo.current = true;
    animate(x, verso === 1 ? -w * 1.3 : w * 1.3, { type: "tween", duration: 0.22, ease: "easeOut" }).then(() => {
      onIndice(prossimo);
      x.set(0);
      volo.current = false;
    });
  };

  const rilascia = (_: unknown, info: PanInfo) => {
    const soglia = w / 5;
    if (info.offset.x < -soglia || info.velocity.x < -400) vai(1);
    else if (info.offset.x > soglia || info.velocity.x > 400) vai(-1);
    else animate(x, 0, { type: "spring", stiffness: 420, damping: 32 });
  };

  if (n === 0) return null;

  // Le stampe visibili, dalla più in fondo alla più in cima.
  const visibili = Array.from({ length: Math.min(3, n) }, (_, d) => d).reverse();

  return (
    <div ref={ref} data-senza-swipe-tab className={cn("relative", className)}>
      {/* Lo spazio lo tiene la stampa in cima (in flusso); le altre le stanno
          sotto, assolute, con il loro scarto. */}
      {visibili.map((d) => {
        const i = (indice + d) % n;
        const f = foto[i];
        const [dx, dy, g] = SOTTO[d];
        const stampa = (
          <FotoStampata
            seme={`${seme}-${f}`}
            misura="grande"
            formato="1 / 1"
            storta={false}
            scotch={n === 1 ? [{ pezzo: "lungo", lato: "centro" }] : []}
            employer={employer}
            fondo={fondo?.(i)}
          >
            <img
              src={urlFoto(f, MISURA_FOTO.grande)}
              onError={ripiegaFoto(f)}
              decoding="async"
              alt={d === 0 ? `Foto ${i + 1} di ${n}` : ""}
              draggable={false}
              className="h-full w-full select-none object-cover"
            />
          </FotoStampata>
        );
        // Ogni stampa ha la sua inclinazione dal seme, più lo scarto di pila.
        const propria = ((semeDa(f) % 1000) / 1000 - 0.5) * 1.6;
        if (d === 0) {
          return (
            <motion.div
              key={f}
              className="relative z-10"
              style={{ x, rotate: gira, touchAction: "pan-y" }}
              drag={n > 1 ? "x" : false}
              dragMomentum={false}
              onDragEnd={rilascia}
            >
              <div style={{ rotate: `${propria}deg` }}>{stampa}</div>
            </motion.div>
          );
        }
        return (
          <div
            key={f}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0"
            style={{ translate: `${dx}px ${dy}px`, rotate: `${g + propria}deg`, zIndex: 3 - d }}
          >
            {stampa}
          </div>
        );
      })}
    </div>
  );
}
