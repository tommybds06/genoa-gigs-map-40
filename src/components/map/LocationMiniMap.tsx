import { PIN_CENTRO, PIN_PROPORZIONE, pinSvg } from "@/lib/formaPin";
import { useEffect, useRef } from "react";
import { MappaIcon } from "@/components/icons/uiIcons";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useUser } from "@/contexts/UserContext";
import { cerchioGeo, coloreToken } from "@/lib/area";

import { getJobIconFromTags } from "@/lib/jobIcons";
import { renderToStaticMarkup } from "react-dom/server";

interface LocationMiniMapProps {
  lat: number;
  lng: number;
  neighborhood?: string | null;
  address?: string | null;
  tags?: string[] | null;
  /** Annuncio di un privato: il raggio dell'area in metri. Al posto del pin
      si disegna il cerchio (24 ottobre). lat/lng sono già il centro spostato. */
  raggio?: number;
}

export function LocationMiniMap({ lat, lng, neighborhood, address, tags, raggio }: LocationMiniMapProps) {
  const tagsKey = (tags || []).join(",");
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  /* Stessa cache di InteractiveMap: la minimappa non rifà il giro di rete. */
  const mapboxToken = useMapboxToken();
  const isLoading = mapboxToken === null;
  const { isEmployer } = useUser();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !lat || !lng) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: 14,
      interactive: false, // Static map - no interactions
      attributionControl: false,
      logoPosition: 'bottom-right',
    });

    // Hide Mapbox logo after map loads
    map.current.on('load', () => {
      const logoEl = mapContainer.current?.querySelector('.mapboxgl-ctrl-logo');
      if (logoEl) {
        (logoEl as HTMLElement).style.display = 'none';
      }
      // L'AREA di un privato: un cerchio, nei colori del pin di chi guarda.
      if (raggio && map.current) {
        map.current.addSource("area", { type: "geojson", data: cerchioGeo(lat, lng, raggio, `${lat},${lng}`) });
        map.current.addLayer({
          id: "area-riempimento",
          type: "fill",
          source: "area",
          paint: { "fill-color": coloreToken(isEmployer ? "--employer-700" : "--primary", 0.22) },
        });
        map.current.addLayer({
          id: "area-bordo",
          type: "line",
          source: "area",
          paint: { "line-color": coloreToken(isEmployer ? "--employer-800" : "--primary-strong"), "line-width": 2 },
        });
      }
    });

    if (raggio) {
      return () => {
        map.current?.remove();
      };
    }

    // I colori del pin dell'annuncio sulla mappa grande (InteractiveMap):
    // arancio pieno + icona in inchiostro (6,45:1), oppure employer-700 +
    // icona bianca (4,74:1). ⚠️ Prima erano scritti a mano: arancio con
    // l'icona BIANCA (2,07:1, la regola di §5) e arancione anche per l'employer.
    // Il marker nasce fuori da React, quindi i colori vanno come variabili CSS.
    const Icon = getJobIconFromTags(tags);
    const iconMarkup = renderToStaticMarkup(
      <Icon
        width={22}
        height={22}
        style={{ color: isEmployer ? "hsl(var(--employer-foreground))" : "hsl(var(--primary-foreground))" }}
      />
    );
    const pinColor = isEmployer ? "hsl(var(--employer-700))" : "hsl(var(--primary))";
    const markerEl = document.createElement("div");
    // Il pin disegnato (lib/formaPin.ts), 40 px di larghezza come prima;
    // l'icona al centro del cerchio superiore.
    markerEl.innerHTML = `
      <div style="position:relative;width:40px;height:${Math.round(40 * PIN_PROPORZIONE)}px;filter:drop-shadow(0 1.5px 0 rgb(56 45 36 / 0.10)) drop-shadow(0 2px 2px rgb(56 45 36 / 0.13));">
        ${pinSvg(40, pinColor)}
        <div style="position:absolute;left:${PIN_CENTRO.x}%;top:${PIN_CENTRO.y}%;transform:translate(-50%,-50%);display:flex;">
          ${iconMarkup}
        </div>
      </div>
    `;

    new mapboxgl.Marker({ element: markerEl, anchor: "bottom" })
      .setLngLat([lng, lat])
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, lat, lng, tagsKey, isEmployer, raggio]);

  if (isLoading) {
    return (
      <div className="w-full h-40 rounded-2xl bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Caricamento mappa...</span>
      </div>
    );
  }

  if (!mapboxToken || !lat || !lng) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div 
        ref={mapContainer} 
        /* Ritagliata come le foto (`.sagoma-foto`, §6): la maschera È il
           contenitore, quindi niente bordo CSS né `rounded`. */
        className="sagoma-foto w-full h-40 overflow-hidden [&_.mapboxgl-ctrl-logo]:hidden [&_.mapboxgl-ctrl-attrib]:hidden"
      />
      {(neighborhood || address) && (
        <div className="text-center space-y-0.5">
          {neighborhood && (
            <p className="text-sm font-medium text-foreground">
              {neighborhood}
            </p>
          )}
          {address && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <MappaIcon className="w-3 h-3 shrink-0" />
              {address}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
