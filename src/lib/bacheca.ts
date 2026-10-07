import { supabase } from "@/integrations/supabase/client";

/**
 * BACHECA — la logica che non dipende dall'interfaccia.
 *
 * Un cartellino e' una persona appesa alla bacheca di un employer. Lo STATO
 * non sta sul cartellino: si legge dalla candidatura (vedi la migration
 * `20261006120000_cartellini.sql`), cosi' bacheca e chat non possono
 * contraddirsi.
 *
 * Gli accordi (date, paga, giorni) sono promemoria dentro l'app, non un
 * contratto. ⚠️ Mai scrivere "a tempo indeterminato" per una data di fine
 * vuota: in Italia e' un tipo di contratto preciso.
 */

export type StatoCartellino = "prova" | "assunto" | "concluso";
export type UnitaPaga = "ora" | "giorno" | "settimana" | "mese" | "forfait";

export interface Cartellino {
  id: string;
  applicationId: string;
  workerId: string;
  jobId: string;
  chatId: string | null;
  stato: StatoCartellino;
  dataInizio: string | null;
  dataFine: string | null;
  pagaImporto: number | null;
  pagaUnita: UnitaPaga | null;
  giorni: number[] | null;
  orari: string | null;
  nome: string;
  foto: string | null;
  mestiere: string;
  tags: string[];
  /** Il testo libero della paga sull'annuncio: ripiego se gli accordi sono vuoti. */
  pagaAnnuncio: string | null;
}

export const STATO_DA_CANDIDATURA: Record<string, StatoCartellino | undefined> = {
  accepted: "prova",
  hired: "assunto",
  completed: "concluso",
};

export const UNITA: { valore: UnitaPaga; etichetta: string; breve: string }[] = [
  { valore: "ora", etichetta: "all'ora", breve: "/ora" },
  { valore: "giorno", etichetta: "al giorno", breve: "/giorno" },
  { valore: "settimana", etichetta: "a settimana", breve: "/sett." },
  { valore: "mese", etichetta: "al mese", breve: "/mese" },
  { valore: "forfait", etichetta: "a forfait", breve: " forfait" },
];

/** Giorni ISO: 1 = lunedi' … 7 = domenica. */
export const GIORNI = [
  { n: 1, lettera: "L", nome: "lunedì" },
  { n: 2, lettera: "M", nome: "martedì" },
  { n: 3, lettera: "M", nome: "mercoledì" },
  { n: 4, lettera: "G", nome: "giovedì" },
  { n: 5, lettera: "V", nome: "venerdì" },
  { n: 6, lettera: "S", nome: "sabato" },
  { n: 7, lettera: "D", nome: "domenica" },
];

// ---------------------------------------------------------------------------
// Date. Le colonne sono `DATE` ("2026-10-06"): niente fusi orari, quindi si
// confrontano come date locali, mai passando da `new Date("2026-10-06")`,
// che le leggerebbe come mezzanotte UTC e a Genova sposterebbe il giorno.
// ---------------------------------------------------------------------------

export function oggiISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${g}`;
}

function daISO(iso: string): Date {
  const [a, m, g] = iso.split("-").map(Number);
  return new Date(a, m - 1, g);
}

function aISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${g}`;
}

/** Giorni di calendario da oggi alla data: 0 = oggi, negativo = passata. */
export function giorniA(iso: string): number {
  const oggi = daISO(oggiISO());
  return Math.round((daISO(iso).getTime() - oggi.getTime()) / 86_400_000);
}

/** "6 ott", o "6 ott 2027" se non e' quest'anno. */
export function formatData(iso: string | null): string {
  if (!iso) return "";
  const d = daISO(iso);
  const stessoAnno = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    ...(stessoAnno ? {} : { year: "numeric" }),
  });
}

/** Sposta una data in avanti: base = la fine attuale se e' futura, se no oggi. */
export function estendiDa(dataFine: string | null, giorni: number, mesi = 0): string {
  const oggi = oggiISO();
  const base = daISO(dataFine && dataFine > oggi ? dataFine : oggi);
  base.setMonth(base.getMonth() + mesi);
  base.setDate(base.getDate() + giorni);
  return aISO(base);
}

