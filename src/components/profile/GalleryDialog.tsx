import { FreccettaIcon } from "@/components/icons/uiIcons";
import { useCallback, useEffect } from "react";
import { XIcon } from "@/components/icons/uiIcons";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PilaPolaroid } from "@/components/profile/PilaPolaroid";

interface GalleryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  /** Il ruolo del PROFILO mostrato (colore dello scotch). */
  employer?: boolean;
}


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
 * Dal 19 novembre è la stessa pila del Profilo (`PilaPolaroid`): la stampa
 * in cima si trascina e vola via. Toccare lo sfondo fuori dalla foto chiude.
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

  // Preload all photos as soon as the dialog opens
  useEffect(() => {
    if (!isOpen) return;
    photos.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [isOpen, photos]);

  const goToPrevious = useCallback(() => {
    onIndexChange((currentIndex - 1 + photosCount) % photosCount);
  }, [currentIndex, photosCount, onIndexChange]);

  const goToNext = useCallback(() => {
    onIndexChange((currentIndex + 1) % photosCount);
  }, [currentIndex, photosCount, onIndexChange]);

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
              <FreccettaIcon className="rotate-180 h-6 w-6" />
            </button>
          )}

          {/* La stessa PILA di Polaroid del Profilo (19 novembre): si sfoglia
              trascinando la stampa in cima; le frecce restano per chi tocca. */}
          <PilaPolaroid
            seme="galleria"
            foto={photos}
            indice={currentIndex}
            onIndice={onIndexChange}
            employer={employer}
            className="w-[min(calc(100vw-7rem),62vh)]"
            fondo={(i) => (
              <span className="text-sm tabular-nums text-ink-soft">
                {i + 1} / {photosCount}
              </span>
            )}
          />

          {photosCount > 1 && (
            <button type="button" onClick={goToNext} aria-label="Foto successiva" className={`${COMANDO} right-2`}>
              <FreccettaIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
