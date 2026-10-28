import { supabase } from "@/integrations/supabase/client";

/**
 * ATTIVITÀ O PRIVATO, ETÀ, VERIFICHE — le regole della registrazione in un
 * posto solo (24 ottobre 2026), usate da Auth, Scegli ruolo, Onboarding e
 * Modifica profilo. Il database ripete i controlli che contano (migration
 * 20261024120000_attivita_privato.sql): qui servono a dirli bene all'utente.
 */

export type TipoEmployer = "attivita" | "privato";

export const ETA_MINIMA = 18;

/**
 * La password NUOVA (registrazione, reimpostazione): almeno 8 caratteri, come
 * NIST 800-63B, niente regole su maiuscole e simboli (portano a «Politask1!»).
 * ⚠️ Per ENTRARE non si controlla la lunghezza: chi si è iscritto quando ne
 * bastavano 6 deve poter ancora accedere. Il minimo va impostato anche nelle
 * impostazioni di accesso del database, se no lo si salta chiamando il server.
 */
export const PASSWORD_MINIMA = 8;
export function controllaPasswordNuova(p: string): string | null {
  if (p.length < PASSWORD_MINIMA) return `La password deve avere almeno ${PASSWORD_MINIMA} caratteri`;
  if (p.length > 72) return "Password troppo lunga";
  return null;
}
/** Il raggio dell'area di un privato, in metri. */
export const RAGGIO_AREA = 300;

export const MESSAGGIO_MINORENNE =
  "Per usare Politask serve avere almeno 18 anni. Ti aspettiamo quando li compi!";

/** I testi che cambiano fra attività e privato. */
export function testiEmployer(tipo: TipoEmployer | null | undefined) {
  const privato = tipo === "privato";
  return {
    nome: privato ? "Nome e cognome" : "Nome attività (se ne si ha una)",
    zona: privato ? "In che zona ti trovi?" : "In che zona si trova la tua attività?",
    titoloConfigura: privato ? "Configura il tuo profilo" : "Configura la tua attività",
    sezione: privato ? "Chi sei" : "La tua attività",
    descrizione: privato ? "Descrizione" : "Descrizione attività",
    segnapostoDescrizione: privato
      ? "Racconta chi sei e che tipo di aiuto cerchi di solito..."
      : "Descrivi la tua attività, cosa fate e cosa offrite...",
    foto: privato ? "Foto" : "Foto attività / logo",
    testoFoto: privato ? "Qualche foto aiuta a fidarsi" : "Carica foto della tua attività o il logo",
    bottoneConfigura: privato ? "Completa profilo" : "Configura attività",
  };
}

/** Anni compiuti a oggi, da una data «AAAA-MM-GG» (ora locale, mai UTC). */
export function anniCompiuti(dataISO: string, oggi = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataISO);
  if (!m) return null;
  const [a, me, g] = [Number(m[1]), Number(m[2]), Number(m[3])];
  let anni = oggi.getFullYear() - a;
  if (oggi.getMonth() + 1 < me || (oggi.getMonth() + 1 === me && oggi.getDate() < g)) anni--;
  return anni;
}

/**
 * Il controllo dell'età per il modulo: un messaggio d'errore per campo, o
 * niente. `confermato` è la casella «Ho almeno 18 anni».
 */
export function controllaEta(dataISO: string, confermato: boolean) {
  const errori: { nascita?: string; conferma?: string } = {};
  const anni = dataISO ? anniCompiuti(dataISO) : null;
  if (!dataISO || anni === null) errori.nascita = "Inserisci la tua data di nascita";
  else if (anni < 0 || anni > 110) errori.nascita = "Controlla la data di nascita";
  else if (anni < ETA_MINIMA) errori.nascita = MESSAGGIO_MINORENNE;
  if (!confermato && !errori.nascita) errori.conferma = "Conferma di avere almeno 18 anni";
  return errori;
}

/**
 * I dati che legge solo il proprietario (`profili_riservati`): data di
 * nascita, area vera del privato. Upsert: si può ripassare.
 */
export async function salvaRiservati(
  id: string,
  dati: {
    data_nascita?: string;
    maggiorenne_confermato_il?: string;
    area_lat?: number;
    area_lng?: number;
    area_raggio?: number;
  }
) {
  const { error } = await supabase.from("profili_riservati").upsert({ id, ...dati }, { onConflict: "id" });
  if (error) throw error;
}

export type EsitoPartitaIva = "valida" | "non_valida" | "formato" | "gia_usata" | "servizio" | "non_attivita";

export const MESSAGGI_PARTITA_IVA: Record<EsitoPartitaIva, string> = {
  valida: "Partita IVA verificata: ora sei un'attività verificata",
  non_valida: "Questa partita IVA non risulta attiva nel registro europeo",
  formato: "La partita IVA è di 11 cifre: controlla di averla scritta bene",
  gia_usata: "Questa partita IVA è già verificata su un altro account",
  servizio: "Il registro europeo non risponde: riprova fra qualche minuto",
  non_attivita: "La verifica della partita IVA è per le attività",
};

/** Chiede la verifica all'edge function (che sola può accendere il badge). */
export async function verificaPartitaIva(partitaIva: string): Promise<EsitoPartitaIva> {
  const { data, error } = await supabase.functions.invoke("verifica-partita-iva", {
    body: { partita_iva: partitaIva },
  });
  if (error) {
    // 403 = non è un'attività; tutto il resto è il servizio che non risponde.
    return /403/.test(String(error.message)) ? "non_attivita" : "servizio";
  }
  return (data?.esito as EsitoPartitaIva) ?? "servizio";
}
