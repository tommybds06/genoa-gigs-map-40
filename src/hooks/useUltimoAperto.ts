import { useRef } from "react";

/**
 * Per le schede dal basso che si aprono su UN oggetto (un cartellino, un
 * lavoro): restituisce l'oggetto da mostrare e se la scheda è aperta.
 *
 * ⚠️ Perché (7 novembre): le schede della bacheca si chiudevano SMONTANDOSI —
 * il genitore metteva l'oggetto a `null` e la scheda faceva `return null`.
 * vaul non aveva il tempo di farla scendere: spariva in un fotogramma (da
 * 68 px dal bordo alto a niente), anche a metà di un trascinamento. Misurato:
 * scheda annuncio 33 fotogrammi di discesa, cartellino 1. Ora la scheda resta
 * montata con l'ULTIMO oggetto, e chiudere vuol dire solo `open={false}`,
 * come per la scheda dell'annuncio.
 */
export function useUltimoAperto<T>(valore: T | null): [T | null, boolean] {
  const ultimo = useRef<T | null>(valore);
  if (valore !== null) ultimo.current = valore;
  return [valore ?? ultimo.current, valore !== null];
}
