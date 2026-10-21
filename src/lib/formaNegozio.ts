import {
  aMano,
  generatore,
  lungoEllisse,
  lungoSegmento,
  PASSO_FINE,
  Punto,
  tracciato,
} from "./tratto";

/**
 * LA FORMA A NEGOZIO — le card della bacheca del worker.
 *
 * È la sagoma di `AnnunciIcon`, l'icona del negozio della barra in basso:
 * sopra la TENDA (bordo alto dritto con gli angoli arrotondati, bordo basso a
 * festoni che sporge oltre i lati), sotto il CORPO del negozio con gli angoli
 * in basso arrotondati. Solo contorno, niente strisce sulla tenda.
 *
 * Stesso tratto delle card employer (lib/tratto.ts): calcolato in pixel dalle
 * misure vere, irregolarità misurata sul disegno di Tommaso, seme dall'id.
 *
 * Due tracciati e non uno: il corpo si disegna PRIMA, chiuso, e la tenda gli
 * va sopra col suo riempimento — copre il lato alto del corpo e il pezzo dei
 * fianchi sopra i festoni, quindi i fianchi del negozio «escono» da sotto la
 * tenda come nell'icona, senza dover calcolare dove si incrociano.
 */

/** Quanto la tenda sporge oltre i lati del corpo. */
export const SPORGENZA = 4;
/** Raggio degli angoli alti della tenda. */
const RAGGIO_TENDA = 8;
/** Dove partono i festoni: altezza della parte dritta della tenda. */
const BASE_FESTONI = 20;
/** Profondità dei festoni sotto la base. */
const FESTONE = 12;
/** Il fondo dei festoni: 20 + 12 = 32 px dal bordo alto. */
export const FONDO_TENDA = BASE_FESTONI + FESTONE;
/** Il contenuto parte 11 px sotto il fondo dei festoni: la foto non li tocca. */
export const SPAZIO_SOPRA_NEGOZIO = FONDO_TENDA + 11;
/** Angoli in basso del corpo: come quelli del cartellino (18 px). */
const RAGGIO_BASSO = 18;
/** Un filo dentro il riquadro: mezzo tratto più l'irregolarità. */
const RIENTRO = 1.5;

export interface FormaNegozio {
  corpo: string;
  tenda: string;
}

export function formaNegozio(larghezza: number, altezza: number, seme: number): FormaNegozio {
  const caso = generatore(seme);
  const w = larghezza;
  const h = altezza;
  const m = RIENTRO;

  // ---- CORPO: rettangolo chiuso, il lato alto finisce sotto la tenda ----
  const r = RAGGIO_BASSO;
  const corpoIdeale: Punto[] = [
    ...lungoSegmento(m, BASE_FESTONI, w - m, BASE_FESTONI),
    ...lungoSegmento(w - m, BASE_FESTONI, w - m, h - m - r),
    ...lungoEllisse(w - m - r, h - m - r, r, r, 0, Math.PI / 2),
    ...lungoSegmento(w - m - r, h - m, m + r, h - m),
    ...lungoEllisse(m + r, h - m - r, r, r, Math.PI / 2, Math.PI),
    ...lungoSegmento(m, h - m - r, m, BASE_FESTONI),
  ];

  // ---- TENDA: più larga del corpo di SPORGENZA per lato ----
  const sx = m - SPORGENZA;
  const dx = w - m + SPORGENZA;
  const alto = m;
  const rt = RAGGIO_TENDA;
  // 4 festoni sulla larghezza normale, 3 se la card è stretta: sotto i ~38 px
  // l'uno un festone smette di leggere come arco e diventa un dente.
  const n = dx - sx >= 150 ? 4 : 3;
  const largo = (dx - sx) / n;

  const festoni: Punto[] = [];
  for (let k = 0; k < n; k++) {
    // Da destra a sinistra (giro orario), ogni festone è mezza ellisse verso il basso.
    const cx = dx - largo * (k + 0.5);
    festoni.push(...lungoEllisse(cx, BASE_FESTONI, largo / 2, FESTONE, 0, Math.PI));
  }

  const tendaIdeale: Punto[] = [
    ...lungoEllisse(sx + rt, alto + rt, rt, rt, Math.PI, (3 * Math.PI) / 2, PASSO_FINE),
    ...lungoSegmento(sx + rt, alto, dx - rt, alto),
    ...lungoEllisse(dx - rt, alto + rt, rt, rt, (3 * Math.PI) / 2, 2 * Math.PI, PASSO_FINE),
    ...lungoSegmento(dx, alto + rt, dx, BASE_FESTONI),
    ...festoni,
    ...lungoSegmento(sx, BASE_FESTONI, sx, alto + rt),
  ];

  return {
    corpo: tracciato(aMano(corpoIdeale, caso)),
    tenda: tracciato(aMano(tendaIdeale, caso)),
  };
}
