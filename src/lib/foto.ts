/**
 * LE FOTO LEGGERE (3 novembre) — sorgente unica di come si caricano e si
 * mostrano le foto degli utenti.
 *
 * ⚠️ Prima andavano su Supabase così come uscivano dal telefono: 3–8 MB e 12+
 * megapixel. Un avatar da 44 px scaricava 4 MB e il telefono decodificava
 * 12 milioni di pixel (~48 MB di memoria, 50–200 ms di blocco) per mostrarne
 * 88 × 88. Erano i blocchi «ogni tanto» e i caricamenti lunghi su rete lenta.
 *
 * Due rimedi:
 * 1. In UPLOAD la foto si ridimensiona nel telefono, prima di partire
 *    (`ridimensionaFoto`): lato lungo 1600 px, JPEG → ~250 KB.
 * 2. In LETTURA si chiede a Supabase la misura che serve (`urlFoto`), con le
 *    sue trasformazioni (`/render/image/`). Vale anche per le foto caricate
 *    prima. ⚠️ Se una versione ridimensionata non arriva si prova
 *    l'originale, e se QUELLO arriva le trasformazioni si spengono per tutta
 *    la sessione (`spegniTrasformazioni`): lento come prima, mai rotto. Se
 *    non arriva nemmeno l'originale è la foto a mancare, non il servizio, e
 *    le altre foto restano leggere (verificato con una foto inesistente).
 */
import type { SyntheticEvent } from "react";

/** Lato lungo massimo di una foto caricata. 1600 basta alla galleria a tutto
 *  schermo (390 px × 3 di densità = 1170). */
export const LATO_UPLOAD = 1600;
const QUALITA_UPLOAD = 0.82;

/** Le misure in cui si chiedono le foto: poche, così la cache della CDN le
 *  riusa (una misura per avatar, una per miniature, una per le grandi). */
export const MISURA_FOTO = {
  /** Avatar fino a 128 px a densità 2. */
  avatar: 256,
  /** Card, cartellini, miniature della galleria. */
  miniatura: 480,
  /** Carosello, galleria a tutto schermo, allegati in chat. */
  grande: 1080,
} as const;

const MARCA_PUBBLICA = "/storage/v1/object/public/";

let trasformazioniSpente = false;

/**
 * La versione della foto alla misura `larghezza` (px reali). Gli indirizzi
 * che non sono dello storage di Supabase passano come sono.
 *
 * ⚠️ Mai la sola larghezza col ritaglio di serie (`cover`): Supabase
 * ritagliava una striscia centrale invece di ridurre la foto intera, e negli
 * avatar si vedeva solo la bocca (Tommaso, 3 novembre, video). Quindi:
 * - `quadrata` (avatar): 256 × 256 `cover`, cioè lo stesso ritaglio centrale
 *   che fa `object-cover` sul cerchio;
 * - le altre: `contain` sulla sola larghezza, che riduce e non ritaglia mai —
 *   il ritaglio lo fa `object-cover` nel contenitore, come prima.
 */
export function urlFoto(url: string | null | undefined, larghezza: number, quadrata = false): string | undefined {
  if (!url) return undefined;
  if (trasformazioniSpente || !url.includes(MARCA_PUBBLICA)) return url;
  const [base] = url.split("?");
  const misura = quadrata ? `width=${larghezza}&height=${larghezza}&resize=cover` : `width=${larghezza}&resize=contain`;
  return `${base.replace(MARCA_PUBBLICA, "/storage/v1/render/image/public/")}?${misura}&quality=75`;
}

/** Vero se `src` è una versione ridimensionata (cioè se un errore va
 *  ritentato con l'originale). */
export function eRidimensionata(src: string | undefined): boolean {
  return !!src && src.includes("/storage/v1/render/image/");
}

export function spegniTrasformazioni() {
  if (!trasformazioniSpente) console.warn("[Politask] trasformazioni delle foto non disponibili: uso gli originali");
  trasformazioniSpente = true;
}

export function trasformazioniAttive() {
  return !trasformazioniSpente;
}

/**
 * Per un `<img>`: se la versione ridimensionata non arriva, rimette
 * l'originale; se l'originale si carica, spegne le trasformazioni.
 *   <img src={urlFoto(u, MISURA_FOTO.miniatura)} onError={ripiegaFoto(u)} />
 */
export function ripiegaFoto(originale: string | null | undefined) {
  return (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!originale || !eRidimensionata(img.src)) return;
    img.addEventListener("load", spegniTrasformazioni, { once: true });
    img.src = originale;
  };
}

/**
 * La foto pronta per l'upload: al massimo `LATO_UPLOAD` di lato, JPEG,
 * ruotata come la vede l'utente (EXIF). Se qualcosa va storto (formato che il
 * browser non sa leggere, HEIC su Chrome…) torna il file com'era: meglio una
 * foto pesante che una foto persa.
 */
export async function ridimensionaFoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || /gif|svg/.test(file.type)) return file;
  let immagine: ImageBitmap;
  try {
    immagine = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  try {
    const scala = Math.min(1, LATO_UPLOAD / Math.max(immagine.width, immagine.height));
    // Già piccola e già JPEG: non c'è niente da guadagnare.
    if (scala === 1 && file.type === "image/jpeg" && file.size < 600_000) return file;
    const larghezza = Math.round(immagine.width * scala);
    const altezza = Math.round(immagine.height * scala);
    const tela = document.createElement("canvas");
    tela.width = larghezza;
    tela.height = altezza;
    const ctx = tela.getContext("2d");
    if (!ctx) return file;
    // Il JPEG non ha trasparenza: un PNG trasparente diventerebbe nero.
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, larghezza, altezza);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(immagine, 0, 0, larghezza, altezza);
    const blob = await new Promise<Blob | null>((r) => tela.toBlob(r, "image/jpeg", QUALITA_UPLOAD));
    if (!blob || blob.size >= file.size) return file;
    const nome = file.name.replace(/\.[^.]*$/, "") + ".jpg";
    return new File([blob], nome, { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    immagine.close();
  }
}

/** Il limite sul file DOPO il ridimensionamento: ormai lo supera solo
 *  qualcosa che il browser non ha saputo ridimensionare. */
export const MAX_BYTE_FOTO = 5 * 1024 * 1024;
