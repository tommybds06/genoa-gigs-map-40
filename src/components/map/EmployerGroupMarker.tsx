import { memo, useMemo } from "react";
import { Marker } from "react-map-gl";
import { cn } from "@/lib/utils";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { GenericoIcon } from "@/components/icons/roleIcons";
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

  /**
   * ⚠️ Qui c'era la `Briefcase` di lucide — l'ultima icona di libreria rimasta
   * sulla mappa, accanto ai marker singoli che usano già il set nostro. Un
   * simbolo che cambia disegno a seconda di quanti annunci ha il locale non è
   * più un simbolo.
   *
   * Se i lavori del gruppo sono tutti dello stesso mestiere si mostra quella
   * icona (due turni da cameriere restano «cameriere»); se sono mischiati si
   * usa il generico, perché sceglierne una a caso direbbe una cosa falsa.
   */
  const Icona = useMemo(() => {
    const icone = jobs.map((job) => getJobIconFromTags(job.tags));
    return icone.every((i) => i === icone[0]) ? icone[0] : GenericoIcon;
  }, [jobs]);

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
            isEmployer ? "bg-employer-700" : "bg-primary"
          )}
        >
          <span className={cn("text-xs font-bold px-1", isEmployer ? "text-employer-foreground" : "text-primary-foreground")}>{count}</span>
        </div>
        
        {/* Main marker - same size as single markers (w-12 h-12) */}
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shadow-material-md relative transition-all duration-300",
            isHighlighted
              ? cn("bg-card border-3", isEmployer ? "border-employer-800" : "border-primary-strong")
              : isEmployer
                ? "bg-employer-700"
                : "bg-primary"
          )}
          style={isHighlighted ? { borderWidth: '3px' } : undefined}
        >
          <Icona
            className={cn(
              "w-6 h-6 transition-colors duration-300",
              isHighlighted
                ? (isEmployer ? "text-employer-800" : "text-primary-strong")
                : isEmployer
                  ? "text-employer-foreground"
                  : "text-primary-foreground"
            )}
          />
        </div>

        {/* Pointer triangle */}
        <div
          className={cn(
            "w-0 h-0 border-l-[9px] border-r-[9px] border-t-[12px] border-l-transparent border-r-transparent -mt-1 transition-all duration-300",
            isHighlighted
              ? (isEmployer ? "border-t-employer-800" : "border-t-primary-strong")
              : isEmployer
                ? "border-t-employer-700"
                : "border-t-primary"
          )}
        />
      </button>
    </Marker>
  );
});
