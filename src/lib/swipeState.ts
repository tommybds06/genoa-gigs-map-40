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
  
  // Auto-reset after animation completes
  if (direction !== null) {
    setTimeout(() => {
      if (currentSwipeDirection === direction) {
        currentSwipeDirection = null;
        emitChange();
      }
    }, 500);
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