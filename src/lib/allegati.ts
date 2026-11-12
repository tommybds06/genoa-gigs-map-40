/**
 * GLI ALLEGATI DELLA CHAT (12 novembre 2026): foto e, da oggi, documenti PDF.
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
 * Senza import: lo esegue anche `npm test` (Node non conosce l'alias `@/`).
 */
export const MAX_BYTE_DOCUMENTO = 10 * 1024 * 1024;
export const SEGNAPOSTO_FOTO = "📷 Foto";
export const PREFISSO_DOCUMENTO = "📄 ";

export type TipoAllegato = "foto" | "documento";

export const tipoAllegato = (percorso: string | null | undefined): TipoAllegato | null =>
  !percorso ? null : /\.pdf(\?|$)/i.test(percorso) ? "documento" : "foto";

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
export const segnapostoAllegato = (percorso: string) =>
  tipoAllegato(percorso) === "documento" ? `${PREFISSO_DOCUMENTO}${nomeAllegato(percorso)}` : SEGNAPOSTO_FOTO;

/** Vero se il testo è solo il segnaposto di un allegato (non lo ha scritto nessuno). */
export const eSegnaposto = (testo: string | null | undefined) =>
  !!testo && (testo === SEGNAPOSTO_FOTO || testo.startsWith(PREFISSO_DOCUMENTO));

/**
 * Un messaggio in una riga: per la citazione di una risposta e per
 * l'anteprima in lista. Il testo se c'è; se no «Foto» o «Documento».
 */
export function etichettaMessaggio(m: { content: string | null; attachment_url?: string | null }): string {
  const testo = (m.content ?? "").trim();
  if (testo.startsWith(PREFISSO_DOCUMENTO)) return "Documento";
  if (testo === SEGNAPOSTO_FOTO) return "Foto";
  if (testo) return testo;
  const tipo = tipoAllegato(m.attachment_url);
  return tipo === "documento" ? "Documento" : tipo === "foto" ? "Foto" : "";
}
