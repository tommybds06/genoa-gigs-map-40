import { PIN_CENTRO, PIN_PROPORZIONE, pinSvg } from "@/lib/formaPin";
import { useEffect, useRef } from "react";
import { MappaIcon } from "@/components/icons/uiIcons";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";

import { getJobIconFromTags } from "@/lib/jobIcons";
import { renderToStaticMarkup } from "react-dom/server";

interface LocationMiniMapProps {
  lat: number;
  lng: number;
  neighborhood?: string | null;
  address?: string | null;
  tags?: string[] | null;
}

export function LocationMiniMap({ lat, lng, neighborhood, address, tags }: LocationMiniMapProps) {
  const tagsKey = (tags || []).join(",");
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  /* Stessa cache di InteractiveMap: la minimappa non rifà il giro di rete. */
  const mapboxToken = useMapboxToken();
  const isLoading = mapboxToken === null;

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
    });

    // Custom pin marker: arancione politask + icona del ruolo del lavoro
    const Icon = getJobIconFromTags(tags);
    const iconMarkup = renderToStaticMarkup(
      <Icon width={22} height={22} style={{ color: "white" }} />
    );
    const pinColor = "hsl(30, 90%, 63%)";
    const markerEl = document.createElement("div");
    // Il pin disegnato (lib/formaPin.ts), 40 px di larghezza come prima;
    // l'icona al centro del cerchio superiore.
    markerEl.innerHTML = `
      <div style="position:relative;width:40px;height:${Math.round(40 * PIN_PROPORZIONE)}px;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15));">
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
  }, [mapboxToken, lat, lng, tagsKey]);

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
        className="w-full h-40 rounded-2xl overflow-hidden border border-border [&_.mapboxgl-ctrl-logo]:hidden [&_.mapboxgl-ctrl-attrib]:hidden"
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
