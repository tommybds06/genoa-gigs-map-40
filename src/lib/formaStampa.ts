import { aMano, generatore, lungoEllisse, lungoSegmento, semeDa, tracciato } from "@/lib/tratto";

/**
 * LA FOTO STAMPATA — il contorno della cornice di carta (stile Polaroid),
 * col tratto a mano delle card (`lib/tratto.ts`): un rettangolo arrotondato
 * calcolato sulle misure vere, come la bolla della chat e il cartellino.
 *
 * Niente ritaglio a 9 sezioni: gli angoli delle card (28 px) su una foto da
 * ~110 px taglierebbero la foto stessa, che sta a 5 px dal bordo. Qui il
 * raggio lo sceglie chi usa la forma (piccolo sulle miniature, più ampio
 * sulle foto grandi).
 */

/** Il tremolio sta dentro il riquadro, così il filo non esce dall'SVG. */
const RIENTRO = 0.6;

export function formaStampa(w: number, h: number, seme: string, raggio: number): string {
  const caso = generatore(semeDa(seme));
  const s = RIENTRO;
  const r = Math.min(raggio, (h - 2 * s) / 2, (w - 2 * s) / 2);
  const x0 = s, y0 = s, x1 = w - s, y1 = h - s;
  // Giro orario dall'angolo in alto a sinistra (normali verso l'esterno).
  const ideale = [
    ...lungoSegmento(x0 + r, y0, x1 - r, y0),
    ...lungoEllisse(x1 - r, y0 + r, r, r, -Math.PI / 2, 0),
    ...lungoSegmento(x1, y0 + r, x1, y1 - r),
    ...lungoEllisse(x1 - r, y1 - r, r, r, 0, Math.PI / 2),
    ...lungoSegmento(x1 - r, y1, x0 + r, y1),
    ...lungoEllisse(x0 + r, y1 - r, r, r, Math.PI / 2, Math.PI),
    ...lungoSegmento(x0, y1 - r, x0, y0 + r),
    ...lungoEllisse(x0 + r, y0 + r, r, r, Math.PI, Math.PI * 1.5),
  ];
  return tracciato(aMano(ideale, caso));
}
