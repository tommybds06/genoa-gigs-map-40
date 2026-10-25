import { useCallback, useMemo, useRef, useState } from "react";
import Map, { Layer, Source, type MapLayerMouseEvent, type MapLayerTouchEvent, type MapRef } from "react-map-gl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import "mapbox-gl/dist/mapbox-gl.css";
import { GEOFENCING_ERROR_MESSAGE, GENOVA_CENTER, isWithinGenovaBounds } from "@/constants/geofencing";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { cerchioGeo, coloreToken } from "@/lib/area";
import { RAGGIO_AREA } from "@/lib/registrazione";

const LIVELLO = "area-riempimento";

/**
 * LA ZONA DI UN PRIVATO (Tommaso, 24 ottobre): niente pin, un CERCHIO di
 * ~300 m che si sposta trascinandolo (o toccando un altro punto della mappa).
 *
 * Quello che si sceglie qui finisce in `profili_riservati`, che legge solo il
 * proprietario. Agli altri il database mostra il centro spostato a caso fino
 * a 100 m, sempre lo stesso: anche un cerchio centrato su casa non dice dov'è
 * la casa.
 *
 * ⚠️ Trascinare il cerchio e trascinare la mappa sono lo stesso gesto: quando
 * il dito parte DENTRO il cerchio si spegne lo spostamento della mappa, e si
 * riaccende al rilascio.
 */
export function AreaPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const token = useMapboxToken();
  const mappa = useRef<MapRef>(null);
  const trascino = useRef(false);
  // Mentre il dito si muove il cerchio lo segue da qui; al rilascio si salva.
  const [provvisorio, setProvvisorio] = useState<{ lat: number; lng: number } | null>(null);
  const centro = provvisorio ?? { lat: lat ?? GENOVA_CENTER.lat, lng: lng ?? GENOVA_CENTER.lng };

  const forma = useMemo(() => cerchioGeo(centro.lat, centro.lng, RAGGIO_AREA, "la-mia-area"), [centro.lat, centro.lng]);
  const colori = useMemo(
    () => ({ fondo: coloreToken("--brand-blue", 0.28), bordo: coloreToken("--employer-800") }),
    []
  );

  const conferma = useCallback(
    (nLat: number, nLng: number) => {
      if (!isWithinGenovaBounds(nLat, nLng)) {
        toast.error(GEOFENCING_ERROR_MESSAGE, { duration: 2300 });
        return;
      }
      onChange(nLat, nLng);
    },
    [onChange]
  );

  const inizio = (e: MapLayerMouseEvent | MapLayerTouchEvent) => {
    if (!e.features?.length) return;
    trascino.current = true;
    mappa.current?.getMap().dragPan.disable();
    setProvvisorio({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  };
  const muovi = (e: MapLayerMouseEvent | MapLayerTouchEvent) => {
    if (trascino.current) setProvvisorio({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  };
  const fine = () => {
    if (!trascino.current) return;
    trascino.current = false;
    mappa.current?.getMap().dragPan.enable();
    if (provvisorio) conferma(provvisorio.lat, provvisorio.lng);
    setProvvisorio(null);
  };

  if (token === null) {
    return (
      <div className="flex h-[240px] w-full items-center justify-center rounded-xl bg-muted">
        <Loader2 className="h-6 w-6 animate-spin text-employer-800" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground">
        Scegli la zona in cui ti trovi. <strong className="font-semibold">Non mostreremo mai il tuo indirizzo.</strong>
      </p>
      {/* Ritagliata come le foto (`.sagoma-foto`): niente bordo CSS. */}
      <div className="sagoma-foto h-[240px] w-full overflow-hidden">
        <Map
          ref={mappa}
          initialViewState={{ latitude: centro.lat, longitude: centro.lng, zoom: 14 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={token || undefined}
          interactiveLayerIds={[LIVELLO]}
          onMouseDown={inizio}
          onTouchStart={inizio}
          onMouseMove={muovi}
          onTouchMove={muovi}
          onMouseUp={fine}
          onTouchEnd={fine}
          onClick={(e) => {
            // Toccare fuori dal cerchio lo porta lì.
            if (!e.features?.length) conferma(e.lngLat.lat, e.lngLat.lng);
          }}
          cursor={trascino.current ? "grabbing" : "grab"}
        >
          {/* Niente bottoni dello zoom: la maschera degli angoli li taglierebbe,
              e sul telefono si zooma con due dita. */}
          <Source id="area" type="geojson" data={forma}>
            <Layer id={LIVELLO} type="fill" paint={{ "fill-color": colori.fondo }} />
            <Layer
              id="area-bordo"
              type="line"
              paint={{ "line-color": colori.bordo, "line-width": 2, "line-dasharray": [2, 1.5] }}
            />
          </Source>
        </Map>
      </div>
      <p className="text-xs text-muted-foreground">Trascina il cerchio, o tocca la mappa per spostarlo lì.</p>
    </div>
  );
}
