import { memo } from "react";
import { Marker } from "react-map-gl";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Job } from "@/hooks/useJobs";

interface EmployerGroupMarkerProps {
  employerId: string;
  jobs: Job[];
  lat: number;
  lng: number;
  isEmployer: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isSearchActive?: boolean;
  onMarkerClick: (employerId: string, jobs: Job[]) => void;
}

export const EmployerGroupMarker = memo(function EmployerGroupMarker({
  employerId,
  jobs,
  lat,
  lng,
  isEmployer,
  isHighlighted = false,
  isDimmed = false,
  isSearchActive = false,
  onMarkerClick,
}: EmployerGroupMarkerProps) {
  const count = jobs.length;

  return (
    <Marker
      longitude={lng}
      latitude={lat}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onMarkerClick(employerId, jobs);
      }}
    >
      <button 
        className={cn(
          "group flex flex-col items-center cursor-pointer transition-all duration-300 ease-out touch-feedback relative",
          isHighlighted && "scale-125 z-10",
          isDimmed && "opacity-30 scale-90",
          !isSearchActive && "hover:scale-110"
        )}
      >
        {/* Badge counter - uses primary color */}
        <div 
          className={cn(
            "absolute -top-1 -right-1 z-10 min-w-[20px] h-[20px] rounded-full flex items-center justify-center shadow-md border-2 border-white",
            isEmployer ? "bg-employer" : "bg-primary"
          )}
        >
          <span className="text-white text-xs font-bold px-1">{count}</span>
        </div>
        
        {/* Main marker - same size as single markers (w-12 h-12) */}
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shadow-material-md relative transition-all duration-300",
            isHighlighted 
              ? "bg-white border-3 border-primary" 
              : isEmployer 
                ? "bg-employer"
                : "bg-primary"
          )}
          style={isHighlighted ? { borderWidth: '3px' } : undefined}
        >
          <Briefcase
            className={cn(
              "w-6 h-6 transition-colors duration-300",
              isHighlighted ? "text-primary" : "text-white"
            )} 
          />
        </div>
        
        {/* Pointer triangle */}
        <div
          className={cn(
            "w-0 h-0 border-l-[9px] border-r-[9px] border-t-[12px] border-l-transparent border-r-transparent -mt-1 transition-all duration-300",
            isHighlighted 
              ? "border-t-primary" 
              : isEmployer 
                ? "border-t-blue-600" 
                : "border-t-primary"
          )}
        />
      </button>
    </Marker>
  );
});
