/**
 * I NUMERI DEI PREZZI DELLE OPZIONI A PAGAMENTO (5 novembre).
 *
 * Si cambiano QUI, senza toccare il codice: il calcolo sta in
 * `lib/prezzi.ts` (`calcolaPrezzi`), i test in `lib/prezzi.test.ts`.
 * ⚠️ Cambiando k, esponente, minimo o massimo, i casi dei test vanno
 * ricalcolati: sono scritti su questi valori.
 *
 *   potenziamento = k × valore^esponente, tra minimo e massimo (€)
 *   allungamento  = potenziamento × quotaAllungamento
 *   pacchetto     = (potenziamento + allungamento) × (1 − scontoPacchetto)
 */
export const PREZZI = {
  k: 0.25,
  esponente: 0.59,
  /** Prezzo minimo del potenziamento, in euro. */
  minimo: 1.5,
  /** Prezzo massimo del potenziamento, in euro. */
  massimo: 15.0,
  /** L'allungamento costa questa frazione del potenziamento. */
  quotaAllungamento: 0.6,
  /** Sconto del pacchetto sulla somma dei due (0,2 = 20%). */
  scontoPacchetto: 0.2,
  /** Oltre queste settimane il valore di un lavoro non cresce più. */
  settimaneMassime: 4,
  /**
   * false = fase di prova: le opzioni si applicano senza pagare e le card
   * dicono «Gratis durante la fase di prova».
   * ⚠️ Va tenuto insieme alla funzione `prova_gratuita()` del database
   * (migration 20261105120000_opzioni_annuncio.sql): è lei che decide
   * davvero se l'allungamento si applica gratis.
   */
  pagamentiAttivi: false,
} as const;
