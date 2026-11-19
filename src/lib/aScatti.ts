/**
 * LA REGOLA DEL MOVIMENTO (Tommaso, 19 novembre): «la carta va a scatti, il
 * dito va liscio». Gli oggetti di carta (scotch, puntine, cartellini,
 * post-it, timbri, Polaroid) si muovono come in stop motion: 12 pose al
 * secondo, ogni posa ferma, nessuna interpolazione (`steps(1, end)`). Ciò che
 * segue il dito (scorrimento, swipe, schede) resta fluido a 60.
 *
 * Qui le misure comuni, perché le animazioni nuove non ne inventino di loro.
 */

/** Un fotogramma a 12 al secondo. */
export const FOTOGRAMMA = 1000 / 12;

/** Chi ha chiesto meno movimento non vede niente di tutto questo. */
export const movimentoRidotto = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Le pose di un PENDOLO che si smorza, in gradi: spinto, rimbalza, si ferma.
 * Le stesse dello scotch (Foglietto), scalate con `ampiezza`.
 */
export const POSE_PENDOLO = [0, 2.4, -1.8, 1.1, -0.6, 0.25, 0];

/**
 * Fa dondolare un elemento sulle pose del pendolo. Anima la proprietà
 * `rotate`, separata da `transform`: si somma all'inclinazione che l'elemento
 * ha già. Il perno è il suo `transform-origin`.
 */
export function dondola(el: Element | null, { ampiezza = 1, verso = 1, ritardo = 0 } = {}) {
  if (!el || movimentoRidotto()) return;
  el.animate(
    POSE_PENDOLO.map((g) => ({ rotate: `${(g * ampiezza * verso).toFixed(2)}deg`, easing: "steps(1, end)" })),
    { duration: FOTOGRAMMA * POSE_PENDOLO.length, delay: ritardo }
  );
}
