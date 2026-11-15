/**
 * GLI ALLEGATI DELLA CHAT (12 novembre 2026): foto, documenti PDF e, dal 15
 * novembre, VOCALI.
 *
 * Decisione di Tommaso: oltre alle foto SOLO PDF (il caso vero è il CV), fino
 * a 10 MB. «Qualunque file» fra due persone che non si conoscono è il modo
 * più semplice di farsi mandare qualcosa di dannoso.
 *
 * ⚠️ NESSUNA COLONNA NUOVA. Nel database un allegato è solo il suo percorso
 * (`messages.attachment_url` = `<chat>/<utente>/<file>`):
 * - il TIPO si legge dall'estensione (`.pdf` → documento, il resto → foto);
 * - il NOME da mostrare sta nel nome del file, dopo l'ora di caricamento
 *   (`1731400000000-Curriculum-Sara.pdf` → «Curriculum-Sara.pdf»);
 * - un messaggio fatto solo dell'allegato ha come testo un SEGNAPOSTO, come
 *   già le foto («📷 Foto»): per i documenti «📄 nome.pdf». Così chi legge
 *   la notifica o l'anteprima in lista sa cos'è arrivato, senza toccare il
 *   trigger delle notifiche.
 *
 * VOCALI: anche qui nessuna colonna. Il nome del file porta la DURATA e la
 * FORMA D'ONDA (40 cifre da 0 a 9): `1731400000000-vocale-12s-0135….m4a`.
 * Così la bolla si disegna subito, senza scaricare l'audio per misurarlo
 * (e un WebM registrato da Chrome non dichiara nemmeno la sua durata).
 * Il segnaposto è «🎤 Vocale».
 *
 * Senza import: lo esegue anche `npm test` (Node non conosce l'alias `@/`).
 */
export const MAX_BYTE_DOCUMENTO = 10 * 1024 * 1024;
export const SEGNAPOSTO_FOTO = "📷 Foto";
export const PREFISSO_DOCUMENTO = "📄 ";
export const SEGNAPOSTO_VOCALE = "🎤 Vocale";
export const MAX_SECONDI_VOCALE = 180;
export const MIN_SECONDI_VOCALE = 1;
/** Quante barre ha la forma d'onda di un vocale. */
export const BARRE_VOCALE = 40;

export type TipoAllegato = "foto" | "documento" | "vocale";

const ESTENSIONI_VOCALE = /\.(m4a|mp4|aac|webm|weba|ogg|oga|mp3)(\?|$)/i;

export const tipoAllegato = (percorso: string | null | undefined): TipoAllegato | null =>
  !percorso
    ? null
    : /\.pdf(\?|$)/i.test(percorso)
      ? "documento"
      : ESTENSIONI_VOCALE.test(percorso)
        ? "vocale"
        : "foto";

/** Solo PDF: dal tipo dichiarato o, se il telefono non lo dice, dal nome. */
export const ePdf = (file: { type: string; name: string }) =>
  file.type === "application/pdf" || (!file.type && /\.pdf$/i.test(file.name));

/**
 * Il nome di un file reso adatto a un percorso: lettere, numeri, punto,
 * trattino. Gli accenti si tolgono («Caffè» → «Caffe»), il resto diventa un
 * trattino; al massimo 60 caratteri prima dell'estensione.
 */
export function nomePulito(nome: string): string {
  const senzaEstensione = nome.replace(/\.pdf$/i, "");
  const pulito = senzaEstensione
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 60);
  return `${pulito || "documento"}.pdf`;
}

/** Dove va un documento: `<chat>/<utente>/<ora>-<nome>.pdf`. */
export const percorsoDocumento = (chatId: string, utenteId: string, nome: string, adesso: number = Date.now()) =>
  `${chatId}/${utenteId}/${adesso}-${nomePulito(nome)}`;

/** Il nome da mostrare, dal percorso: senza cartelle e senza l'ora davanti. */
export function nomeAllegato(percorso: string): string {
  const file = percorso.split("?")[0].split("/").pop() ?? "";
  return file.replace(/^\d{10,}-/, "") || "Documento.pdf";
}

