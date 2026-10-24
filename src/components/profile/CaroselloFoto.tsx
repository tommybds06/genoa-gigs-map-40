import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import { useMisure } from "@/hooks/useMisure";

/**
 * LE FOTO CHE SCORRONO SOTTO IL DITO (Tommaso, 24 ottobre: «non c'è un
 * movimento naturale per scorrere»). Prima si cambiava foto solo coi
 * pallini piccoli.
 *
 * Una striscia orizzontale che segue il dito; al rilascio va alla foto dopo
 * (o prima) se l'hai spinta oltre un quinto della larghezza o con un colpo
 * veloce, altrimenti torna. FLUIDO, a molla: è un gesto, non un momento.
 *
 * - Va dentro la finestra di una `FotoStampata` (riempie il genitore).
 * - `data-senza-swipe-tab`: qui il trascinamento non cambia scheda.
 * - `touch-action: pan-y`: lo scorrimento verticale della pagina resta.
 */
const MOLLA = { type: "spring" as const, stiffness: 380, damping: 38 };

export function CaroselloFoto({
  foto,
  indice,
  onIndice,
}: {
  foto: string[];
  indice: number;
  onIndice: (i: number) => void;
}) {
  const { ref, misure } = useMisure<HTMLDivElement>();
  const w = misure?.w ?? 0;
  const x = useMotionValue(0);
  const primaVolta = useRef(true);

  // Il pallino toccato, o il rilascio del dito: si va alla foto giusta. Alla
  // prima misura senza animazione, se no la foto entrerebbe di lato.
  useEffect(() => {
    if (!w) return;
    if (primaVolta.current) {
      x.set(-indice * w);
      primaVolta.current = false;
      return;
    }
    const a = animate(x, -indice * w, MOLLA);
    return () => a.stop();
  }, [indice, w, x]);

  const rilascia = (_: unknown, info: PanInfo) => {
    const soglia = w / 5;
    let prossimo = indice;
    if (info.offset.x < -soglia || info.velocity.x < -400) prossimo = Math.min(indice + 1, foto.length - 1);
    else if (info.offset.x > soglia || info.velocity.x > 400) prossimo = Math.max(indice - 1, 0);
    if (prossimo === indice) animate(x, -indice * w, MOLLA);
    else onIndice(prossimo);
  };

  return (
    <div ref={ref} data-senza-swipe-tab className="absolute inset-0 overflow-hidden">
      <motion.div
        className="flex h-full"
        style={{ x, touchAction: "pan-y" }}
        drag={foto.length > 1 ? "x" : false}
        dragConstraints={{ left: -(foto.length - 1) * w, right: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragEnd={rilascia}
      >
        {foto.map((f, i) => (
          <img
            key={f}
            src={f}
            alt={`Foto ${i + 1}`}
            draggable={false}
            className="h-full w-full shrink-0 select-none object-cover"
            style={{ width: w || "100%" }}
          />
        ))}
      </motion.div>
    </div>
  );
}
