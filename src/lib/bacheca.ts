import { MESSAGGIO_ASSUNZIONE } from "@/lib/messaggiSistema";
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
  /** Giorno dell'assunzione (da qui si contano i 3 mesi). Nascosto in interfaccia. */
  assuntoIl: string | null;
  /** Ultima risposta «è ancora attivo» al controllo trimestrale. Nascosto. */
  ultimoControllo: string | null;
  /** Il cuore dell'employer: true / false (saltato) / null (non ancora chiesto). */
  cuore: boolean | null;
  /** Quando ha risposto o saltato la card del cuore. */
  esitoIl: string | null;
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
    // Niente più spostamento orizzontale della puntina: ora entra nel foro,
    // che sta sempre al centro (lib/formaCartellino.ts).
  };
}

// ---------------------------------------------------------------------------
// AZIONI — sorgente unica. Le usano sia la bacheca sia la chat.
// ---------------------------------------------------------------------------


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
  // ⚠️ L'array VUOTO è un valore, non «niente»: vuol dire turni variabili
  // (vedi `modoGiorni`). Si passa così com'è; NULL = giorni non fissati.
  if ("giorni" in a) riga.giorni = a.giorni;
  if ("orari" in a) riga.orari = a.orari?.trim() ? a.orari.trim() : null;
  const { error } = await supabase.from("cartellini").update(riga).eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// LATO WORKER — la sua bacheca dei lavori in cui è stato preso.
// ---------------------------------------------------------------------------

export type StatoLavoro = "prova" | "assunto" | "finito" | "da-recensire" | "concluso";

/**
 * Lo stato che vede il worker, letto SOLO da dati che esistono già — nessuna
 * colonna nuova:
 *
 *   - candidatura `accepted` (+ cartellino appeso) → In prova
 *   - candidatura `hired`                          → Assunto
 *   - uno dei due, ma la `data_fine` del cartellino è passata → Finito
 *     (i giorni previsti sono finiti, l'employer non ha ancora concluso)
 *   - `completed` senza recensione                 → Da recensire
 *   - `completed` con recensione                   → Concluso
 *
 * ⚠️ «Recensito» = esiste una riga in `reviews` per quel lavoro e quel worker,
 * NON `applications.is_reviewed`: quel campo ReviewPrompt lo mette a true
 * anche quando la finestra viene chiusa o saltata senza recensire. Usarlo
 * avrebbe mostrato «Concluso» a chi non ha mai recensito, togliendogli la
 * possibilità di farlo da qui.
 */
export function statoLavoro(
  statoCandidatura: string | null | undefined,
  recensito: boolean,
  dataFine: string | null
): StatoLavoro | null {
  if (statoCandidatura === "completed") return recensito ? "concluso" : "da-recensire";
  if (statoCandidatura === "accepted" || statoCandidatura === "hired") {
    if (dataFine && giorniA(dataFine) < 0) return "finito";
    return statoCandidatura === "hired" ? "assunto" : "prova";
  }
  return null;
}

/**
 * «Quanto manca alla fine», per il worker: sempre, non solo nell'ultima
 * settimana come sul cartellino dell'employer — qui è l'informazione della
 * card, non un avviso.
 */
export function quantoManca(dataFine: string | null): string {
  if (!dataFine) return "Nessuna data di fine";
  const n = giorniA(dataFine);
  if (n < 0) return `Finito il ${formatData(dataFine)}`;
  if (n === 0) return "Finisce oggi";
  if (n === 1) return "Finisce domani";
  return `Finisce tra ${n} giorni`;
}

// ---------------------------------------------------------------------------
// IL FLUSSO DELL'ASSUNZIONE (21 ottobre) — vedi la migration
// `20261021120000_assunzione_cuore.sql` per le regole complete.
// ---------------------------------------------------------------------------

/** Giorni pieni concessi all'employer dopo la data di fine, prima della chiusura automatica. */
export const GIORNI_PER_DECIDERE = 5;

/**
 * Il giorno in cui un lavoro assunto si chiude da solo se l'employer non
 * sceglie: fine 10 → domanda l'11 → chiusura il 16. La chiusura vera la fa
 * il server (pg_cron, `chiudi_lavori_scaduti`): qui si calcola solo per dirlo.
 */
export function chiusuraAutomatica(dataFine: string): string {
  return aISO(new Date(daISO(dataFine).getTime() + (GIORNI_PER_DECIDERE + 1) * 86_400_000));
}

/** «si chiude da solo domani / il 16 ott» — per il promemoria. */
export function testoChiusuraAutomatica(dataFine: string): string {
  const quando = chiusuraAutomatica(dataFine);
  const n = giorniA(quando);
  if (n <= 0) return "Si chiude da solo oggi";
  if (n === 1) return "Se non scegli, si chiude da solo domani";
  return `Se non scegli, si chiude da solo il ${formatData(quando)}`;
}

