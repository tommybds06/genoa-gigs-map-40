import { PinMappa } from "@/components/map/PinMappa";
import { useState, useEffect, useCallback } from "react";
import Map, { Marker } from "react-map-gl";
import { Loader2, AlertTriangle } from "lucide-react";
import { MappaIcon } from "@/components/icons/uiIcons";
import { supabase } from "@/integrations/supabase/client";
import { isWithinGenovaBounds, GEOFENCING_ERROR_MESSAGE, GENOVA_CENTER } from "@/constants/geofencing";
import { toast } from "sonner";
import "mapbox-gl/dist/mapbox-gl.css";

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}

export function LocationPicker({ lat, lng, onLocationChange }: LocationPickerProps) {
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: lng || GENOVA_CENTER.lng,
    latitude: lat || GENOVA_CENTER.lat,
    zoom: 13,
  });

  // Current marker position
  const markerLat = lat || GENOVA_CENTER.lat;
  const markerLng = lng || GENOVA_CENTER.lng;

  // Check if current position is within bounds
  useEffect(() => {
    if (lat && lng) {
      setIsOutOfBounds(!isWithinGenovaBounds(lat, lng));
    }
  }, [lat, lng]);

  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setMapboxToken("");
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
        setMapboxToken("");
      }
    };
    
    fetchMapboxToken();
  }, []);

  const handleLocationUpdate = useCallback((newLat: number, newLng: number) => {
    // Check geofencing
    if (!isWithinGenovaBounds(newLat, newLng)) {
      setIsOutOfBounds(true);
      toast.error(GEOFENCING_ERROR_MESSAGE, { duration: 3000 });
      return;
    }
    
    setIsOutOfBounds(false);
    onLocationChange(newLat, newLng);
  }, [onLocationChange]);

  const handleMapClick = useCallback((event: { lngLat: { lng: number; lat: number } }) => {
    handleLocationUpdate(event.lngLat.lat, event.lngLat.lng);
  }, [handleLocationUpdate]);

  if (mapboxToken === null) {
    return (
      <div className="w-full h-[200px] bg-muted rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-employer mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Caricamento mappa...</p>
        </div>
      </div>
    );
  }

  if (mapboxToken === "") {
    return (
      <div className="w-full h-[200px] bg-muted rounded-xl flex items-center justify-center">
        <div className="text-center p-4">
          <MappaIcon className="w-8 h-8 text-employer mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Mappa non disponibile. La posizione sarà impostata su Genova Centro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* L'avviso col margine tagliato a mano (`sagoma-quartiere`) e i colori
          dello stato «errore», senza bordo CSS (25 ottobre). */}
      {isOutOfBounds && (
        <div className="sagoma-quartiere flex items-center gap-2.5 rounded-[19px] bg-danger-soft px-4 py-3 text-sm text-danger-soft-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{GEOFENCING_ERROR_MESSAGE}</span>
        </div>
      )}
      {/* Ritagliata come le foto e come l'area del privato (`.sagoma-foto`):
          niente bordo CSS né angoli arrotondati a mano. */}
      <div className="sagoma-foto w-full h-[200px] overflow-hidden">
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={handleMapClick}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={mapboxToken}
          reuseMaps
        >
          {/* Niente bottoni dello zoom: la maschera degli angoli li taglierebbe,
              e sul telefono si zooma con due dita (come in AreaPicker). */}
          
          <Marker
            longitude={markerLng}
            latitude={markerLat}
            anchor="bottom"
            draggable
            onDragEnd={(event) => {
              handleLocationUpdate(event.lngLat.lat, event.lngLat.lng);
            }}
          >
            {/* Il pin disegnato (lib/formaPin.ts), a 40 px come prima. */}
            <PinMappa
              icona={MappaIcon}
              larghezza={40}
              latoIcona={20}
              classeFondo={isOutOfBounds ? 'fill-destructive' : 'fill-employer-700'}
              classeIcona="text-employer-foreground"
            />
          </Marker>
        </Map>
      </div>
    </div>
  );
}
