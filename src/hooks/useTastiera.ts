import { useEffect, useState } from "react";

/**
 * QUANTO COPRE LA TASTIERA, in px (15 novembre).
 *
 * Chrome su Android (dalla 108) e Safari su iPhone NON rimpiccioliscono la
 * pagina quando si apre la tastiera: rimpiccioliscono solo la «visual
 * viewport», e la tastiera copre il fondo di tutto ciò che è `fixed`. Qui si
 * misura quanto: l'altezza della pagina meno quella visibile.
 *
 * Serve alle schede con un campo di ricerca (`CercaInChat`,
 * `NeighborhoodSelect`): invece di lasciare che vaul sposti e ridimensioni la
 * scheda (`repositionInputs`, spento lì: §18), la scheda resta ferma e la sua
 * lista prende sotto uno spazio alto quanto la tastiera, così l'ultimo
 * risultato si raggiunge scorrendo. Se il telefono invece rimpicciolisce la
 * pagina, la misura vale 0 e le altezze in `dvh` fanno il resto.
 */
export function useTastiera(attivo = true): number {
  const [altezza, setAltezza] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!attivo || !vv) return;
    const misura = () => {
      const pagina = document.documentElement.clientHeight;
      setAltezza(Math.max(0, Math.round(pagina - vv.height - vv.offsetTop)));
    };
    misura();
    vv.addEventListener("resize", misura);
    vv.addEventListener("scroll", misura);
    return () => {
      vv.removeEventListener("resize", misura);
      vv.removeEventListener("scroll", misura);
      setAltezza(0);
    };
  }, [attivo]);
  return altezza;
}
