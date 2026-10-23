import { aMano, generatore, lungoEllisse, lungoSegmento, semeDa, tracciato } from "@/lib/tratto";

/**
 * LA BOLLA DELLA CHAT — un rettangolo arrotondato col tratto a mano delle card
 * (`lib/tratto.ts`), applicato come RITAGLIO (`clip-path`), senza linea sopra:
 * è un oggetto pieno, e per i pieni vale «la forma sì, il filo no» (§6).
 *
 * Le bolle erano l'unico elemento della chat «fatto col CSS» (Tommaso, 22
 * ottobre: «poco caratteristica»). Sono di misura variabile, quindi niente
 * ritaglio a 9 sezioni: il tracciato si calcola sulle misure vere, come la
 * scheda e il cartellino.
 *
 * Gli angoli: 18 px (meno se la bolla è bassa), e quello dal LATO DI CHI
 * PARLA piccolo (5 px) per dire di chi è il messaggio — in basso sull'ultima
 * bolla di un gruppo, anche in alto su quelle dopo la prima, così un gruppo
 * si legge come un blocco solo.
 */

const RAGGIO = 18;
const RAGGIO_PICCOLO = 5;
/** Tutto il tremolio sta DENTRO il riquadro: il ritaglio non può uscirne. */
const RIENTRO = 0.6;

export interface AngoliBolla {
  /** alto-sinistra, alto-destra, basso-destra, basso-sinistra: true = piccolo */
  piccoli: [boolean, boolean, boolean, boolean];
}

export function formaBolla(w: number, h: number, seme: string, { piccoli }: AngoliBolla): string {
  const caso = generatore(semeDa(seme));
  const s = RIENTRO;
  const grande = Math.min(RAGGIO, (h - 2 * s) / 2, (w - 2 * s) / 2);
  const [tl, tr, br, bl] = piccoli.map((p) => (p ? Math.min(RAGGIO_PICCOLO, grande) : grande));
  const x0 = s, y0 = s, x1 = w - s, y1 = h - s;

  // Giro orario dall'angolo in alto a sinistra (normali verso l'esterno).
  const ideale = [
    ...lungoSegmento(x0 + tl, y0, x1 - tr, y0),
    ...lungoEllisse(x1 - tr, y0 + tr, tr, tr, -Math.PI / 2, 0),
    ...lungoSegmento(x1, y0 + tr, x1, y1 - br),
    ...lungoEllisse(x1 - br, y1 - br, br, br, 0, Math.PI / 2),
    ...lungoSegmento(x1 - br, y1, x0 + bl, y1),
    ...lungoEllisse(x0 + bl, y1 - bl, bl, bl, Math.PI / 2, Math.PI),
    ...lungoSegmento(x0, y1 - bl, x0, y0 + tl),
    ...lungoEllisse(x0 + tl, y0 + tl, tl, tl, Math.PI, Math.PI * 1.5),
  ];
  // Scarto ridotto della metà: sulle bolle piccole il tremolio pieno delle card
  // (±0,5 px) si legge come sporco, non come mano.
  return tracciato(aMano(ideale, caso, 0.3));
}
