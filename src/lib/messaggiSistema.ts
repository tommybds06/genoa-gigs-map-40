/**
 * I MESSAGGI AUTOMATICI IN CHAT — scritti dall'app, non da una persona.
 *
 * ⚠️ Un messaggio salvato UNA volta lo leggono DUE persone. Il messaggio
 * d'assunzione era salvato con la voce del worker («🎉 Complimenti! Sei stato
 * assunto…») e la chat lo stampava così com'era: l'employer leggeva i
 * complimenti per un'assunzione che aveva fatto lui (Tommaso, 22 ottobre).
 *
 * Quindi:
 * - nel database si salva un testo NEUTRO (`MESSAGGIO_ASSUNZIONE`), che regge
 *   anche dove viene mostrato così com'è (una versione vecchia dell'app);
 * - in chat e in anteprima il testo si scrive SECONDO CHI LEGGE
 *   (`testoDiSistema`): il worker vede i complimenti, l'employer chi ha
 *   assunto;
 * - niente emoji (Tommaso: via i coriandoli), e niente «assunto» al
 *   maschile per il worker, come nel resto dell'app.
 *
 * I messaggi vecchi, già nel database con l'emoji, si riconoscono e si
 * mostrano allo stesso modo.
 */

export const MESSAGGIO_ASSUNZIONE = "Assunzione confermata per questo incarico.";

/** Tutti i testi con cui un'assunzione è stata salvata, vecchi compresi. */
const TESTI_ASSUNZIONE = [MESSAGGIO_ASSUNZIONE, "🎉 Complimenti! Sei stato assunto per questo incarico."];

/**
 * La chiusura automatica (pg_cron, `chiudi_lavori_scaduti`) scrive «Il lavoro
 * si è chiuso automaticamente: era previsto fino al GG/MM.» col mittente
 * employer, perché `sender_id` non può essere vuoto.
 */
const INIZIO_CHIUSURA_AUTOMATICA = "Il lavoro si è chiuso automaticamente";

/** È un messaggio scritto dall'app? (Per l'anteprima, che non ha `is_system`.) */
export function eMessaggioDiSistema(contenuto: string | null | undefined): boolean {
  const t = (contenuto || "").trim();
  return TESTI_ASSUNZIONE.includes(t) || t.startsWith(INIZIO_CHIUSURA_AUTOMATICA);
}

export interface Lettore {
  isEmployer: boolean;
  /** Il nome dell'altra persona della chat (per l'employer: chi ha assunto). */
  nomeAltro?: string | null;
}

/** Il testo di un messaggio automatico, scritto per chi lo sta leggendo. */
export function testoDiSistema(contenuto: string | null | undefined, lettore: Lettore): string {
  const t = (contenuto || "").trim();
  if (TESTI_ASSUNZIONE.includes(t)) {
    return lettore.isEmployer
      ? `Hai assunto ${lettore.nomeAltro || "questa persona"} per questo lavoro.`
      : "Complimenti! Hai ottenuto questo lavoro.";
  }
  // Per sicurezza, un'eventuale emoji iniziale su altri testi automatici.
  return t.replace(/^\p{Extended_Pictographic}️?\s*/u, "");
}

/** Che messaggio automatico è: decide l'icona e il colore del «timbro» in chat. */
export function tipoDiSistema(contenuto: string | null | undefined): "assunzione" | "chiusura" | "altro" {
  const t = (contenuto || "").trim();
  if (TESTI_ASSUNZIONE.includes(t)) return "assunzione";
  if (t.startsWith(INIZIO_CHIUSURA_AUTOMATICA)) return "chiusura";
  return "altro";
}
