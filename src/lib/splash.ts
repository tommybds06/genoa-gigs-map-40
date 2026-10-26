/**
 * LO SPLASH SOLO ALL'APERTURA (Tommaso, 26 ottobre): «è solo all'ingresso
 * dell'app quando la apri». Ma alcuni passaggi della registrazione
 * RICARICANO la pagina (Auth → /onboarding, Onboarding → /, il ritorno da
 * Google e Apple), e per lo splash ogni caricamento è un'apertura.
 *
 * Prima di quei ricaricamenti si chiama `saltaProssimoSplash()`: un segno in
 * `sessionStorage`, che vive nella scheda e sopravvive al ricaricamento. Lo
 * splash lo legge al caricamento dopo, lo cancella e non parte. Un'apertura
 * vera (scheda nuova, app riaperta) non lo trova.
 *
 * Preferenza dell'utente, non dato: se lo storage non c'è (navigazione
 * privata), si torna al comportamento di prima — mai un errore.
 */
const CHIAVE = "politask.salta-splash";

export function saltaProssimoSplash() {
  try {
    sessionStorage.setItem(CHIAVE, "1");
  } catch {
    /* niente storage: lo splash partirà, come prima */
  }
}

/** Solo lettura: si può chiamare in un inizializzatore di useState. */
export function splashDaSaltare(): boolean {
  try {
    return sessionStorage.getItem(CHIAVE) === "1";
  } catch {
    return false;
  }
}

/** Il segno vale UNA volta: lo si cancella dopo averlo letto (in un effetto). */
export function consumaSaltoSplash() {
  try {
    sessionStorage.removeItem(CHIAVE);
  } catch {
    /* niente */
  }
}
