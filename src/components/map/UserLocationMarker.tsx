import { memo } from "react";
import { Marker } from "react-map-gl";

interface UserLocationMarkerProps {
  latitude: number;
  longitude: number;
}

function UserLocationMarkerInner({ latitude, longitude }: UserLocationMarkerProps) {
  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      anchor="center"
    >
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping" />
        
        {/* Middle static ring */}
        <div className="absolute w-6 h-6 rounded-full bg-blue-500/20" />
        
        {/* Inner blue dot */}
        <div className="relative w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg z-10" />
      </div>
    </Marker>
  );
}

export const UserLocationMarker = memo(UserLocationMarkerInner);
