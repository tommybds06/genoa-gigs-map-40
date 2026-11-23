/**
 * OUTFIT SULLA MAPPA (23 novembre).
 *
 * Le scritte della mappa non le disegna il browser: le disegna Mapbox coi
 * SUOI caratteri, scaricati a pezzi (`glyphs`). Per avere Outfit, Tommaso
 * l'ha caricato nel suo account Mapbox (`tommybds`, lo stesso del token
 * dell'app: i caratteri caricati valgono solo per quell'account) in tre pesi:
 * Regular, Medium, SemiBold (i file «static», non il variabile).
 * Licenza OFL: caricarlo su Mapbox è permesso. Shinjo no (§13).
 *
 * Si tiene `streets-v12` com'è e si scambiano solo i caratteri: lo stile
 * arriva come JSON, qui gli si cambia l'indirizzo dei caratteri (dall'account
 * `mapbox` a `tommybds`) e DIN Pro → Outfit dello stesso peso. Non una copia
 * in Mapbox Studio: resterebbe ferma, senza gli aggiornamenti di Mapbox, e le
 * modifiche starebbero fuori dal repo.
 *
 * - DIN Pro Italic (nomi del mare, dei corsi d'acqua) → Outfit Regular:
 *   Outfit non ha il corsivo.
 * - DIN Pro Bold → Outfit SemiBold (il più pesante caricato).
 * - I NOMI DELLE VIE (`road-label`) in Outfit LIGHT (caricato dopo, 23
 *   novembre). Sono in nero pieno, e col tratto di Outfit Regular, più
 *   spesso di DIN Pro, leggevano più scuri di prima (Tommaso: «danno
 *   leggermente fastidio»). Schiarire il colore non bastava: al 30% di
 *   grigio non si distingueva dal nero, lo scuro lo fa lo spessore.
 * - «Arial Unicode MS» resta come riserva per gli alfabeti che Outfit non ha:
 *   verificato che l'account la serve insieme a Outfit (23 novembre).
 *
 * Funzione pura, senza import: la provano i test (`npm test`).
 */

export const ACCOUNT_CARATTERI = "tommybds";

const SCAMBIO: Record<string, string> = {
  "DIN Pro Regular": "Outfit Regular",
  "DIN Pro Medium": "Outfit Medium",
  "DIN Pro Italic": "Outfit Regular",
  "DIN Pro Bold": "Outfit SemiBold",
  "DIN Pro Medium Italic": "Outfit Medium",
  "DIN Pro Bold Italic": "Outfit SemiBold",
};

/** Eccezioni per strato: il nome dello strato → il suo scambio. */
const PER_STRATO: Record<string, Record<string, string>> = {
  "road-label": { "DIN Pro Regular": "Outfit Light" },
};

type Strato = { layout?: Record<string, unknown> } & Record<string, unknown>;
export type StileMappa = { glyphs?: string; layers?: Strato[] } & Record<string, unknown>;

/** Scambia i nomi dentro un valore di `text-font`, anche se è un'espressione. */
function scambia(valore: unknown, eccezioni: Record<string, string> = {}): unknown {
  if (typeof valore === "string") return eccezioni[valore] ?? SCAMBIO[valore] ?? valore;
  if (Array.isArray(valore)) return valore.map((v) => scambia(v, eccezioni));
  return valore;
}

export function conOutfit<T extends StileMappa>(stile: T): T {
  return {
    ...stile,
    glyphs: `mapbox://fonts/${ACCOUNT_CARATTERI}/{fontstack}/{range}.pbf`,
    layers: (stile.layers ?? []).map((strato) => {
      const caratteri = strato.layout?.["text-font"];
      if (caratteri === undefined) return strato;
      const eccezioni = PER_STRATO[String(strato.id)];
      return { ...strato, layout: { ...strato.layout, "text-font": scambia(caratteri, eccezioni) } };
    }),
  };
}