/**
 * CONTROLLO TRIMESTRALE — solo per i lavori assunti SENZA data di fine.
 * Ogni 3 mesi dalla data di assunzione l'app chiede se il lavoro è ancora
 * attivo. Restituisce la scadenza del trimestre da confermare, o null se non
 * c'è niente da chiedere. Senza risposta NON si chiude mai da solo: un
 * lavoro può durare più di tre mesi (Tommaso).
 */
export function controlloDovuto(c: Pick<Cartellino, "stato" | "dataFine" | "assuntoIl" | "ultimoControllo">): string | null {
  if (c.stato !== "assunto" || c.dataFine || !c.assuntoIl) return null;
  const oggi = oggiISO();
  let ultimaScadenza: string | null = null;
  for (let mesi = 3; mesi < 1200; mesi += 3) {
    const d = daISO(c.assuntoIl);
    d.setMonth(d.getMonth() + mesi);
    const scadenza = aISO(d);
    if (scadenza > oggi) break;
    ultimaScadenza = scadenza;
  }
  if (!ultimaScadenza) return null;
  return c.ultimoControllo && c.ultimoControllo >= ultimaScadenza ? null : ultimaScadenza;
}

/** «Sì, è ancora attivo»: la domanda torna fra tre mesi. */
export async function confermaAncoraAttivo(id: string) {
  const { error } = await supabase.from("cartellini").update({ ultimo_controllo: oggiISO() }).eq("id", id);
  if (error) throw error;
}

/** La card del cuore, a lavoro concluso: true = cuore, false = salta. */
export async function segnaEsito(id: string, cuore: boolean) {
  const { error } = await supabase
    .from("cartellini")
    .update({ cuore, esito_il: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Chiede da conclusi: ha ancora la card del cuore da mostrare? */
export function cuoreDaChiedere(c: Pick<Cartellino, "stato" | "esitoIl">): boolean {
  return c.stato === "concluso" && !c.esitoIl;
}

/** Le candidature di un worker con il cuore — pubblico (funzione SQL `cuori_del_worker`). */
export async function cuoriDelWorker(workerId: string): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("cuori_del_worker", { p_worker: workerId });
  if (error) throw error;
  return new Set((data as string[] | null) ?? []);
}

export type TipoPromemoria = "scadenza" | "cuore" | "trimestrale";

/**
 * Cosa chiedere adesso, UNA cosa alla volta, in quest'ordine:
 *   1. SCADENZA — data di fine passata: estendi o concludi. Per gli assunti
 *      c'è il conto alla rovescia: dopo 5 giorni pieni si chiude da solo
 *      (lo fa il server, `chiudi_lavori_scaduti` via pg_cron).
 *   2. CUORE — lavoro concluso: «è stato soddisfacente?» ♥ o niente.
 *   3. TRIMESTRALE — senza data di fine, ogni 3 mesi dall'assunzione:
 *      «è ancora attivo?». Senza risposta non si chiude da solo.
 */
export function prossimoPromemoria(cartellini: Cartellino[], saltati: Set<string>) {
  const libero = (c: Cartellino, tipo: TipoPromemoria) => !saltati.has(`${tipo}:${c.id}`);
  const scaduto = cartellini.find((c) => eScaduto(c) && libero(c, "scadenza"));
  if (scaduto) return { tipo: "scadenza" as const, c: scaduto };
  const cuore = cartellini.find((c) => cuoreDaChiedere(c) && libero(c, "cuore"));
  if (cuore) return { tipo: "cuore" as const, c: cuore };
  const trimestrale = cartellini.find((c) => !!controlloDovuto(c) && libero(c, "trimestrale"));
  if (trimestrale) return { tipo: "trimestrale" as const, c: trimestrale };
  return null;
}

// ---------------------------------------------------------------------------
// I MODI DEI GIORNI (Tommaso, 21 ottobre) — senza colonne nuove:
//   fissi     → `giorni` con i giorni della settimana (o NULL: non ancora fissati)
//   variabili → `giorni` = [] (array VUOTO, diverso da NULL): turni variabili
//   uno       → data d'inizio = data di fine: un giorno solo
// ---------------------------------------------------------------------------

export type ModoGiorni = "fissi" | "variabili" | "uno";

export function modoGiorni(
  giorni: number[] | null,
  dataInizio: string | null,
  dataFine: string | null
): ModoGiorni {
  if (dataInizio && dataFine && dataInizio === dataFine) return "uno";
  if (Array.isArray(giorni) && giorni.length === 0) return "variabili";
  return "fissi";
}

