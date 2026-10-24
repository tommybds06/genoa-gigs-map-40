import { useCallback, useEffect, useRef } from "react";
import { XIcon } from "@/components/icons/uiIcons";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FotoStampata } from "@/components/ui/FotoStampata";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  /** Il ruolo del PROFILO mostrato (colore dello scotch). */
  employer?: boolean;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "55%" : "-55%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? "55%" : "-55%", opacity: 0 }),
};

/* I comandi sopra lo sfondo scuro: tondi di carta con l'icona in inchiostro.
   Erano icone bianche su `bg-black/95`. */
const COMANDO =
  "absolute z-10 flex h-11 w-11 items-center justify-center rounded-full bg-paper-sheet/90 text-ink active:scale-95";

/**
 * LA GALLERIA A TUTTO SCHERMO (23 ottobre): sfogliare le foto come stampe
 * vere. Ogni foto è una `FotoStampata` grande e QUADRATA come una Polaroid
 * (Tommaso: la foto si ritaglia al centro) — cornice di carta, scotch,
 * storta a modo suo — sopra lo sfondo scurito, e il numero «1 / 5» sta nel
 * margine basso come la scritta di una Polaroid. Prima era un rettangolo
 * nero con la foto dentro.
 *
 * Scorrere resta FLUIDO (è un gesto, §stop motion: fluido per i comandi,
 * a scatti solo per i momenti). Toccare lo sfondo fuori dalla foto chiude.
 */
export function GalleryDialog({
  isOpen,
  onClose,
  photos,
  currentIndex,
  onIndexChange,
  employer,
}: GalleryDialogProps) {
  const photosCount = photos.length;
  const directionRef = useRef(0);

  // Preload all photos as soon as the dialog opens
  useEffect(() => {
    if (!isOpen) return;
    photos.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [isOpen, photos]);

  const goToPrevious = useCallback(() => {
    directionRef.current = -1;
    onIndexChange((currentIndex - 1 + photosCount) % photosCount);
  }, [currentIndex, photosCount, onIndexChange]);

  const goToNext = useCallback(() => {
    directionRef.current = 1;
    onIndexChange((currentIndex + 1) % photosCount);
  }, [currentIndex, photosCount, onIndexChange]);

  // La stampa segue il dito (Tommaso, 24 ottobre: «non c'è un movimento
  // naturale»). Prima c'era uno swipe a soglia, senza che la foto si
  // muovesse: sembrava di dover usare le frecce. Lasciata oltre 80 px, o con
  // un colpo veloce, se ne va e arriva la prossima; se no torna al centro.
  const rilascia = (_: unknown, info: PanInfo) => {
    if (photosCount < 2) return;
    if (info.offset.x < -80 || info.velocity.x < -500) goToNext();
    else if (info.offset.x > 80 || info.velocity.x > 500) goToPrevious();
  };

  if (photosCount === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        senzaChiudi
        className="h-[100dvh] w-screen max-w-none gap-0 border-0 bg-transparent p-0 shadow-none"
      >
        <DialogTitle className="sr-only">Foto</DialogTitle>
        <div
          onClick={(e) => e.target === e.currentTarget && onClose()}
          className="relative flex h-full w-full items-center justify-center overflow-hidden"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className={`${COMANDO} right-4 top-[max(1rem,env(safe-area-inset-top))]`}
          >
            <XIcon className="h-4 w-4" />
          </button>

          {photosCount > 1 && (
            <button type="button" onClick={goToPrevious} aria-label="Foto precedente" className={`${COMANDO} left-2`}>
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <AnimatePresence initial={false} custom={directionRef.current} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
              drag={photosCount > 1 ? "x" : false}
              dragSnapToOrigin
              dragElastic={0.7}
              onDragEnd={rilascia}
              className="cursor-grab touch-pan-y active:cursor-grabbing"
            >
              <FotoStampata
                seme={photos[currentIndex]}
                misura="grande"
                formato="1 / 1"
                employer={employer}
                className="w-[min(calc(100vw-7rem),62vh)]"
                scotch={[{ pezzo: "lungo", lato: "centro" }]}
                fondo={
                  <span className="text-sm tabular-nums text-ink-soft">
                    {currentIndex + 1} / {photosCount}
                  </span>
                }
              >
                <img
                  src={photos[currentIndex]}
                  alt={`Foto ${currentIndex + 1}`}
                  className="pointer-events-none h-full w-full select-none object-cover"
                  draggable={false}
                />
              </FotoStampata>
            </motion.div>
          </AnimatePresence>

          {photosCount > 1 && (
            <button type="button" onClick={goToNext} aria-label="Foto successiva" className={`${COMANDO} right-2`}>
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
