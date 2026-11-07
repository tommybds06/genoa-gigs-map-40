/**
 * I PREZZI DELLE OPZIONI DI UN ANNUNCIO (5 novembre) — sorgente unica.
 * I numeri stanno in `config/prezzi.ts`; qui solo la logica.
 *
 * ⚠️ Import relativi con l'estensione: così i test girano con il solo Node
 * (`npm test`, `node --test`), che non conosce l'alias `@/`.
 */
import { PREZZI } from "../config/prezzi.ts";

export type Durata = "occasionale" | "giornaliero" | "settimanale" | "mensile" | "continuativo";
export type TipoPaga = "oraria" | "forfait";
export type Opzione = "nessuna" | "potenziamento" | "allungamento" | "pacchetto";

/**
 * I tag di durata dell'app (`constants/tags.ts`, rinominati a ottobre) →
 * le cinque durate del calcolo. Anche i nomi vecchi, per sicurezza.
 */
const DURATA_DA_TAG: Record<string, Durata> = {
  "Una tantum": "occasionale",
  Occasionale: "occasionale",
  Giorni: "giornaliero",
  Settimane: "settimanale",
  Settimanale: "settimanale",
  Mesi: "mensile",
  Mensile: "mensile",
  Continuativo: "continuativo",
};

export function durataDaTag(tag: string | null | undefined): Durata | null {
  return (tag && DURATA_DA_TAG[tag]) || null;
}

/** Quali ore servono per ogni durata (le chiede il form). */
export const ORE_PER_DURATA: Record<Durata, ("oreTotali" | "oreGiorno" | "giorni" | "oreSettimana" | "settimane")[]> = {
  occasionale: ["oreTotali"],
  giornaliero: ["oreGiorno", "giorni"],
  settimanale: ["oreSettimana", "settimane"],
  mensile: ["oreSettimana"],
  continuativo: ["oreSettimana"],
};

export interface DatiValore {
  durata: Durata;
  tipoPaga: TipoPaga;
  /** L'importo così com'è scritto, lordo o netto che sia. */
  importo: number;
  oreTotali?: number | null;
  oreGiorno?: number | null;
  giorni?: number | null;
  oreSettimana?: number | null;
  settimane?: number | null;
}

const positivo = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

/**
 * Il valore dell'annuncio, in euro: quanto vale il lavoro per chi lo fa.
 * `null` se mancano i dati per calcolarlo.
 */
export function valoreAnnuncio(d: DatiValore): number | null {
  if (!Number.isFinite(d.importo) || d.importo < 0) return null;
  if (d.tipoPaga === "forfait") return d.importo;
  const paga = d.importo;
  switch (d.durata) {
    case "occasionale":
      return positivo(d.oreTotali) ? d.oreTotali * paga : null;
    case "giornaliero":
      return positivo(d.oreGiorno) && positivo(d.giorni) ? d.oreGiorno * d.giorni * paga : null;
    case "settimanale":
      return positivo(d.oreSettimana) && positivo(d.settimane)
        ? d.oreSettimana * paga * Math.min(d.settimane, PREZZI.settimaneMassime)
        : null;
    case "mensile":
    case "continuativo":
      return positivo(d.oreSettimana) ? d.oreSettimana * paga * PREZZI.settimaneMassime : null;
  }
}

/** Al centesimo. `EPSILON` perché 1,005 × 100 in virgola mobile fa 100,4999… */
const alCentesimo = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface Prezzi {
  potenziamento: number;
  allungamento: number;
  pacchetto: number;
}

/**
 * I tre prezzi, al centesimo (mai all'euro: 2,51 resta 2,51).
 * Allungamento e pacchetto partono dal potenziamento GIÀ arrotondato, così
 * i conti che si vedono sulle card tornano.
 */
export function calcolaPrezzi(valore: number): Prezzi {
  const grezzo = PREZZI.k * Math.pow(Math.max(0, valore), PREZZI.esponente);
  const potenziamento = alCentesimo(Math.min(PREZZI.massimo, Math.max(PREZZI.minimo, grezzo)));
  const allungamento = alCentesimo(potenziamento * PREZZI.quotaAllungamento);
  const pacchetto = alCentesimo((potenziamento + allungamento) * (1 - PREZZI.scontoPacchetto));
  return { potenziamento, allungamento, pacchetto };
}

/** «2,51 €» */
export function testoPrezzo(euro: number): string {
  return `${euro.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** «9,50€», «10€»: i centesimi solo se ci sono. */
function testoImporto(n: number): string {
  return `${n.toLocaleString("it-IT", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}€`;
}

/**
 * Il testo della paga che mostrano card e scheda («10€/h netti»,
 * «150€ forfait lordi»). ⚠️ `leggiPagaDaTesto` (lib/bacheca.ts) lo rilegge
 * per precompilare il cartellino: «/h» e «forfait» devono restarci.
 */
export function testoPaga(tipoPaga: TipoPaga, importo: number, lorda: boolean): string {
  const base = tipoPaga === "oraria" ? `${testoImporto(importo)}/h` : `${testoImporto(importo)} forfait`;
  return `${base} ${lorda ? "lordi" : "netti"}`;
}
