/**
 * USCIRE DALL'ACCOUNT, SEMPRE (15 novembre).
 *
 * Tommaso: «quando provi a uscire carica, ti porta per un attimo al login e
 * poi torna sulla mappa: non riesce a farti uscire». `supabase.auth.signOut()`
 * prima chiede al server di chiudere la sessione e SOLO SE il server risponde
 * bene la toglie dal telefono: con un errore di rete o del server (non 401,
 * 403, 404) restituisce `{ error }` e la sessione RESTA (auth-js 2.91,
 * `_signOut`). Il nostro `signOut` quell'errore non lo guardava: la pagina di
 * accesso trovava ancora l'utente e lo rimandava alla mappa.
 *
 * Ora: se il server non conferma (errore, eccezione, o nessuna risposta entro
 * `ATTESA_SERVER_MS`), la sessione si toglie dal telefono lo stesso, come fa
 * Supabase quando l'uscita riesce. Sul server la sessione scade da sola.
 *
 * Funzione pura con le dipendenze passate da fuori: la provano i test
 * (`uscita.test.ts`) senza Supabase. Senza import, per `npm test`.
 */
export const ATTESA_NOTIFICHE_MS = 3000;
export const ATTESA_SERVER_MS = 6000;

const entro = <T>(p: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([p, new Promise<null>((ok) => setTimeout(() => ok(null), ms))]);

export interface Dipendenze {
  /** Il telefono smette di ricevere le notifiche di questo account. */
  scollegaNotifiche: () => Promise<unknown>;
  /** `supabase.auth.signOut()`. */
  esciDalServer: () => Promise<{ error: unknown }>;
  /** Toglie la sessione salvata sul telefono (e avvisa chi ascolta). */
  togliSessioneLocale: () => Promise<void>;
  attesaNotificheMs?: number;
  attesaServerMs?: number;
}

/** Restituisce l'errore del server, se c'è stato (la sessione è chiusa comunque). */
export async function esciSempre(d: Dipendenze): Promise<{ errore: unknown | null }> {
  // PRIMA di uscire (dopo, le policy non lasciano più toccare la riga). Mai
  // più di qualche secondo: uscire non deve dipendere dalle notifiche.
  await entro(
    d.scollegaNotifiche().catch(() => {}),
    d.attesaNotificheMs ?? ATTESA_NOTIFICHE_MS
  );

  let errore: unknown = null;
  try {
    const esito = await entro(d.esciDalServer(), d.attesaServerMs ?? ATTESA_SERVER_MS);
    if (esito === null) errore = new Error("il server non ha risposto all'uscita");
    else if (esito.error) errore = esito.error;
  } catch (e) {
    errore = e;
  }

  if (errore) {
    try {
      await d.togliSessioneLocale();
    } catch {
      /* chi chiama azzera comunque il suo stato */
    }
  }
  return { errore };
}
