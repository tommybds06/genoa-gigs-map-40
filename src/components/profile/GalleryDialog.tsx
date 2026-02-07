import { useCallback } from "react";
import { useSwipeable } from "react-swipeable";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface GalleryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export function GalleryDialog({
  isOpen,
  onClose,
  photos,
  currentIndex,
  onIndexChange,
}: GalleryDialogProps) {
  const photosCount = photos.length;

  const goToPrevious = useCallback(() => {
    onIndexChange((currentIndex - 1 + photosCount) % photosCount);
  }, [currentIndex, photosCount, onIndexChange]);

  const goToNext = useCallback(() => {
    onIndexChange((currentIndex + 1) % photosCount);
  }, [currentIndex, photosCount, onIndexChange]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrevious,
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 30,
    swipeDuration: 500,
  });

  if (photosCount === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <div
          {...swipeHandlers}
          className="relative w-full h-full flex items-center justify-center min-h-[60vh] touch-pan-y"
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Previous button */}
          {photosCount > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-2 z-10 text-white hover:bg-white/20 rounded-full"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          {/* Image */}
          <img
            src={photos[currentIndex]}
            alt={`Foto ${currentIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain select-none pointer-events-none"
            draggable={false}
          />

          {/* Next button */}
          {photosCount > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-2 z-10 text-white hover:bg-white/20 rounded-full"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
            {currentIndex + 1} / {photosCount}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
