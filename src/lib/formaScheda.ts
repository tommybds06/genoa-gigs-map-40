import { PASSO_FINE, SCARTO_FINE, aMano, generatore, lungoEllisse, lungoSegmento, tracciato } from "@/lib/tratto";

/**
 * LA SAGOMA DELLE SCHEDE CHE SALGONO DAL BASSO (ogni `DrawerContent`).
 *
 * Il bordo in alto e gli angoli hanno lo stesso tratto a mano delle card
 * (`lib/tratto.ts`); al posto della maniglia grigia c'è una FESSURA tagliata
 * nella carta, come la presa di una scatola di cartone: è vuota davvero
 * (`evenodd`), e da lì si vede quello che c'è sotto — la mappa, all'aggancio
 * basso della scheda annuncio.
 *
 * Il fondo e i lati sono fuori schermo o sul bordo dello schermo: lì il
 * riempimento è dritto, e il filo segue solo i lati e la testa.
 */

/** Raggio degli angoli in alto: lo stesso degli angoli in basso dei cartellini. */
export const RAGGIO_SCHEDA = 18;

/** La fessura: centro a 18 px dal bordo, 56×12 — larga quanto un pollice. */
export const FESSURA = { centroY: 18, larghezza: 56, altezza: 12 } as const;

/** Lo spazio che la fessura occupa in testa: il contenuto parte da qui. */
export const TESTA_SCHEDA = 28;

const SEME = 0x5c4ed4;

export function formaScheda(w: number, h: number) {
  const caso = generatore(SEME);
  const r = RAGGIO_SCHEDA;
  // ½ filo dentro il bordo, così il tratto dei lati non esce dallo schermo.
  const s = 0.6;

  const lati = [
    ...lungoSegmento(s, h, s, r),
    ...lungoEllisse(r, r, r - s, r - s, Math.PI, Math.PI * 1.5),
    ...lungoSegmento(r, s, w - r, s),
    ...lungoEllisse(w - r, r, r - s, r - s, -Math.PI / 2, 0),
    ...lungoSegmento(w - s, r, w - s, h),
  ];
  const punti = aMano(lati, caso);
  // Ultimo punto: il fondo a destra, dritto.
  punti.push({ x: w - s, y: h });

  const { centroY: cy, larghezza, altezza } = FESSURA;
  const rr = altezza / 2;
  const x0 = w / 2 - larghezza / 2 + rr;
  const x1 = w / 2 + larghezza / 2 - rr;
  const fessura = tracciato(
    aMano(
      [
        ...lungoSegmento(x0, cy - rr, x1, cy - rr, PASSO_FINE),
        ...lungoEllisse(x1, cy, rr, rr, -Math.PI / 2, Math.PI / 2, PASSO_FINE),
        ...lungoSegmento(x1, cy + rr, x0, cy + rr, PASSO_FINE),
        ...lungoEllisse(x0, cy, rr, rr, Math.PI / 2, Math.PI * 1.5, PASSO_FINE),
      ],
      caso,
      SCARTO_FINE
    )
  );

  // ⚠️ Il tremolio sposta i lati fino a 1,1 px DENTRO lo schermo, e da quel
  // filo si vedeva la mappa (provato a 390 px). Sotto gli angoli il
  // riempimento si allarga a coprire il bordo dello schermo; il filo resta
  // quello a mano.
  const fasce = `M-2 ${r}H${s + 1}V${h}H-2Z` + `M${w - s - 1} ${r}H${w + 2}V${h}H${w - s - 1}Z`;

  return {
    /** Riempimento: chiuso sul fondo. Con la fessura, va in `evenodd`. */
    carta: tracciato(punti),
    /** Le due fasce sui lati, da riempire a parte (non in `evenodd`). */
    fasce,
    /** Il filo: lati e testa, aperto sul fondo. */
    bordo: tracciato(punti.slice(0, -1), false),
    fessura,
  };
}
