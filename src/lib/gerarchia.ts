/**
 * LA GERARCHIA DEI COLORI DI RUOLO (esperimento del 23 ottobre, vedi
 * index.css «la gerarchia» e CLAUDE.md §5). L'interruttore è l'attributo
 * `data-gerarchia="scura"` su <html>, in index.html.
 *
 * Quasi tutto passa dalle variabili CSS e si gira da solo. Qui sta solo ciò
 * che è un FILE con il colore dentro: il logo. (I bordi dei campi attivi,
 * anche loro file, si girano nel CSS.)
 */
export const gerarchiaScura = () =>
  typeof document !== "undefined" && document.documentElement.dataset.gerarchia === "scura";

/** Il logo del ruolo, pastello o scuro secondo la gerarchia. */
export function srcLogo(employer: boolean): string {
  if (gerarchiaScura()) {
    return employer ? "/images/logo-employer-scuro-v1.svg" : "/images/logo-worker-scuro-v1.svg";
  }
  return employer ? "/images/logo-employer-v2.svg" : "/images/logo-worker-v2.svg";
}
