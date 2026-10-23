/**
 * I LINK SOCIAL DEL PROFILO — sorgente unica (23 ottobre).
 *
 * Si scrivono in Onboarding e in Modifica profilo, si leggono in Profilo e
 * nel profilo pubblico. Prima ognuno faceva da sé: il profilo apriva
 * `instagram.com/` + il testo così com'era, quindi chi incollava il link
 * intero («https://instagram.com/mario») finiva su un indirizzo rotto.
 *
 * Nel database (`profiles.social_links`, jsonb) va la forma PULITA:
 *   instagram → solo il nome, senza @ né indirizzo («mario.rossi»)
 *   website   → indirizzo completo con https:// («https://barmario.it»)
 */

import type { SocialLinks } from "@/contexts/UserContext";

// Le regole di Instagram: lettere, numeri, punto e trattino basso, fino a 30.
const NOME_INSTAGRAM = /^[A-Za-z0-9._]{1,30}$/;

/** «@mario», «instagram.com/mario/», «https://www.instagram.com/mario?igsh=…» → «mario». */
export function pulisciInstagram(testo: string): string {
  return testo
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "");
}

/** «barmario.it» → «https://barmario.it». `null` se non è un indirizzo web. */
export function pulisciSito(testo: string): string | null {
  const t = testo.trim();
  const conSchema = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const url = new URL(conSchema);
    // Un dominio vero ha almeno un punto: «ciao» non è un sito.
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/**
 * Controlla e pulisce i due campi del modulo. Vuoto = nessun link (null),
 * non un errore: sono facoltativi.
 */
export function leggiSocial(instagram: string, sito: string) {
  const errori: { instagram?: string; website?: string } = {};
  const nome = pulisciInstagram(instagram);
  if (nome && !NOME_INSTAGRAM.test(nome)) {
    errori.instagram = "Nome Instagram non valido: solo lettere, numeri, punto e _";
  }
  const indirizzo = sito.trim() ? pulisciSito(sito) : null;
  if (sito.trim() && !indirizzo) {
    errori.website = "Indirizzo non valido (es. barmario.it)";
  }
  const valori: SocialLinks = { instagram: nome || null, website: indirizzo };
  return { valori, errori, valido: Object.keys(errori).length === 0 };
}

/** Per aprire il profilo. Regge anche i dati vecchi, salvati senza pulizia. */
export function linkInstagram(valore: string): string {
  return `https://instagram.com/${pulisciInstagram(valore)}`;
}

export function etichettaInstagram(valore: string): string {
  return `@${pulisciInstagram(valore)}`;
}

/** Il dominio al posto di un generico «Sito web»: dice DOVE porta il link. */
export function etichettaSito(valore: string): string {
  const url = pulisciSito(valore);
  return url ? new URL(url).hostname.replace(/^www\./, "") : valore;
}

export function linkSito(valore: string): string | null {
  return pulisciSito(valore);
}

/** C'è almeno un link da mostrare? Vuoti e indirizzi illeggibili non contano. */
export function haSocial(s: SocialLinks | null | undefined): s is SocialLinks {
  return !!s && (!!(s.instagram && pulisciInstagram(s.instagram)) || !!(s.website && pulisciSito(s.website)));
}
