import { useSyncExternalStore } from "react";

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

/* ------------------------------------------------------------------ */
/* Una volta al giorno, e l'app sotto aspetta (15 novembre)            */
/* ------------------------------------------------------------------ */

/**
 * UNA VOLTA AL GIORNO. Tommaso (15 novembre): «te la mostra tutte le volte…
 * è un'attesa infinita». A ogni avvio a freddo (la sua richiesta del 9
 * ottobre) voleva dire: la schermata di Android con l'icona finché l'app non
 * è scaricata, poi 4,5 s di animazione, ogni volta. Ora l'animazione c'è alla
 * prima apertura della giornata; le altre aperte vanno dritte all'app.
 */
const CHIAVE_GIORNO = "politask.splash-visto-il";
const oggi = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
function giaVistoOggi(): boolean {
  try {
    return localStorage.getItem(CHIAVE_GIORNO) === oggi();
  } catch {
    return false;
  }
}
/** Da chiamare in un effetto, quando lo splash parte davvero. */
export function segnaSplashVisto() {
  try {
    localStorage.setItem(CHIAVE_GIORNO, oggi());
  } catch {
    /* niente storage: domani come oggi */
  }
}

/**
 * Lo splash si vede in questo caricamento? Deciso UNA volta per pagina (la
 * prima lettura), solo leggendo: StrictMode può chiamare due volte chi lo
 * legge (§12).
 */
let decisione: boolean | null = null;
export function splashDaMostrare(): boolean {
  if (decisione === null) decisione = !splashDaSaltare() && !giaVistoOggi();
  return decisione;
}

/**
 * L'APP SOTTO ASPETTA. Lo splash suona mentre l'app si avvia, sullo stesso
 * thread: misurato col processore rallentato come un telefono medio,
 * l'animazione restava ferma a schermo per 1050, 450 e 430 ms (Tommaso:
 * «scattosa»), quasi tutto per il montaggio delle pagine e della mappa.
 * L'app intanto è coperta: le pagine della barra (`layout/Schede`) si
 * montano quando il logo è COMPLETO, durante il mezzo secondo di logo fermo
 * e la dissolvenza. Sessione, profilo e dati partono lo stesso subito.
 * ⚠️ Provato e scartato prima: `lottie_worker` (l'animazione su un canvas in
 * un worker) — il disegno su canvas non sa fare la maschera del tentacolo,
 * e la «P» del logo spariva.
 */
let inCorso: boolean | null = null;
const ascoltatori = new Set<() => void>();
const leggiInCorso = () => (inCorso ??= splashDaMostrare());
export function fineSplash() {
  if (leggiInCorso() === false) return;
  inCorso = false;
  ascoltatori.forEach((f) => f());
}
export function useSplashInCorso(): boolean {
  return useSyncExternalStore(
    (f) => {
      ascoltatori.add(f);
      return () => ascoltatori.delete(f);
    },
    leggiInCorso,
    () => false
  );
}
