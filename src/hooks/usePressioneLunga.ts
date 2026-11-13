import { useRef, type MouseEvent, type PointerEvent } from "react";

const DURATA = 450; // ms
const TOLLERANZA = 10; // px: oltre, è uno scorrimento

/**
 * LA PRESSIONE LUNGA su una riga che ha già il suo tocco (13 novembre): le
 * chat in lista. Un solo timer per tutta la lista: `gestori(chat)` dà gli
 * eventi da mettere sulla riga.
 *
 * - si annulla se il dito si sposta (scorrimento) o il browser prende il
 *   gesto (`pointercancel`);
 * - `contextmenu` copre il tasto destro e, su Android, la pressione lunga di
 *   sistema: si ferma il menu nativo e si apre il nostro, una volta sola;
 * - ⚠️ dopo una pressione lunga il dito si alza e il browser manda comunque il
 *   `click`: va fermato in CATTURA, se no si aprirebbe anche la chat.
 */
export function usePressioneLunga<T>(onLunga: (cosa: T) => void) {
  const stato = useRef<{ timer: number; x: number; y: number } | null>(null);
  const scattataIl = useRef(0);

  const annulla = () => {
    if (stato.current) window.clearTimeout(stato.current.timer);
    stato.current = null;
  };
  const scatta = (cosa: T) => {
    annulla();
    if (Date.now() - scattataIl.current < 800) return;
    scattataIl.current = Date.now();
    if (navigator.vibrate) navigator.vibrate(10);
    onLunga(cosa);
  };

  return (cosa: T) => ({
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      annulla();
      stato.current = { x: e.clientX, y: e.clientY, timer: window.setTimeout(() => scatta(cosa), DURATA) };
    },
    onPointerMove: (e: PointerEvent) => {
      const s = stato.current;
      if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > TOLLERANZA) annulla();
    },
    onPointerUp: annulla,
    onPointerCancel: annulla,
    onContextMenu: (e: MouseEvent) => {
      e.preventDefault();
      scatta(cosa);
    },
    onClickCapture: (e: MouseEvent) => {
      if (Date.now() - scattataIl.current < 800) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  });
}
