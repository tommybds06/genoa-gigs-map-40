// Global swipe state that survives across route changes
// Uses sync external store pattern for React compatibility

type SwipeDirection = "left" | "right" | null;

let currentSwipeDirection: SwipeDirection = null;
let listeners: Set<() => void> = new Set();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function setSwipeDirection(direction: SwipeDirection) {
  currentSwipeDirection = direction;
  emitChange();
  
  // Auto-reset after FULL transition completes (exit + enter animations)
  // With AnimatePresence mode="wait": exit(300ms) + enter(300ms) = 600ms
  // Adding buffer for safety
  if (direction !== null) {
    setTimeout(() => {
      if (currentSwipeDirection === direction) {
        currentSwipeDirection = null;
        emitChange();
      }
    }, 800);
  }
}

export function getSwipeDirectionSnapshot(): SwipeDirection {
  return currentSwipeDirection;
}

export function subscribeToSwipeDirection(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// For server rendering (not used but required by useSyncExternalStore)
export function getServerSnapshot(): SwipeDirection {
  return null;
}