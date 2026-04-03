import { useCallback, useEffect, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
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

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "55%" : "-55%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? "55%" : "-55%", opacity: 0 }),
};

export function GalleryDialog({
  isOpen,
  onClose,
  photos,
  currentIndex,
  onIndexChange,
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
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden">
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

          {/* Animated image */}
          <AnimatePresence initial={false} custom={directionRef.current} mode="popLayout">
            <motion.img
              key={currentIndex}
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
              src={photos[currentIndex]}
              alt={`Foto ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain select-none pointer-events-none"
              draggable={false}
            />
          </AnimatePresence>

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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full z-10">
            {currentIndex + 1} / {photosCount}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
