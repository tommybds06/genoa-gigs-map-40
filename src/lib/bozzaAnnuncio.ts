import type { Durata, TipoPaga } from "./prezzi.ts";

/**
 * LA BOZZA DELL'ANNUNCIO tra il form (`CreateJob`) e la pagina delle
 * opzioni (`OpzioniAnnuncio`), 5 novembre.
 *
 * Sono due rotte, e cambiando rotta il form si smonta: tornando indietro
 * dalla pagina delle opzioni per correggere qualcosa, senza la bozza
 * sarebbe vuoto. Variabile del modulo, come la vista ricordata della mappa
 * (non `window` né `localStorage`, §2 lezione 8): vive finché l'app è
 * aperta, e dopo la pubblicazione si cancella.
 */
export interface BozzaAnnuncio {
  title: string;
  description: string;
  schedule: string;
  /** Il tag di durata così com'è nell'app («Una tantum», «Mesi»…). */
  tagDurata: string;
  durata: Durata;
  /** Il ruolo: predefinito o scritto a mano. */
  ruolo: string;
  ruoloPersonalizzato: boolean;
  pagaTipo: TipoPaga;
  pagaImporto: number;
  pagaLorda: boolean;
  oreTotali: number | null;
  oreGiorno: number | null;
  giorni: number | null;
  oreSettimana: number | null;
  settimane: number | null;
}

let bozza: BozzaAnnuncio | null = null;

export const leggiBozza = () => bozza;
export const salvaBozza = (b: BozzaAnnuncio) => {
  bozza = b;
};
export const cancellaBozza = () => {
  bozza = null;
};
