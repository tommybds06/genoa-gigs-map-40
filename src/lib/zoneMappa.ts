import Supercluster from "supercluster";
import type { EmployerGroup } from "@/lib/groupJobsByEmployer";
import type { Job } from "@/hooks/useJobs";

/**
 * LE ZONE DELLA MAPPA — annunci vicini uniti in un pin solo (Tommaso, 22 ottobre:
 * «quando si fa dezoom… si sovrappongono creando un brutto effetto»).
 *
 * Due livelli:
 * 1. gli annunci dello STESSO LOCALE sono già un gruppo (`groupJobsByEmployer`):
 *    stanno alle stesse coordinate, nessuno zoom li separerebbe;
 * 2. i gruppi VICINI si uniscono in ZONE con supercluster — la libreria di
 *    Mapbox, già dentro mapbox-gl.
 *
 * Il raggio è 48 px, la larghezza di un pin: due pin si fondono esattamente
 * quando si toccherebbero. Si calcola sullo zoom INTERO (per difetto), come fa
 * supercluster: tra 13 e 14 il raggio sullo schermo va da 48 a 96 px, quindi
 * non c'è mai sovrapposizione — al massimo una zona un po' più larga.
 * Oltre lo zoom 17 (una via) niente zone: lì si vede tutto.
 */
export const RAGGIO_ZONA = 48;

/**
 * L'animazione dei pin che entrano ed escono cambiando zoom: stessa durata e
 * stessa curva per le due metà, che si incrociano. Una curva che parte veloce
 * e rallenta a lungo (ease-out «quint»): il movimento si legge subito e
 * l'arrivo è morbido. 240 ms: accompagna il gesto senza farlo aspettare.
 */
export const DURATA_PIN = 240;
export const CURVA_PIN = "cubic-bezier(0.22, 1, 0.36, 1)";
export const ZOOM_MASSIMO_ZONE = 17;

interface Proprieta {
  gruppo: number;
  n: number;
}
interface ProprietaZona {
  n: number;
}

export type IndiceZone = Supercluster<Proprieta, ProprietaZona>;

export function creaIndiceZone(gruppi: EmployerGroup[]): IndiceZone {
  const indice = new Supercluster<Proprieta, ProprietaZona>({
    radius: RAGGIO_ZONA,
    maxZoom: ZOOM_MASSIMO_ZONE,
    // `n` = quanti ANNUNCI, non quanti gruppi: un locale con 3 annunci conta 3.
    map: (p) => ({ n: p.n }),
    reduce: (somma, p) => {
      somma.n += p.n;
    },
  });
  indice.load(
    gruppi.map((g, i) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [g.lng, g.lat] },
      properties: { gruppo: i, n: g.jobs.length },
    }))
  );
  return indice;
}

/** Cosa va disegnato: un gruppo (1 annuncio o più dello stesso locale) o una zona. */
export type ElementoMappa =
  | { tipo: "gruppo"; chiave: string; lat: number; lng: number; idAnnunci: string[]; gruppo: EmployerGroup }
  | { tipo: "zona"; chiave: string; lat: number; lng: number; idAnnunci: string[]; annunci: Job[] };

/**
 * Gli elementi da disegnare a questo zoom.
 *
 * ⚠️ La CHIAVE dipende dagli annunci contenuti, non dall'id della zona di
 * supercluster (che cambia a ogni livello di zoom): così una zona che a zoom
 * 14 contiene gli stessi annunci che a zoom 13 resta lo stesso marker e non
 * si rianima. Il primo id in ordine + il numero la identificano: un annuncio
 * sta in una zona sola.
 */
export function elementiMappa(indice: IndiceZone, gruppi: EmployerGroup[], zoom: number): ElementoMappa[] {
  return indice.getClusters([-180, -85, 180, 85], Math.floor(zoom)).map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    if ("cluster" in f.properties && f.properties.cluster) {
      const annunci = indice
        .getLeaves(f.properties.cluster_id, Infinity)
        .flatMap((foglia) => gruppi[foglia.properties.gruppo].jobs)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      const ids = annunci.map((j) => j.id).sort();
      return { tipo: "zona", chiave: `z-${ids[0]}-${ids.length}`, lat, lng, idAnnunci: ids, annunci };
    }
    const g = gruppi[(f.properties as Proprieta).gruppo];
    return {
      tipo: "gruppo",
      chiave: g.jobs.length === 1 ? `j-${g.jobs[0].id}` : `g-${g.employerId}`,
      lat: g.lat,
      lng: g.lng,
      idAnnunci: g.jobs.map((j) => j.id),
      gruppo: g,
    };
  });
}

