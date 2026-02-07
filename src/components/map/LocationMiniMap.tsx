import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";

interface LocationMiniMapProps {
  lat: number;
  lng: number;
  neighborhood?: string | null;
  address?: string | null;
}

export function LocationMiniMap({ lat, lng, neighborhood, address }: LocationMiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchToken();
  }, []);

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

    // Create custom pin marker matching the main map style exactly
    const markerEl = document.createElement("div");
    markerEl.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
      ">
        <div style="
          width: 40px;
          height: 40px;
          background-color: hsl(24.6, 95%, 53.1%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            <rect width="20" height="14" x="2" y="6" rx="2"/>
          </svg>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid hsl(24.6, 95%, 53.1%);
          margin-top: -1px;
        "></div>
      </div>
    `;

    new mapboxgl.Marker({ element: markerEl, anchor: "bottom" })
      .setLngLat([lng, lat])
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, lat, lng]);

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
              <MapPin className="w-3 h-3 shrink-0" />
              {address}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
