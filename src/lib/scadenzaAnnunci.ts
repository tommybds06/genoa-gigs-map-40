/**
 * LA SCADENZA DEGLI ANNUNCI — sorgente unica (decisa da Tommaso il 23 ottobre).
 *
 * - Un annuncio gratuito dura 48 ore; la data la scrive il database
 *   (`jobs.scade_il`, migration `20261023120000_scadenza_annunci.sql`), e un
 *   utente non può spostarla.
 * - NESSUNA ripubblicazione gratuita: allo scadere l'employer riceve l'avviso e
 *   può pagare per estenderlo a 7 giorni (Fase 8, Stripe), se no resta scaduto.
 * - Lo scaduto sparisce da mappa, Lista e profilo pubblico, ma NON da Annunci
 *   per chi l'ha pubblicato.
 */

export const ORE_GRATUITE = 48;
export const GIORNI_A_PAGAMENTO = 7;

interface ConScadenza {
  scade_il?: string | null;
  created_at?: string | null;
}

/**
 * La data di scadenza. Il ripiego su `created_at` vale solo per dati vecchi;
 * `null` se l'oggetto non porta nessuna delle due (un annuncio letto con una
 * select parziale): in quel caso non si sa, e non lo si dà per scaduto.
 */
export function scadenzaDi(a: ConScadenza): Date | null {
  if (a.scade_il) return new Date(a.scade_il);
  if (a.created_at) return new Date(new Date(a.created_at).getTime() + ORE_GRATUITE * 3600_000);
  return null;
}

export function annuncioScaduto(a: ConScadenza | null | undefined, adesso: number = Date.now()): boolean {
  const scade = a ? scadenzaDi(a) : null;
  return scade !== null && scade.getTime() <= adesso;
}

/** «Scade tra 5 ore», «Scade tra 40 minuti», «Scaduto». */
export function testoScadenza(a: ConScadenza, adesso: number = Date.now()): string {
  const scade = scadenzaDi(a);
  if (!scade) return "";
  const ms = scade.getTime() - adesso;
  if (ms <= 0) return "Scaduto";
  const minuti = Math.round(ms / 60_000);
  if (minuti < 60) return `Scade tra ${minuti} minut${minuti === 1 ? "o" : "i"}`;
  const ore = Math.round(minuti / 60);
  return `Scade tra ${ore} or${ore === 1 ? "a" : "e"}`;
}

/** Per le query: «ancora visibile» = scade dopo adesso. */
export const adessoISO = () => new Date().toISOString();
