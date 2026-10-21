import type { StatoLavoro } from "@/lib/bacheca";

/**
 * Il badge di stato di un lavoro, lato worker: sulla foto della card e nella
 * scheda. Regola degli stati (§5): pieno forte = attivo, pieno tenue = in
 * sospeso o concluso. «Da recensire» è l'unico che chiede di fare qualcosa,
 * quindi è il più forte: pieno nel colore del ruolo (inchiostro su arancio,
 * 6,45:1) — `pienoRuolo` è `theme.btnFilled`.
 */
export function badgeLavoro(stato: StatoLavoro, pienoRuolo: string): { testo: string; classe: string } {
  switch (stato) {
    case "prova":
      return { testo: "In prova", classe: "bg-warning-soft text-warning-soft-foreground" };
    case "assunto":
      return { testo: "Assunto", classe: "bg-success text-success-foreground" };
    case "finito":
      return { testo: "Finito", classe: "bg-paper-sunken text-ink" };
    case "da-recensire":
      return { testo: "Da recensire", classe: pienoRuolo };
    case "concluso":
      return { testo: "Concluso", classe: "bg-neutral-soft text-neutral-soft-foreground" };
  }
}
