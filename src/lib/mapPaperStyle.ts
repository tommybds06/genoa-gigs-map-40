/**
 * Stile mappa "cartina" — palette carta + motivi disegnati a mano.
 *
 * Ridipinge i layer dello stile Mapbox al caricamento e sostituisce il colore
 * pieno di mare e verde con i MOTIVI disegnati da Tommaso (onde, alberelli).
 *
 * Perche' a runtime e non in Mapbox Studio: cosi' si vede subito e si itera.
 * Quando la direzione e' chiusa, lo stesso schema va congelato in uno stile
 * pubblicato — li' i layer si ELIMINANO invece di nasconderli, e la mappa
 * diventa piu' leggera invece che uguale.
 *
 * ⚠️ Gli EDIFICI non usano un motivo. Ci abbiamo provato ed e' stata una
 * strada sbagliata: le impronte degli edifici si leggono come edifici solo in
 * rapporto alle strade, e come motivo ripetuto restano forme astratte. Mapbox
 * disegna gia' gli edifici veri al posto giusto: basta colorarli.
 */

// Palette allineata ai token di index.css (qui servono valori letterali:
// Mapbox non legge le CSS custom properties).
const CARTA = "#F4EEE2";
const FOGLIO = "#FAF5E9";
const INCAVO = "#E8E1D1";
const LINEA = "#DACFB8";
const INK = "#382D24";
const INK_SOFT = "#746759";

const VERDE = "#C3D19E";
const VERDE_SCURO = "#A9BC80";
const ACQUA = "#A8C6D6";
const POI = "#9A7B4F";
const CURVA = "#D8C9AE";

/** I motivi, con la dimensione a cui vanno mostrati (i file sono @2x). */
const MOTIVI = [
  { nome: "politask-mare", file: "/map/mare@2x.png" },
  { nome: "politask-bosco", file: "/map/bosco@2x.png" },
  { nome: "politask-verde-rado", file: "/map/verde-rado@2x.png" },
] as const;

const match = (id: string, ...chiavi: string[]) => chiavi.some((k) => id.includes(k));

let tocchi = 0;

interface MapLike {
  getStyle: () => { layers?: Array<{ id: string; type: string }> } | undefined;
  setPaintProperty: (layer: string, prop: string, value: unknown) => void;
  setLayoutProperty: (layer: string, prop: string, value: unknown) => void;
  setLayerZoomRange?: (layer: string, min: number, max: number) => void;
  hasImage?: (id: string) => boolean;
  addImage?: (id: string, img: unknown, opts?: { pixelRatio?: number }) => void;
  loadImage?: (url: string, cb: (err: unknown, img: unknown) => void) => void;
}

function paint(map: MapLike, id: string, prop: string, value: unknown) {
  try {
    map.setPaintProperty(id, prop, value);
    tocchi++;
  } catch {
    /* il layer non ha questa proprieta': normale */
  }
}

function hide(map: MapLike, id: string) {
  try {
    map.setLayoutProperty(id, "visibility", "none");
  } catch {
    /* idem */
  }
}

function zoom(map: MapLike, id: string, min: number, max = 24) {
  try {
    map.setLayerZoomRange?.(id, min, max);
  } catch {
    /* idem */
  }
}

/**
 * Carica i motivi come immagini dello stile.
 * Vanno registrati PRIMA di usarli in `fill-pattern`, e si perdono a ogni
 * cambio di stile — per questo si ricontrolla con `hasImage` a ogni giro.
 */
export function caricaMotivi(map: MapLike): Promise<void> {
  return Promise.all(
    MOTIVI.map(
      ({ nome, file }) =>
        new Promise<void>((risolvi) => {
          if (map.hasImage?.(nome)) return risolvi();
          map.loadImage?.(file, (err, img) => {
            if (!err && img && !map.hasImage?.(nome)) {
              // pixelRatio 2: il file e' @2x, quindi viene mostrato a meta'
              // dimensione e resta nitido sugli schermi retina.
              try {
                map.addImage?.(nome, img, { pixelRatio: 2 });
              } catch {
                /* gia' presente */
              }
            }
            risolvi();
          });
        })
    )
  ).then(() => undefined);
}

