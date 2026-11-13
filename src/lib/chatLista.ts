/**
 * LA LISTA DELLE CHAT: fissate, nascoste, e la ricerca dentro una chat
 * (13 novembre 2026). Funzioni pure, senza import: le esegue anche `npm test`.
 *
 * - **Fissata** → in cima. Fra le fissate, e fra le altre, resta l'ordine di
 *   prima (l'ultima attività).
 * - **Nascosta** («Nascondi», decisione di Tommaso: per me soltanto) → fuori
 *   dalla lista FINCHÉ non arriva un messaggio più recente di quando è stata
 *   nascosta. Non si cancella niente: la chat è la traccia degli accordi.
 */
export interface StatoChat {
  fissata_il?: string | null;
  nascosta_il?: string | null;
  last_message?: { created_at: string } | null;
}

const tempo = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : NaN);

export function eNascosta(c: StatoChat): boolean {
  const da = tempo(c.nascosta_il);
  if (Number.isNaN(da)) return false;
  const ultimo = tempo(c.last_message?.created_at);
  return Number.isNaN(ultimo) || ultimo <= da;
}

/** Le chat da mostrare: senza le nascoste, le fissate in cima. Ordine stabile. */
export function chatInLista<T extends StatoChat>(chats: T[]): T[] {
  const visibili = chats.filter((c) => !eNascosta(c));
  return [...visibili.filter((c) => !!c.fissata_il), ...visibili.filter((c) => !c.fissata_il)];
}

/* ------------------------------------------------------------------ */
/* Cercare dentro una chat                                             */
/* ------------------------------------------------------------------ */

/**
 * Minuscole e senza accenti, UN carattere per carattere: così la posizione
 * trovata nel testo «pulito» è la stessa nel testo vero, e si può mettere in
 * evidenza il pezzo giusto.
 */
export function senzaAccenti(testo: string): string {
  let fuori = "";
  for (const ch of testo) {
    const base = ch.normalize("NFD")[0] ?? ch;
    // Un carattere fuori dal piano base (un'emoji) occupa due posti: restano due.
    fuori += ch.length === 1 ? base.toLowerCase().slice(0, 1) || ch : ch;
  }
  return fuori;
}

export interface Trovato<T> {
  messaggio: T;
  /** Il testo in cui si è cercato, e dove sta la corrispondenza. */
  testo: string;
  inizio: number;
  fine: number;
}

/**
 * I messaggi che contengono `cerca`, dal più recente. Sotto i 2 caratteri
 * niente: una lettera sola troverebbe tutto.
 */
export function cercaMessaggi<T extends { created_at: string }>(
  messaggi: T[],
  cerca: string,
  testoDi: (m: T) => string
): Trovato<T>[] {
  const ago = senzaAccenti(cerca.trim());
  if (ago.length < 2) return [];
  const trovati: Trovato<T>[] = [];
  for (const m of messaggi) {
    const testo = testoDi(m);
    if (!testo) continue;
    const i = senzaAccenti(testo).indexOf(ago);
    if (i !== -1) trovati.push({ messaggio: m, testo, inizio: i, fine: i + ago.length });
  }
  return trovati.sort((a, b) => (a.messaggio.created_at < b.messaggio.created_at ? 1 : -1));
}

/**
 * Il pezzo di testo da mostrare attorno alla corrispondenza: se sta in fondo
 * a un messaggio lungo, in una riga troncata non si vedrebbe.
 */
export function ritaglio(t: { testo: string; inizio: number; fine: number }, prima = 24) {
  const da = t.inizio > prima ? t.inizio - prima : 0;
  return {
    prima: (da > 0 ? "…" : "") + t.testo.slice(da, t.inizio),
    trovato: t.testo.slice(t.inizio, t.fine),
    dopo: t.testo.slice(t.fine),
  };
}
