import { useState, useEffect, useCallback } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import { MapPin, Loader2, AlertTriangle } from "lucide-react";
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
      toast.error(GEOFENCING_ERROR_MESSAGE, { duration: 4000 });
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
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Caricamento mappa...</p>
        </div>
      </div>
    );
  }

  if (mapboxToken === "") {
    return (
      <div className="w-full h-[200px] bg-muted rounded-xl flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Mappa non disponibile. La posizione sarà impostata su Genova Centro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isOutOfBounds && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{GEOFENCING_ERROR_MESSAGE}</span>
        </div>
      )}
      <div className="w-full h-[200px] rounded-xl overflow-hidden border">
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={handleMapClick}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={mapboxToken}
          reuseMaps
        >
          <NavigationControl position="top-right" showCompass={false} />
          
          <Marker
            longitude={markerLng}
            latitude={markerLat}
            anchor="bottom"
            draggable
            onDragEnd={(event) => {
              handleLocationUpdate(event.lngLat.lat, event.lngLat.lng);
            }}
          >
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isOutOfBounds ? 'bg-destructive' : 'bg-blue-600'}`}>
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className={`w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent -mt-1 ${isOutOfBounds ? 'border-t-destructive' : 'border-t-blue-600'}`} />
            </div>
          </Marker>
        </Map>
      </div>
    </div>
  );
}