/** Il testo di un messaggio fatto solo dell'allegato. */
export const segnapostoAllegato = (percorso: string) => {
  const tipo = tipoAllegato(percorso);
  return tipo === "documento"
    ? `${PREFISSO_DOCUMENTO}${nomeAllegato(percorso)}`
    : tipo === "vocale"
      ? SEGNAPOSTO_VOCALE
      : SEGNAPOSTO_FOTO;
};

/** Vero se il testo è solo il segnaposto di un allegato (non lo ha scritto nessuno). */
export const eSegnaposto = (testo: string | null | undefined) =>
  !!testo && (testo === SEGNAPOSTO_FOTO || testo === SEGNAPOSTO_VOCALE || testo.startsWith(PREFISSO_DOCUMENTO));

/* ------------------------------------------------------------------ */
/* Vocali                                                              */
/* ------------------------------------------------------------------ */

/**
 * Da tanti livelli (0..1, uno ogni ~100 ms) a `BARRE_VOCALE` cifre 0–9: si
 * prende il massimo di ogni tratto e si normalizza sul più forte, così anche
 * chi parla piano ha una forma d'onda leggibile. Il silenzio resta basso.
 */
export function riduciPicchi(livelli: number[], barre: number = BARRE_VOCALE): number[] {
  if (livelli.length === 0) return Array(barre).fill(0);
  const tratti = Array.from({ length: barre }, (_, i) => {
    const da = Math.floor((i * livelli.length) / barre);
    const a = Math.max(da + 1, Math.floor(((i + 1) * livelli.length) / barre));
    return Math.max(...livelli.slice(da, a));
  });
  const massimo = Math.max(...tratti);
  if (massimo < 0.01) return Array(barre).fill(0);
  return tratti.map((v) => Math.min(9, Math.round((v / massimo) * 9)));
}

/** Dove va un vocale: `<chat>/<utente>/<ora>-vocale-<secondi>s-<picchi>.<est>`. */
export const percorsoVocale = (
  chatId: string,
  utenteId: string,
  secondi: number,
  picchi: number[],
  estensione: string,
  adesso: number = Date.now()
) => `${chatId}/${utenteId}/${adesso}-vocale-${Math.max(0, Math.round(secondi))}s-${picchi.join("")}.${estensione}`;

/** Durata e forma d'onda di un vocale, dal suo percorso. */
export function leggiVocale(percorso: string | null | undefined): { secondi: number; picchi: number[] } {
  const m = /-vocale-(\d+)s-(\d*)\./.exec((percorso ?? "").split("?")[0]);
  if (!m) return { secondi: 0, picchi: Array(BARRE_VOCALE).fill(2) };
  const picchi = m[2].split("").map(Number);
  return { secondi: Number(m[1]), picchi: picchi.length ? picchi : Array(BARRE_VOCALE).fill(2) };
}

/** 0:07, 1:30. */
export const durataVocale = (secondi: number) => {
  const s = Math.max(0, Math.floor(secondi));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** L'estensione del file per il tipo che il registratore ha scelto. */
export const estensioneVocale = (tipo: string) => (/mp4|aac/i.test(tipo) ? "m4a" : /ogg/i.test(tipo) ? "ogg" : "webm");

/**
 * Un messaggio in una riga: per la citazione di una risposta e per
 * l'anteprima in lista. Il testo se c'è; se no «Foto» o «Documento».
 */
export function etichettaMessaggio(m: { content: string | null; attachment_url?: string | null }): string {
  const testo = (m.content ?? "").trim();
  if (testo.startsWith(PREFISSO_DOCUMENTO)) return "Documento";
  if (testo === SEGNAPOSTO_FOTO) return "Foto";
  if (testo === SEGNAPOSTO_VOCALE) return "Vocale";
  if (testo) return testo;
  const tipo = tipoAllegato(m.attachment_url);
  return tipo === "documento" ? "Documento" : tipo === "foto" ? "Foto" : tipo === "vocale" ? "Vocale" : "";
}
