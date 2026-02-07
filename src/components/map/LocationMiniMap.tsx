import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";

interface LocationMiniMapProps {
  lat: number;
  lng: number;
  neighborhood?: string | null;
}

export function LocationMiniMap({ lat, lng, neighborhood }: LocationMiniMapProps) {
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
    });

    // Create custom orange pin marker
    const markerEl = document.createElement("div");
    markerEl.innerHTML = `
      <div style="
        width: 40px;
        height: 52px;
        display: flex;
        flex-direction: column;
        align-items: center;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
      ">
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 12px solid #ea580c;
          margin-top: -2px;
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
        className="w-full h-40 rounded-2xl overflow-hidden border border-border"
      />
      {neighborhood && (
        <p className="text-sm text-muted-foreground text-center">
          {neighborhood}
        </p>
      )}
    </div>
  );
}
