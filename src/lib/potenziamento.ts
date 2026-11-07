/**
 * IL POTENZIAMENTO (5 novembre) — sorgente unica di chi passa avanti, e
 * dell'ordine «normale» delle liste di annunci.
 *
 * Il principio (Tommaso): il potenziamento NON mostra mai a uno studente
 * annunci che non ha cercato; fa solo passare avanti l'annuncio tra quelli
 * già PERTINENTI per lui — il suo ruolo è tra quelli dello studente, e
 * corrisponde ai filtri attivi. Un potenziato che non c'entra resta dov'è.
 *
 * Dura quanto l'annuncio: un annuncio scaduto non compare in nessuna lista,
 * quindi non serve una scadenza a parte (48 ore, o 7 giorni con
 * l'allungamento: la decide il database).
 *
 * ⚠️ Import relativi con l'estensione: i test girano col solo Node
 * (`npm test`), che non conosce l'alias `@/`.
 */
import { isTypeTag } from "../constants/tags.ts";
import { CENTRO_QUARTIERE } from "../constants/quartieri.ts";

interface AnnuncioOrdinabile {
  id: string;
  tags: string[] | null;
  created_at: string;
  lat: number | null;
  lng: number | null;
  opzione?: string | null;
}

export function potenziato(a: { opzione?: string | null }): boolean {
  return a.opzione === "potenziamento" || a.opzione === "pacchetto";
}

/** I ruoli (non le durate) di un annuncio o di un profilo. */
const ruoli = (tags: string[] | null | undefined) => (tags ?? []).filter((t) => !isTypeTag(t));

/** Vero se l'annuncio ha almeno un ruolo tra quelli dello studente. */
export function ruoloInComune(annuncio: { tags: string[] | null }, tagsStudente: string[] | null | undefined): boolean {
  const miei = new Set(ruoli(tagsStudente));
  return miei.size > 0 && ruoli(annuncio.tags).some((t) => miei.has(t));
}

/** Distanza in metri (haversine): basta e avanza per una città. */
export function distanzaM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = 6371000;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

/** Passi di distanza: dentro lo stesso passo decide la data, se no due
 *  annunci a 900 e 950 m non si ordinerebbero mai per novità. */
const PASSO_M = 500;

/**
 * L'ORDINE NORMALE: distanza dalla zona dello studente (il quartiere del
 * profilo, non il GPS), a passi di 500 m, poi dal più recente. Senza zona
 * nota, solo dal più recente.
 */
export function confrontoNormale(quartiereStudente: string | null | undefined) {
  const centro = quartiereStudente ? CENTRO_QUARTIERE[quartiereStudente] : undefined;
  const passo = (a: AnnuncioOrdinabile) =>
    centro && a.lat != null && a.lng != null ? Math.floor(distanzaM(centro, { lat: a.lat, lng: a.lng }) / PASSO_M) : 0;
  return (a: AnnuncioOrdinabile, b: AnnuncioOrdinabile) =>
    passo(a) - passo(b) || Date.parse(b.created_at) - Date.parse(a.created_at);
}

export interface Pertinenza {
  /** I tag del profilo dello studente. Senza (employer, o niente interessi)
   *  nessun annuncio è pertinente, e nessuno passa avanti. */
  tagsStudente?: string[] | null;
  /** Il quartiere del profilo, per l'ordine normale. */
  quartiereStudente?: string | null;
  /** Gli annunci che corrispondono ai filtri o alla ricerca ATTIVI; assente
   *  = nessun filtro. Vanno avanti anche loro, dopo i potenziati. */
  corrispondenti?: Set<string>;
}

/**
 * L'ordine di una lista di annunci, a gruppi:
 *   1. potenziati PERTINENTI (ruolo dello studente + filtri attivi);
 *   2. quelli che corrispondono ai filtri attivi (se ce ne sono);
 *   3. tutti gli altri.
 * Dentro ogni gruppo, l'ordine normale.
 */
export function ordinaAnnunci<T extends AnnuncioOrdinabile>(annunci: T[], p: Pertinenza = {}): T[] {
  const filtri = p.corrispondenti && p.corrispondenti.size > 0 ? p.corrispondenti : null;
  const corrisponde = (a: T) => !filtri || filtri.has(a.id);
  const gruppo = (a: T) =>
    potenziato(a) && corrisponde(a) && ruoloInComune(a, p.tagsStudente) ? 0 : filtri && corrisponde(a) ? 1 : 2;
  const normale = confrontoNormale(p.quartiereStudente);
  return [...annunci].sort((a, b) => gruppo(a) - gruppo(b) || normale(a, b));
}

/** In una lista: è un annuncio da mostrare «In evidenza»? Solo se è
 *  potenziato E passa avanti per chi guarda. */
export function inEvidenza(a: AnnuncioOrdinabile, p: Pertinenza): boolean {
  const filtri = p.corrispondenti && p.corrispondenti.size > 0 ? p.corrispondenti : null;
  return potenziato(a) && (!filtri || filtri.has(a.id)) && ruoloInComune(a, p.tagsStudente);
}
