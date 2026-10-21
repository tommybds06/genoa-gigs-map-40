/**
 * IL TRATTO A MANO, CALCOLATO — condiviso da tutte le sagome della bacheca
 * (cartellino da pacco dell'employer, negozio del worker).
 *
 * L'irregolarità è quella del bordo disegnato da Tommaso, misurata su
 * `sagoma-card-a.svg`: un poligono con un vertice ogni ~5,5 px, ognuno
 * spostato di ±0,5 px (deviazione 0,33) rispetto alla linea ideale. Il rumore
 * è definito in PIXEL lungo il perimetro: una card più larga ha più vertici,
 * non vertici più distanti, quindi la grana non cambia con la misura. Il seme
 * viene dall'id: stesso disegno a ogni render.
 */

/** Il colore del filo: lo stesso delle card (`--paper-edge`, §6). */
export const TRATTO = "hsl(var(--paper-edge))";

export const PASSO = 5.5;
export const SCARTO = 0.5;
/** Sui cerchi e sugli archi piccoli il tratto è più fitto e più calmo. */
export const PASSO_FINE = 2;
export const SCARTO_FINE = 0.25;

/** Generatore pseudo-casuale con seme (mulberry32): stessa sequenza a ogni render. */
export function generatore(seme: number) {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function semeDa(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Un punto della linea ideale, con la normale verso l'esterno. */
export type Punto = { x: number; y: number; nx: number; ny: number };

/** Punti lungo un segmento (giro orario sullo schermo: normale = (dy, -dx)). */
export function lungoSegmento(x0: number, y0: number, x1: number, y1: number, passo = PASSO): Punto[] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy);
  const n = Math.max(1, Math.round(l / passo));
  const nx = dy / l;
  const ny = -dx / l;
  return Array.from({ length: n }, (_, k) => ({
    x: x0 + (dx * k) / n,
    y: y0 + (dy * k) / n,
    nx,
    ny,
  }));
}

/**
 * Punti lungo un arco di ellisse (un cerchio se rx = ry). Angoli in
 * radianti, crescenti = orario sullo schermo (y verso il basso).
 */
export function lungoEllisse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  passo = PASSO
): Punto[] {
  const lunghezza = (Math.abs(a1 - a0) * (rx + ry)) / 2;
  const n = Math.max(2, Math.round(lunghezza / passo));
  return Array.from({ length: n }, (_, k) => {
    const a = a0 + ((a1 - a0) * k) / n;
    const nx = Math.cos(a) / rx;
    const ny = Math.sin(a) / ry;
    const l = Math.hypot(nx, ny);
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), nx: nx / l, ny: ny / l };
  });
}

/** La linea ideale resa a mano: ogni vertice spostato lungo la sua normale. */
export function aMano(ideale: Punto[], caso: () => number, scarto = SCARTO): { x: number; y: number }[] {
  return ideale.map((p) => {
    const d = (caso() * 2 - 1) * scarto;
    return { x: p.x + p.nx * d, y: p.y + p.ny * d };
  });
}

export function tracciato(punti: { x: number; y: number }[], chiuso = true): string {
  return (
    punti.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("") +
    (chiuso ? "Z" : "")
  );
}

/** Un cerchio a mano (per il foro e l'anello del cartellino). */
export function cerchio(cx: number, cy: number, r: number, caso: () => number): string {
  const n = Math.max(16, Math.round((2 * Math.PI * r) / PASSO_FINE));
  const punti = Array.from({ length: n }, (_, k) => {
    const a = (2 * Math.PI * k) / n;
    const rr = r + (caso() * 2 - 1) * SCARTO_FINE;
    return { x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) };
  });
  return tracciato(punti);
}