/**
 * Quanto manca alla fine, in parole — o null se non c'e' niente da dire.
 * Si parla solo nell'ultima settimana: prima e' rumore.
 */
export function avvisoScadenza(
  dataFine: string | null
): { testo: string; urgente: boolean } | null {
  if (!dataFine) return null;
  const n = giorniA(dataFine);
  if (n < 0) return { testo: n === -1 ? "Finito ieri" : `Finito il ${formatData(dataFine)}`, urgente: true };
  if (n === 0) return { testo: "Finisce oggi", urgente: true };
  if (n === 1) return { testo: "Finisce domani", urgente: false };
  if (n <= 7) return { testo: `Finisce tra ${n} giorni`, urgente: false };
  return null;
}

export function eScaduto(c: Pick<Cartellino, "dataFine" | "stato">): boolean {
  return c.stato !== "concluso" && !!c.dataFine && giorniA(c.dataFine) < 0;
}

// ---------------------------------------------------------------------------
// Paga
// ---------------------------------------------------------------------------

export function formatPaga(importo: number | null, unita: UnitaPaga | null): string | null {
  if (importo === null || importo === undefined) return null;
  const numero = Number.isInteger(importo)
    ? String(importo)
    : importo.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const breve = UNITA.find((u) => u.valore === unita)?.breve ?? "";
  return `${numero} €${breve}`;
}

/**
 * Prova a leggere importo e unita' dal testo libero dell'annuncio
 * ("9€/h", "150/settimana", "10 euro l'ora"). Serve SOLO a precompilare il
 * modulo: non viene salvato finche' l'employer non preme Salva.
 * Se il testo e' ambiguo restituisce quello che ha capito, anche niente.
 */
export function leggiPagaDaTesto(testo: string | null | undefined): {
  importo: number | null;
  unita: UnitaPaga | null;
} {
  if (!testo) return { importo: null, unita: null };
  const t = testo.toLowerCase();
  const numero = t.match(/(\d+(?:[.,]\d{1,2})?)/);
  const importo = numero ? Number(numero[1].replace(",", ".")) : null;

  let unita: UnitaPaga | null = null;
  if (/\/\s*h\b|\bh\b|\bor[ae]\b|orari/.test(t)) unita = "ora";
  else if (/giorn|\bgg\b|\/\s*g\b/.test(t)) unita = "giorno";
  else if (/settiman|\bsett\b/.test(t)) unita = "settimana";
  else if (/\bmes[ei]\b|mensil/.test(t)) unita = "mese";
  else if (/forfait|totale|in tutto/.test(t)) unita = "forfait";

  return { importo: importo !== null && Number.isFinite(importo) ? importo : null, unita };
}

// ---------------------------------------------------------------------------
// Varieta' visiva: puntina e inclinazione derivano dall'id, cosi' un
// cartellino tiene sempre la stessa — riordinare la bacheca non le rimescola.
// ---------------------------------------------------------------------------

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const INCLINAZIONI = [-1.6, 1.2, -0.7, 1.8, -1.3, 0.8, -1.9, 1.4];

export function varieta(id: string) {
  const h = hash(id);
  return {
    puntina: h % 3,
    gradi: INCLINAZIONI[h % INCLINAZIONI.length],
    /** Spostamento orizzontale della puntina, in % dal centro. */
    spostamento: ((h >> 3) % 21) - 10,
  };
}

// ---------------------------------------------------------------------------
// AZIONI — sorgente unica. Le usano sia la bacheca sia la chat.
// ---------------------------------------------------------------------------

const MESSAGGIO_ASSUNZIONE = "🎉 Complimenti! Sei stato assunto per questo incarico.";

/**
 * Chiude l'annuncio SOLO se non resta nessuno al lavoro su quell'annuncio.
 *
 * ⚠️ Prima «Concludi» lo chiudeva sempre: con due persone assunte sullo stesso
 * annuncio, terminarne una lo toglieva di mezzo anche per l'altra. "Al
 * lavoro" = assunto o in prova: chi e' in prova e' ancora una persona su cui
 * l'employer sta decidendo.
 */
