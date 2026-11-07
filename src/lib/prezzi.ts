/**
 * I PREZZI DELLE OPZIONI DI UN ANNUNCIO (5 novembre) — sorgente unica.
 * I numeri stanno in `config/prezzi.ts`; qui solo la logica.
 *
 * ⚠️ Import relativi con l'estensione: così i test girano con il solo Node
 * (`npm test`, `node --test`), che non conosce l'alias `@/`.
 */
import { PREZZI } from "../config/prezzi.ts";

export type Durata = "occasionale" | "giornaliero" | "settimanale" | "mensile" | "continuativo";
export type TipoPaga = "oraria" | "giornaliera" | "settimanale" | "mensile" | "forfait";
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

/**
 * LE UNITÀ DI PAGA PER DURATA (7 novembre). Solo quelle che hanno senso:
 * «al mese» su un lavoro di una sera no. «Al giorno» anche sui lavori lunghi,
 * perché «60 € a serata, due sere a settimana» è il caso tipico.
 * L'ordine è quello dei bottoni nel form.
 */
export const UNITA_PER_DURATA: Record<Durata, TipoPaga[]> = {
  occasionale: ["oraria", "forfait"],
  giornaliero: ["oraria", "giornaliera", "forfait"],
  settimanale: ["oraria", "giornaliera", "settimanale", "forfait"],
  mensile: ["oraria", "giornaliera", "settimanale", "mensile", "forfait"],
  continuativo: ["oraria", "giornaliera", "settimanale", "mensile", "forfait"],
};

export type CampoQuantita = "oreTotali" | "oreGiorno" | "giorni" | "oreSettimana" | "giorniSettimana" | "settimane";

/** Quali ore servono per ogni durata, con la paga ORARIA. */
export const ORE_PER_DURATA: Record<Durata, CampoQuantita[]> = {
  occasionale: ["oreTotali"],
  giornaliero: ["oreGiorno", "giorni"],
  settimanale: ["oreSettimana", "settimane"],
  mensile: ["oreSettimana"],
  continuativo: ["oreSettimana"],
};

/**
 * Le quantità che il form chiede per calcolare il valore: dipendono dalla
 * durata E dall'unità di paga. Il forfait e il mensile non chiedono niente
 * (il mese è già il tetto del valore), la paga settimanale solo quante
 * settimane, la giornaliera quanti giorni (o quanti a settimana).
 */
export function campiQuantita(durata: Durata | null, tipoPaga: TipoPaga): CampoQuantita[] {
  if (!durata || !UNITA_PER_DURATA[durata].includes(tipoPaga)) return [];
  switch (tipoPaga) {
    case "oraria":
      return ORE_PER_DURATA[durata];
    case "giornaliera":
      return durata === "giornaliero" ? ["giorni"] : durata === "settimanale" ? ["giorniSettimana", "settimane"] : ["giorniSettimana"];
    case "settimanale":
      return durata === "settimanale" ? ["settimane"] : [];
    default:
      return [];
  }
}

export interface DatiValore {
  durata: Durata;
  tipoPaga: TipoPaga;
  /** L'importo così com'è scritto, lordo o netto che sia. */
  importo: number;
  oreTotali?: number | null;
  oreGiorno?: number | null;
  giorni?: number | null;
  oreSettimana?: number | null;
  /** Con la paga giornaliera sui lavori di settimane o mesi. */
  giorniSettimana?: number | null;
  settimane?: number | null;
}

const positivo = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

/**
 * Il valore dell'annuncio, in euro: quanto vale il lavoro per chi lo fa.
 * `null` se mancano i dati per calcolarlo.
 */
export function valoreAnnuncio(d: DatiValore): number | null {
  if (!Number.isFinite(d.importo) || d.importo < 0) return null;
  // Una combinazione che il form non offre (al mese su una tantum): niente valore.
  if (!UNITA_PER_DURATA[d.durata].includes(d.tipoPaga)) return null;
  if (d.tipoPaga === "forfait") return d.importo;
  const paga = d.importo;
  // Quante settimane contano: quelle dichiarate, fino al tetto (4); i lavori
  // di mesi o continuativi valgono il tetto.
  const settimane = d.durata === "settimanale" ? (positivo(d.settimane) ? Math.min(d.settimane, PREZZI.settimaneMassime) : null) : PREZZI.settimaneMassime;

  if (d.tipoPaga === "mensile") return paga; // un mese ≈ il tetto di 4 settimane
  if (d.tipoPaga === "settimanale") return settimane === null ? null : paga * settimane;
  if (d.tipoPaga === "giornaliera") {
    if (d.durata === "giornaliero") return positivo(d.giorni) ? paga * d.giorni : null;
    const g = d.giorniSettimana;
    return positivo(g) && g <= 7 && settimane !== null ? paga * g * settimane : null;
  }

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
 * «80€/giorno lordi», «1.200€/mese netti», «150€ forfait lordi»).
 * ⚠️ `leggiPagaDaTesto` (lib/bacheca.ts) lo rilegge per precompilare il
 * cartellino: i suffissi devono restare riconoscibili (ci sono i test).
 */
const SUFFISSO_PAGA: Record<TipoPaga, string> = {
  oraria: "/h",
  giornaliera: "/giorno",
  settimanale: "/settimana",
  mensile: "/mese",
  forfait: " forfait",
};

export function testoPaga(tipoPaga: TipoPaga, importo: number, lorda: boolean): string {
  return `${testoImporto(importo)}${SUFFISSO_PAGA[tipoPaga]} ${lorda ? "lordi" : "netti"}`;
}
