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
/* A OGNI APERTURA (di nuovo, dal 19 novembre)                         */
/* ------------------------------------------------------------------ */

/*
 * Dal 15 al 19 novembre lo splash si vedeva una volta al giorno
 * (`politask.splash-visto-il` in localStorage). Tommaso, 19 novembre:
 * «rimetti l'animazione del logo ad ogni entrata». Resta quello che di quel
 * giro serviva davvero: l'app sotto ASPETTA il logo (qui sotto), così
 * l'animazione non scatta per il lavoro dell'avvio. La chiave vecchia può
 * restare nel localStorage di chi l'ha già: nessuno la legge più.
 */

/**
 * Lo splash si vede in questo caricamento? Deciso UNA volta per pagina (la
 * prima lettura), solo leggendo: StrictMode può chiamare due volte chi lo
 * legge (§12).
 */
let decisione: boolean | null = null;
export function splashDaMostrare(): boolean {
  if (decisione === null) decisione = !splashDaSaltare();
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
