/**
 * LA FORMA DEL PIN — disegnata da Tommaso (`pinmappa2.svg`, 22 ottobre 2026;
 * la prima versione, `pinmappa.svg`, era più slanciata: 48×64 contro 48×59,5).
 *
 * Sostituisce il cerchio + triangolo CSS su TUTTI i pin dell'app (annuncio,
 * gruppo, selettore di posizione, minimappa): un simbolo è lo stesso ovunque.
 * Solo la forma: i colori restano quelli di ciascun pin.
 *
 * Il centro del «cerchio» in alto non si stima a occhio: è il centro del
 * cerchio più grande che sta dentro la forma, calcolato campionando il
 * tracciato — (224, 220) con raggio 219 sulla tavola 447×554. È lì che va
 * l'icona. La punta è in basso, al centro: l'aggancio `anchor="bottom"` dei
 * Marker resta giusto senza spostamenti.
 */

export const PIN_VIEWBOX = "0 0 446.75135 553.83594";

/** Altezza / larghezza della tavola: a 48 px di larghezza il pin è alto 59,5. */
export const PIN_PROPORZIONE = 553.83594 / 446.75135;

/** Centro del cerchio superiore, in percentuale della tavola. */
export const PIN_CENTRO = { x: (224 / 446.75135) * 100, y: (220 / 553.83594) * 100 };

export const PIN_TRACCIATO =
  "M225.75369,553.83578c-4.71055-.02927-12.76938-4.66567-23.05463-12.74869-.93502-.73482-1.88845-1.49812-2.85942-2.28904-37.86942-30.74066-65.29687-69.59622-97.29556-106.16615C43.11793,361.77764-6.02292,272.63843.59979,181.51363c.14718-1.39187.31533-2.76371.50501-4.1142.18968-1.3505.4009-2.67965.63421-3.98609,3.3637-18.83535,9.39497-36.77431,17.72446-53.47932.90024-.81457,1.40812-1.5705,1.96071-2.34149,21.69375-25.51816,35.40747-58.65967,66.44239-76.20698,1.3593-.9488,2.73077-1.8835,4.11415-2.80388,4.15011-2.76111,8.40745-5.39331,12.76545-7.89059,1.45272-.83245,2.91658-1.64989,4.3916-2.45227,23.49341-13.46848,49.11313-21.92705,75.43309-25.78381,1.645-.24105,3.29217-.46409,4.92696-.66854,21.61324,1.14869,42.18383-3.42255,62.75442-1.13693,87.99641,13.71373,186.27811,77.71111,193.38783,174.06913.15212,1.67858.28834,3.32838.40881,4.97779,7.1082,97.01464-40.54944,192.69827-105.80023,266.64917-5.71405,4.57124-6.85686,13.71373-12.57092,18.28497-19.42778,20.57059-36.56994,41.14118-58.05514,58.6456-1.28262,1.18024-2.49944,2.31487-3.70211,3.42349-17.88899,16.47735-32.6727,27.18267-40.1668,27.1361Z";

/**
 * Il pin come stringa SVG, per i marker creati a mano con `new mapboxgl.Marker`
 * (la minimappa), dove non c'è React. `colore` è un valore CSS qualsiasi.
 */
export function pinSvg(larghezza: number, colore: string): string {
  const altezza = Math.round(larghezza * PIN_PROPORZIONE);
  return `<svg width="${larghezza}" height="${altezza}" viewBox="${PIN_VIEWBOX}" style="position:absolute;inset:0;overflow:visible" aria-hidden="true"><path d="${PIN_TRACCIATO}" fill="${colore}"/></svg>`;
}
