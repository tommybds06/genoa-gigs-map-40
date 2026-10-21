import { aMano, cerchio, generatore, lungoEllisse, lungoSegmento, Punto, tracciato } from "./tratto";

export { semeDa } from "./tratto";

/**
 * LA FORMA DEL CARTELLINO DA PACCO — calcolata in pixel, non stirata.
 *
 * Angoli in alto smussati in diagonale, angoli in basso arrotondati, un foro
 * rotondo in alto al centro con l'anello di rinforzo intorno.
 *
 * ⚠️ Perché non un SVG disegnato col ritaglio a 9 sezioni, come le card: il 9
 * sezioni tiene fissi solo i quattro angoli e stira le bande, quindi un foro
 * al CENTRO del lato alto verrebbe stirato con la banda (diventa un ovale), e
 * un tratteggio sui lati lunghi sparisce (§12). Qui il tracciato si calcola
 * dalle misure vere della card, a ogni ridimensionamento.
 *
 * L'IRREGOLARITÀ è la stessa del bordo disegnato da Tommaso, misurata sul file
 * `sagoma-card-a.svg`: un poligono con un vertice ogni ~5,5 px, ognuno spostato
 * di ±0,5 px (deviazione 0,33) rispetto alla linea ideale. Il rumore è
 * definito in PIXEL lungo il perimetro, quindi una card più larga ha più
 * vertici, non vertici più distanti: la grana del tratto non cambia con la
 * misura. Il seme viene dall'id del cartellino: stesso disegno a ogni render.
 */

/** Smusso degli angoli in alto, uguale in orizzontale e in verticale. */
export const SMUSSO = 26;
/** Raggio degli angoli in basso: quello del disegno attuale (~18 px). */
export const RAGGIO_BASSO = 18;
/** Centro del foro, dal bordo superiore. */
export const FORO_Y = 22;
export const FORO_R = 6;
/** Anello di rinforzo: diametro esterno 26 px. */
export const ANELLO_R = 13;
/** Il contenuto parte sotto l'anello (che finisce a 22 + 13 = 35 px). */
export const SPAZIO_SOPRA = 44;

/** Il contorno sta un filo dentro il riquadro: mezzo tratto più l'irregolarità. */
const RIENTRO = 1.5;

export interface FormaCartellino {
  /** Il profilo esterno, da riempire e da ripassare col tratto. */
  contorno: string;
  /** Il cerchio del foro: va unito ai riempimenti con `fill-rule: evenodd`. */
  foro: string;
  /** Il bordo esterno dell'anello di rinforzo. */
  anello: string;
  cx: number;
}

export function formaCartellino(larghezza: number, altezza: number, seme: number): FormaCartellino {
  const caso = generatore(seme);
  const m = RIENTRO;
  const w = larghezza;
  const h = altezza;
  const s = SMUSSO;
  const r = RAGGIO_BASSO;

  const ideale: Punto[] = [
    ...lungoSegmento(m + s, m, w - m - s, m), // lato alto
    ...lungoSegmento(w - m - s, m, w - m, m + s), // smusso destro
    ...lungoSegmento(w - m, m + s, w - m, h - m - r), // lato destro
    ...lungoEllisse(w - m - r, h - m - r, r, r, 0, Math.PI / 2), // angolo basso destro
    ...lungoSegmento(w - m - r, h - m, m + r, h - m), // lato basso
    ...lungoEllisse(m + r, h - m - r, r, r, Math.PI / 2, Math.PI), // angolo basso sinistro
    ...lungoSegmento(m, h - m - r, m, m + s), // lato sinistro
    ...lungoSegmento(m, m + s, m + s, m), // smusso sinistro
  ];

  const contorno = tracciato(aMano(ideale, caso));

  const cx = w / 2;
  return {
    contorno,
    foro: cerchio(cx, FORO_Y, FORO_R, caso),
    anello: cerchio(cx, FORO_Y, ANELLO_R, caso),
    cx,
  };
}
