/**
 * Stile mappa "cartina" — PROTOTIPO A RUNTIME.
 *
 * Ridipinge i layer di `mapbox://styles/mapbox/outdoors-v12` con la palette
 * carta, al caricamento. Serve a VEDERE il risultato su Genova vera senza
 * passare una giornata in Mapbox Studio.
 *
 * Base outdoors-v12 e non streets-v12: ha CURVE DI LIVELLO e rilievo, che sono
 * il segno grafico della cartina geografica.
 *
 * Due principi:
 *   1. la TERRA prende lo stesso colore del fondo app, cosi' la mappa non e' un
 *      riquadro estraneo ma la stessa carta;
 *   2. si RICOLORA, non si toglie. Nella prima versione avevo nascosto i POI e
 *      schiacciato il rilievo: il risultato era un foglio grigio e triste, che
 *      e' l'opposto del brand. Le informazioni utili restano.
 *
 * ⚠️ Non e' la soluzione definitiva: nasconde invece di eliminare, quindi Mapbox
 * scarica comunque tutti i layer. Quando la direzione e' approvata va congelato
 * in uno stile pubblicato da Studio.
 */

// Palette allineata ai token di index.css (qui servono valori letterali:
// Mapbox non legge le CSS custom properties).
const CARTA = "#F4EEE2";
const FOGLIO = "#FAF6EB";
const INCAVO = "#E8E1D1";
const LINEA = "#DACFB8";
const INK = "#382D24";
const INK_SOFT = "#746759";

/* I verdi devono restare VERDI. La prima versione li aveva desaturati fino a
   diventare beige: la mappa risultava tutta grigia e triste, che e' l'opposto
   del "giocoso" del brand. Verde salvia/oliva: chiaramente verde, ma stampato. */
const VERDE = "#C3D19E";
const VERDE_SCURO = "#A9BC80";
const ACQUA = "#A8C6D6"; // il mare di Genova, non l'azzurro fluo di serie

/* I POI restano, non si nascondono: sapere che c'e' un bar o un hotel accanto
   a un annuncio e' informazione utile. Si ricolorano nella palette invece di
   competere col rosa/viola di Mapbox. */
const POI = "#9A7B4F";
const CURVA = "#D8C9AE"; // curve di livello — il segno della cartina

/** true se l'id del layer contiene una delle parole chiave. */
const match = (id: string, ...chiavi: string[]) =>
  chiavi.some((k) => id.includes(k));

/** Contatore diagnostico: quante proprieta' sono state applicate davvero.
    Serve a distinguere "non ha funzionato" da "ha funzionato ma non si vede". */
let tocchi = 0;

/** setPaintProperty che non esplode se il layer non ha quella proprieta'. */
function paint(map: MapLike, id: string, prop: string, value: unknown) {
  try {
    map.setPaintProperty(id, prop, value);
    tocchi++;
  } catch {
    /* layer senza questa proprieta': normale, si ignora */
  }
}

function hide(map: MapLike, id: string) {
  try {
    map.setLayoutProperty(id, "visibility", "none");
  } catch {
    /* idem */
  }
}

interface MapLike {
  getStyle: () => { layers?: Array<{ id: string; type: string }> } | undefined;
  setPaintProperty: (layer: string, prop: string, value: unknown) => void;
  setLayoutProperty: (layer: string, prop: string, value: unknown) => void;
  setLayerZoomRange?: (layer: string, min: number, max: number) => void;
}

/** Limita un layer a certi livelli di zoom (se il metodo esiste). */
function zoom(map: MapLike, id: string, min: number, max = 24) {
  try {
    map.setLayerZoomRange?.(id, min, max);
  } catch {
    /* ignora */
  }
}

