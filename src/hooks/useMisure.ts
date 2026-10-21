import { useLayoutEffect, useRef, useState } from "react";

/**
 * Le misure vere del contenitore: `offsetWidth/offsetHeight` (non risentono
 * della rotazione, a differenza di `getBoundingClientRect`), rilette a ogni
 * ridimensionamento. Usata dalle sagome della bacheca (cartellino e negozio).
 */
export function useMisure<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [misure, setMisure] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const leggi = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setMisure((m) => (m && m.w === w && m.h === h ? m : { w, h }));
    };
    leggi();
    const osservatore = new ResizeObserver(leggi);
    osservatore.observe(el);
    return () => osservatore.disconnect();
  }, []);

  return { ref, misure };
}
