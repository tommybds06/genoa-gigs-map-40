import { generatore, PASSO, SCARTO, semeDa } from "./tratto";

/**
 * IL CERCHIO IMPERFETTO — gli avatar e le foto profilo tonde.
 *
 * Stesso tratto delle sagome della bacheca (lib/tratto.ts): un vertice ogni
 * ~5,5 px lungo la circonferenza, spostato di ±0,5 px — la grana del bordo
 * disegnato da Tommaso. Calcolato in PIXEL dal diametro vero, quindi è un
 * cerchio imperfetto a qualunque misura.
 *
 * ⚠️ Perché non `.sagoma-foto` come nella scheda del lavoro: quella è il
 * ritaglio a 9 sezioni del bordo delle card, con angoli da 28 px. Su un
 * quadrato da 56 px i quattro angoli si toccano e il risultato è quasi un
 * cerchio — ma da 80 px in su compaiono i lati dritti e diventa un quadrato
 * smussato. E un cerchio, col 9 sezioni, non si ricava da nessun disegno (§6).
 *
 * Restituisce un tracciato per `clip-path: path()`, in px del box.
 */
export function cerchioImperfetto(diametro: number, seme: string): string {
  const caso = generatore(semeDa(seme));
  const c = diametro / 2;
  // Sotto i ~40 px lo scarto pieno si mangerebbe troppo bordo: si riduce.
  const scarto = SCARTO * Math.min(1, diametro / 40);
  const r = c - scarto - 0.1;
  const n = Math.max(16, Math.round((2 * Math.PI * r) / PASSO));
  const punti = Array.from({ length: n }, (_, k) => {
    const a = (2 * Math.PI * k) / n;
    const rr = r + (caso() * 2 - 1) * scarto;
    return `${k === 0 ? "M" : "L"}${(c + rr * Math.cos(a)).toFixed(2)} ${(c + rr * Math.sin(a)).toFixed(2)}`;
  });
  return punti.join("") + "Z";
}