export function applyPaperStyle(map: MapLike): { layer: number; tocchi: number } {
  const layers = map.getStyle()?.layers;
  if (!layers) return { layer: 0, tocchi: 0 };

  tocchi = 0;
  for (const layer of layers) {
    const id = layer.id;

    // --- sfondo e terra: la stessa carta dell'app ---
    if (layer.type === "background") {
      paint(map, id, "background-color", CARTA);
      continue;
    }

    // --- RILIEVO E CURVE DI LIVELLO: il segno piu' "cartina" che esista.
    //     Nella prima versione li avevo quasi spenti (0.06) ed e' il motivo per
    //     cui la mappa sembrava un foglio grigio. Vanno esaltati, non nascosti. ---
    if (match(id, "contour")) {
      // Le curve di livello hanno senso sulle alture, non tra i caruggi: sotto
      // lo zoom 13 la citta' e' gia' densa e diventano solo rumore.
      zoom(map, id, 13);
      paint(map, id, "line-color", CURVA);
      paint(map, id, "line-opacity", 0.55);
      paint(map, id, "text-color", INK_SOFT);
      paint(map, id, "text-halo-color", CARTA);
      continue;
    }
    if (match(id, "hillshade", "terrain")) {
      paint(map, id, "hillshade-exaggeration", 0.45);
      paint(map, id, "hillshade-shadow-color", "#B8A585");
      paint(map, id, "hillshade-highlight-color", FOGLIO);
      paint(map, id, "hillshade-accent-color", "#C6B393");
      paint(map, id, "fill-opacity", 0.35);
      continue;
    }

    // --- acqua ---
    if (match(id, "water", "waterway")) {
      paint(map, id, "fill-color", ACQUA);
      paint(map, id, "line-color", ACQUA);
      continue;
    }

    // --- verde: vero verde, non beige ---
    if (match(id, "national-park", "landcover", "park", "pitch", "golf", "grass", "wood")) {
      paint(map, id, "fill-color", match(id, "wood", "national-park") ? VERDE_SCURO : VERDE);
      paint(map, id, "fill-opacity", 0.85);
      continue;
    }

    // --- altre destinazioni d'uso: appena percettibili ---
    if (match(id, "landuse", "aeroway", "hospital", "school")) {
      paint(map, id, "fill-color", INCAVO);
      paint(map, id, "fill-opacity", 0.5);
      continue;
    }

    // --- edifici ---
    if (match(id, "building")) {
      paint(map, id, "fill-color", INCAVO);
      paint(map, id, "fill-outline-color", LINEA);
      paint(map, id, "fill-extrusion-color", INCAVO);
      paint(map, id, "fill-opacity", 0.7);
      continue;
    }

    // --- strade: bianco carta, con il "casing" a fare il tratto ---
    if (match(id, "road", "bridge", "tunnel", "street")) {
      if (match(id, "construction")) {
        hide(map, id);
        continue;
      }
      // PEDONALI: a Genova il centro storico e' quasi tutto zona pedonale, e
      // Mapbox le classifica come "path". Dipingerle scure come i sentieri di
      // montagna anneriva l'intero caruggio. Qui sono STRADE, quindi chiare
      // come le altre, distinte solo da un tratto piu' sottile.
      if (match(id, "path", "steps", "pedestrian", "footway")) {
        paint(map, id, "line-color", FOGLIO);
        paint(map, id, "line-opacity", 0.9);
        continue;
      }
      // Le sterrate vere restano in tratto tenue.
      if (match(id, "track")) {
        paint(map, id, "line-color", LINEA);
        paint(map, id, "line-opacity", 0.7);
        continue;
      }
      paint(map, id, "line-color", match(id, "case", "casing") ? LINEA : FOGLIO);
      continue;
    }

    // --- confini amministrativi: tenui ---
    if (match(id, "admin", "boundary")) {
      paint(map, id, "line-color", LINEA);
      paint(map, id, "line-opacity", 0.5);
      continue;
    }

    // --- etichette e simboli: SI TENGONO ---
    // Sapere che accanto a un annuncio c'e' un bar, una fermata o un hotel e'
    // informazione utile per chi valuta un lavoretto. Vanno ricolorate nella
    // palette, non nascoste: il rosa e il viola di Mapbox erano il problema,
    // non la loro presenza.
    if (layer.type === "symbol") {
      // Gli scudetti dei numeri stradali restano l'unica cosa davvero fuori
      // contesto in citta': quelli si spengono.
      if (match(id, "shield", "golf-hole")) {
        hide(map, id);
        continue;
      }

      const isPoi = match(id, "poi", "transit", "airport", "rail", "ferry");
      const isLuogo = match(id, "settlement", "place", "state", "country");

      // I POI restano (sono utili) ma compaiono solo da vicino: nel centro
      // storico di Genova a zoom 14 erano decine di etichette sovrapposte —
      // e' da li' che veniva la confusione, non dal colore.
      if (isPoi) zoom(map, id, 15.5);

      paint(map, id, "text-color", isPoi ? POI : isLuogo ? INK : INK_SOFT);
      paint(map, id, "text-halo-color", CARTA);
      paint(map, id, "text-halo-width", 1.4);
      paint(map, id, "icon-opacity", isPoi ? 0.5 : 0.8);
      paint(map, id, "icon-color", POI);
      continue;
    }
  }

  return { layer: layers.length, tocchi };
}
