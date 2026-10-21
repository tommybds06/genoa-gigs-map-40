/** I dati della recensione di un lavoro (li usa ReviewPrompt). */
export interface PendingReview {
  applicationId: string;
  jobId: string;
  employerId: string;
  employerName: string;
  jobTitle: string;
}

/**
 * Apre la recensione per un lavoro PRECISO, a richiesta (dalla bacheca del
 * worker, card «Da recensire»). È la stessa finestra e la stessa logica di
 * invio del prompt automatico: niente seconda schermata di recensione da
 * tenere allineata. Ignora `skippedApplications`: chi l'aveva saltata
 * all'avvio la sta chiedendo adesso.
 */
export const EVENTO_RECENSIONE = "politask:recensisci";

export function apriRecensione(dettaglio: PendingReview) {
  window.dispatchEvent(new CustomEvent<PendingReview>(EVENTO_RECENSIONE, { detail: dettaglio }));
}