export function applyPaperStyle(map: MapLike): { layer: number; tocchi: number } {
  const layers = map.getStyle()?.layers;
  if (!layers) return { layer: 0, tocchi: 0 };

  const conMotivi = MOTIVI.every((m) => map.hasImage?.(m.nome));
  tocchi = 0;

  for (const layer of layers) {
    const id = layer.id;

    if (layer.type === "background") {
      paint(map, id, "background-color", CARTA);
      continue;
    }

    // Curve di livello: il segno della cartina, ma solo dove serve. Tra i
    // caruggi sono rumore, quindi non sotto lo zoom 13.
    if (match(id, "contour")) {
      zoom(map, id, 13);
      paint(map, id, "line-color", CURVA);
      paint(map, id, "line-opacity", 0.55);
      continue;
    }

    if (match(id, "hillshade", "terrain")) {
      paint(map, id, "hillshade-exaggeration", 0.4);
      paint(map, id, "hillshade-shadow-color", "#B8A585");
      paint(map, id, "hillshade-highlight-color", FOGLIO);
      continue;
    }

    // --- MARE: onde disegnate al posto dell'azzurro pieno ---
    if (match(id, "water", "waterway")) {
      paint(map, id, "fill-color", ACQUA);
      paint(map, id, "line-color", ACQUA);
      if (conMotivi && layer.type === "fill") {
        paint(map, id, "fill-pattern", "politask-mare");
      }
      continue;
    }

    // --- VERDE: alberelli. Bosco fitto per parchi e aree naturali,
    //     verde rado per prati, campi sportivi e aiuole. ---
    if (match(id, "national-park", "wood", "forest")) {
      paint(map, id, "fill-color", VERDE_SCURO);
      if (conMotivi && layer.type === "fill") {
        paint(map, id, "fill-pattern", "politask-bosco");
      }
      continue;
    }
    if (match(id, "landcover", "park", "pitch", "golf", "grass")) {
      paint(map, id, "fill-color", VERDE);
      paint(map, id, "fill-opacity", 0.9);
      if (conMotivi && layer.type === "fill") {
        paint(map, id, "fill-pattern", "politask-verde-rado");
      }
      continue;
    }

    if (match(id, "landuse", "aeroway", "hospital", "school")) {
      paint(map, id, "fill-color", INCAVO);
      paint(map, id, "fill-opacity", 0.5);
      continue;
    }

    // --- EDIFICI: quelli VERI di Mapbox, solo ricolorati. Nessun motivo. ---
    if (match(id, "building")) {
      paint(map, id, "fill-color", INCAVO);
      paint(map, id, "fill-outline-color", LINEA);
      paint(map, id, "fill-extrusion-color", INCAVO);
      paint(map, id, "fill-opacity", 0.75);
      continue;
    }

    if (match(id, "road", "bridge", "tunnel", "street")) {
      if (match(id, "construction")) {
        hide(map, id);
        continue;
      }
      // A Genova il centro storico e' quasi tutto pedonale e Mapbox lo
      // classifica "path": dipingerlo come i sentieri di montagna anneriva
      // ogni caruggio. Qui sono strade, quindi chiare come le altre.
      if (match(id, "path", "steps", "pedestrian", "footway")) {
        paint(map, id, "line-color", FOGLIO);
        paint(map, id, "line-opacity", 0.9);
        continue;
      }
      if (match(id, "track")) {
        paint(map, id, "line-color", LINEA);
        paint(map, id, "line-opacity", 0.7);
        continue;
      }
      paint(map, id, "line-color", match(id, "case", "casing") ? LINEA : FOGLIO);
      continue;
    }

    if (match(id, "admin", "boundary")) {
      paint(map, id, "line-color", LINEA);
      paint(map, id, "line-opacity", 0.5);
      continue;
    }

    // --- Etichette: si tengono, ricolorate. I POI sono informazione utile,
    //     ma solo da vicino: a zoom 14 in centro erano decine sovrapposte. ---
    if (layer.type === "symbol") {
      if (match(id, "shield", "golf-hole")) {
        hide(map, id);
        continue;
      }
      const isPoi = match(id, "poi", "transit", "airport", "rail", "ferry");
      const isLuogo = match(id, "settlement", "place", "state", "country");
      if (isPoi) zoom(map, id, 15.5);
      paint(map, id, "text-color", isPoi ? POI : isLuogo ? INK : INK_SOFT);
      paint(map, id, "text-halo-color", CARTA);
      paint(map, id, "text-halo-width", 1.4);
      paint(map, id, "icon-opacity", isPoi ? 0.5 : 0.8);
      continue;
    }
  }

  return { layer: layers.length, tocchi };
}