/* ---- LA GARANZIA: nessun pin tocca un altro ----
   supercluster unisce entro un CERCHIO di raggio 48 px, ma il pin non è un
   cerchio: è largo 48, alto 59,5, e il numero sopra sporge di 6 px in alto e
   a destra. Due pin uno sopra l'altro a 50–60 px non venivano uniti e si
   accavallavano (screenshot di Tommaso, 22 ottobre, zona Maddalena).

   Quindi, dopo supercluster, un secondo passaggio sui RETTANGOLI veri: se due
   elementi si toccherebbero (più 3 px di aria), diventano una zona. Si misura
   allo zoom intero per difetto, cioè dove i pin sono più vicini: avvicinando,
   le distanze sullo schermo possono solo crescere, quindi la garanzia vale a
   ogni zoom. */
const MEZZA_LARGHEZZA = 24; // il pin è largo 48, centrato sulla punta
const ALTEZZA = 60; // 59,5 arrotondato: la punta è il punto sulla mappa
const SPORGENZA_NUMERO = 6; // il numero sporge a destra e in alto (NumeroPin)
const ARIA = 3;

/**
 * Il rettangolo VERO di un elemento, in px, con la punta in (x, y): il
 * numero c'è solo se gli annunci sono più di uno. ⚠️ La prima versione dava
 * a TUTTI l'ingombro del numero, e due pin singoli a 55 px (via Rivoli e via
 * Corsica, a zoom 14) si univano senza toccarsi.
 */
function ingombro(el: ElementoMappa, p: { x: number; y: number }) {
  const numero = el.idAnnunci.length > 1 ? SPORGENZA_NUMERO : 0;
  return { l: p.x - MEZZA_LARGHEZZA, r: p.x + MEZZA_LARGHEZZA + numero, t: p.y - ALTEZZA - numero, b: p.y };
}

function siToccano(a: ReturnType<typeof ingombro>, b: ReturnType<typeof ingombro>) {
  return a.l < b.r + ARIA && b.l < a.r + ARIA && a.t < b.b + ARIA && b.t < a.b + ARIA;
}

/** Coordinate in pixel di Web Mercator a uno zoom, come le usa Mapbox (tasselli da 512). */
function inPixel(lng: number, lat: number, zoom: number) {
  const scala = 512 * 2 ** zoom;
  const seno = Math.sin((lat * Math.PI) / 180);
  return {
    x: (lng / 360 + 0.5) * scala,
    y: (0.5 - (0.25 * Math.log((1 + seno) / (1 - seno))) / Math.PI) * scala,
  };
}

function annunciDi(el: ElementoMappa): Job[] {
  return el.tipo === "zona" ? el.annunci : el.gruppo.jobs;
}

function unisci(a: ElementoMappa, b: ElementoMappa): ElementoMappa {
  const annunci = [...annunciDi(a), ...annunciDi(b)].sort((x, y) => y.created_at.localeCompare(x.created_at));
  const ids = annunci.map((j) => j.id).sort();
  const na = a.idAnnunci.length;
  const nb = b.idAnnunci.length;
  return {
    tipo: "zona",
    chiave: `z-${ids[0]}-${ids.length}`,
    // il punto medio PESATO sul numero di annunci, come fa supercluster
    lat: (a.lat * na + b.lat * nb) / (na + nb),
    lng: (a.lng * na + b.lng * nb) / (na + nb),
    idAnnunci: ids,
    annunci,
  };
}

export function separaSovrapposti(elementi: ElementoMappa[], zoom: number): ElementoMappa[] {
  const z = Math.floor(zoom);
  const lista = [...elementi];
  let unito = true;
  while (unito) {
    unito = false;
    const box = lista.map((el) => ingombro(el, inPixel(el.lng, el.lat, z)));
    cerca: for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        if (siToccano(box[i], box[j])) {
          lista[i] = unisci(lista[i], lista[j]);
          lista.splice(j, 1);
          unito = true;
          break cerca;
        }
      }
    }
  }
  return lista;
}
