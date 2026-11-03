import { createContext, useContext, useEffect, useRef } from "react";

/**
 * LO STATO DI UNA SCHEDA della barra in basso (3 novembre). Le pagine con la
 * barra si montano una volta sola e restano montate (components/layout/
 * Schede.tsx): una pagina ora può esistere senza essere quella che si guarda.
 *
 * - `attiva`: l'indirizzo è il suo. Schede dal basso e finestre possono stare
 *   aperte solo qui.
 * - `visibile`: è lei quella sullo schermo, anche sotto una pagina di
 *   dettaglio (Impostazioni, profilo pubblico…) entrata da destra.
 *
 * Fuori dalle schede (pagine di dettaglio, accesso) vale sempre tutto vero.
 */
export interface StatoScheda {
  attiva: boolean;
  visibile: boolean;
}

export const SchedaContext = createContext<StatoScheda>({ attiva: true, visibile: true });

export const useScheda = () => useContext(SchedaContext);

/**
 * Chiama `fn` ogni volta che la scheda torna attiva (non alla prima
 * apertura): il posto di ciò che prima si faceva «a ogni visita», quando la
 * pagina si rimontava.
 */
export function useAllaRiattivazione(fn: () => void) {
  const { attiva } = useScheda();
  const prima = useRef(attiva);
  const rif = useRef(fn);
  rif.current = fn;
  useEffect(() => {
    if (attiva && !prima.current) rif.current();
    prima.current = attiva;
  }, [attiva]);
}

/**
 * Per schede dal basso e finestre (ui/drawer, ui/dialog, ui/alert-dialog):
 * stanno in un portal, fuori dalla pagina, quindi quando la pagina smette di
 * essere attiva resterebbero aperte sopra la nuova (per esempio col gesto
 * «indietro» di Android). Le si chiude davvero, avvisando chi le controlla.
 * Restituisce l'`open` da passare alla libreria, già spento nello stesso
 * fotogramma.
 */
export function useApertaSoloInScheda(open: boolean | undefined, onOpenChange?: (open: boolean) => void) {
  const { attiva } = useScheda();
  const rif = useRef(onOpenChange);
  rif.current = onOpenChange;
  useEffect(() => {
    if (!attiva && open) rif.current?.(false);
  }, [attiva, open]);
  return open === undefined ? undefined : open && attiva;
}