export async function chiudiAnnuncioSeNessunoResta(jobId: string, workerUscente: string) {
  const { count, error } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId)
    .neq("applicant_id", workerUscente)
    .in("status", ["accepted", "hired"]);

  if (error) {
    console.error("Controllo annuncio da chiudere:", error);
    return;
  }
  if ((count ?? 0) > 0) return;

  const { error: errChiusura } = await supabase
    .from("jobs")
    .update({ status: "closed" })
    .eq("id", jobId);
  if (errChiusura) console.error("Chiusura annuncio:", errChiusura);
}

/** Termina il lavoro: candidatura → completed (che apre la recensione al worker). */
export async function terminaLavoro(jobId: string, workerId: string) {
  const { error } = await supabase
    .from("applications")
    .update({ status: "completed" })
    .eq("job_id", jobId)
    .eq("applicant_id", workerId);
  if (error) throw error;
  await chiudiAnnuncioSeNessunoResta(jobId, workerId);
}

/**
 * Assume chi e' in prova. Stesso effetto del bottone «Assumi» in chat,
 * messaggio automatico compreso. Il cartellino esiste gia': il trigger
 * `appendi_assunto` non fa niente se c'e'.
 */
export async function assumi(c: Pick<Cartellino, "jobId" | "workerId" | "chatId">, mittente: string) {
  const { error } = await supabase
    .from("applications")
    .update({ status: "hired" })
    .eq("job_id", c.jobId)
    .eq("applicant_id", c.workerId);
  if (error) throw error;

  if (c.chatId) {
    const { error: errMsg } = await supabase.from("messages").insert({
      chat_id: c.chatId,
      sender_id: mittente,
      content: MESSAGGIO_ASSUNZIONE,
      is_system: true,
    });
    if (errMsg) console.error("Messaggio di assunzione:", errMsg);
  }
}

/** Appende alla bacheca, in prova, una persona di cui hai accettato la candidatura. */
export async function appendi(
  candidato: { applicationId: string; workerId: string; jobId: string; pagaAnnuncio: string | null },
  employerId: string
) {
  const { importo, unita } = leggiPagaDaTesto(candidato.pagaAnnuncio);
  // `employer_id`, `worker_id`, `job_id` il trigger li riscrive comunque
  // leggendoli dalla candidatura: mandarli giusti serve solo ai tipi.
  const { error } = await supabase.from("cartellini").insert({
    application_id: candidato.applicationId,
    employer_id: employerId,
    worker_id: candidato.workerId,
    job_id: candidato.jobId,
    paga_importo: importo,
    paga_unita: importo !== null ? unita : null,
  });
  if (error) throw error;
}

/** Stacca il cartellino. La candidatura e la chat restano come sono. */
export async function stacca(id: string) {
  const { error } = await supabase.from("cartellini").delete().eq("id", id);
  if (error) throw error;
}

export interface Accordi {
  dataInizio: string | null;
  dataFine: string | null;
  pagaImporto: number | null;
  pagaUnita: UnitaPaga | null;
  giorni: number[] | null;
  orari: string | null;
}

export async function salvaAccordi(id: string, a: Partial<Accordi>) {
  const riga: Record<string, unknown> = {};
  if ("dataInizio" in a) riga.data_inizio = a.dataInizio;
  if ("dataFine" in a) riga.data_fine = a.dataFine;
  if ("pagaImporto" in a) riga.paga_importo = a.pagaImporto;
  if ("pagaUnita" in a) riga.paga_unita = a.pagaUnita;
  if ("giorni" in a) riga.giorni = a.giorni && a.giorni.length > 0 ? a.giorni : null;
  if ("orari" in a) riga.orari = a.orari?.trim() ? a.orari.trim() : null;
  const { error } = await supabase.from("cartellini").update(riga).eq("id", id);
  if (error) throw error;
}
