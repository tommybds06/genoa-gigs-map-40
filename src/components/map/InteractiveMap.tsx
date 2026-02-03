import { memo, useState, useCallback, useEffect, useMemo } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JobDetailsSheet } from "./JobDetailsSheet";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { getTagClasses } from "@/lib/tagColors";
import { Job } from "@/hooks/useJobs";
import { cn } from "@/lib/utils";
import "mapbox-gl/dist/mapbox-gl.css";

interface InteractiveMapProps {
  jobs?: Job[];
  allJobs?: Job[];
  isSearchActive?: boolean;
  filteredJobIds?: Set<string>;
}

// Memoized marker component to prevent re-renders
const JobMarker = memo(function JobMarker({ 
  job, 
  isHighlighted, 
  isDimmed, 
  isEmployer,
  isSearchActive,
  onMarkerClick 
}: { 
  job: Job; 
  isHighlighted: boolean;
  isDimmed: boolean;
  isEmployer: boolean;
  isSearchActive: boolean;
  onMarkerClick: (job: Job) => void;
}) {
  const Icon = getJobIconFromTags(job.tags);
  
  return (
    <Marker
      key={job.id}
      longitude={job.lng!}
      latitude={job.lat!}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onMarkerClick(job);
      }}
    >
      <button 
        className={cn(
          "group flex flex-col items-center cursor-pointer transition-all duration-300 ease-out touch-feedback",
          isHighlighted && "scale-125 z-10",
          isDimmed && "opacity-30 scale-90",
          !isSearchActive && "hover:scale-110"
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shadow-material-md relative transition-all duration-300",
            isHighlighted 
              ? "bg-white border-3 border-primary" 
              : isEmployer 
                ? "bg-blue-600" 
                : "bg-primary"
          )}
          style={isHighlighted ? { borderWidth: '3px' } : undefined}
        >
          <Icon 
            className={cn(
              "w-5 h-5 transition-colors duration-300",
              isHighlighted ? "text-primary" : "text-white"
            )} 
          />
        </div>
        <div
          className={cn(
            "w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent -mt-1 transition-all duration-300",
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

function InteractiveMapInner({ 
  jobs: externalJobs = [], 
  allJobs: externalAllJobs = [],
  isSearchActive = false,
  filteredJobIds = new Set()
}: InteractiveMapProps) {
  const jobs = externalJobs;
  const allJobs = externalAllJobs.length > 0 ? externalAllJobs : externalJobs;
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [lastSelectedJob, setLastSelectedJob] = useState<Job | null>(null);
  const { isEmployer } = useUser();
  const { theme } = useAppTheme();

  // Fetch Mapbox token - only once
  useEffect(() => {
    let isMounted = true;
    
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (!isMounted) return;
        if (error) throw error;
        setMapboxToken(data?.token || "");
      } catch (err) {
        console.error("Failed to fetch Mapbox token:", err);
        if (isMounted) setMapboxToken("");
      }
    };

    fetchMapboxToken();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (selectedJob) {
      setLastSelectedJob(selectedJob);
    }
  }, [selectedJob]);

  const handleMarkerClick = useCallback((job: Job) => {
    setSelectedJob(job);
  }, []);

  const handlePopupClick = useCallback(() => {
    setSelectedJob(null);
    setIsDetailsOpen(true);
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedJob(null);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
  }, []);

  // Memoize stable IDs for dependency comparison
  const filteredIdsString = useMemo(() => Array.from(filteredJobIds).sort().join(','), [filteredJobIds]);

  // Memoize markers
  const markers = useMemo(() => {
    const jobsToRender = isSearchActive ? allJobs : jobs;
    
    return jobsToRender.map((job) => (
      <JobMarker
        key={job.id}
        job={job}
        isHighlighted={isSearchActive && filteredJobIds.has(job.id)}
        isDimmed={isSearchActive && !filteredJobIds.has(job.id)}
        isEmployer={isEmployer}
        isSearchActive={isSearchActive}
        onMarkerClick={handleMarkerClick}
      />
    ));
  }, [jobs, allJobs, isSearchActive, filteredIdsString, isEmployer, handleMarkerClick]);

  const loadingBgClass = isEmployer ? "bg-blue-600/20" : "bg-primary/20";
  const loadingIconClass = isEmployer ? "text-blue-600" : "text-primary";

  if (mapboxToken === null) {
    return (
      <div className="relative w-full h-full bg-muted overflow-hidden rounded-3xl flex items-center justify-center">
        <div className="text-center p-6">
          <div className={`w-12 h-12 ${loadingBgClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Clock className={`w-6 h-6 ${loadingIconClass} animate-pulse`} />
          </div>
          <p className="text-muted-foreground">Caricamento mappa...</p>
        </div>
      </div>
    );
  }

  if (mapboxToken === "") {
    return <MapFallback jobs={jobs} isEmployer={isEmployer} />;
  }

  return (
    <>
      <Map
        initialViewState={{
          longitude: 8.9463,
          latitude: 44.4056,
          zoom: 13,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        onClick={handleMapClick}
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} />
        {markers}

        {selectedJob && (
          <Popup
            longitude={selectedJob.lng!}
            latitude={selectedJob.lat!}
            anchor="bottom"
            onClose={() => setSelectedJob(null)}
            closeButton={false}
            closeOnClick={false}
            offset={20}
            className="job-popup"
          >
            <div
              className="p-3 cursor-pointer flex flex-col items-start max-w-[250px] touch-feedback"
              onClick={handlePopupClick}
            >
              <h3 className="font-bold text-foreground text-sm whitespace-normal leading-tight mb-2">
                {selectedJob.title}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                {selectedJob.price && (
                  <Badge className={`${theme.btnFilled} font-semibold text-xs px-2 py-0.5 rounded-full shrink-0`}>
                    {selectedJob.price}
                  </Badge>
                )}
                {selectedJob.schedule && (
                  <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{selectedJob.schedule}</span>
                  </div>
                )}
              </div>
              {selectedJob.tags && selectedJob.tags.filter((tag) => tag.toLowerCase() !== "altro").length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedJob.tags.filter((tag) => tag.toLowerCase() !== "altro").map((tag) => (
                    <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTagClasses(tag)}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Popup>
        )}

        <div className="absolute bottom-4 left-4 material-card px-4 py-3">
          <p className="text-sm font-semibold">📍 Genova Centro</p>
          <p className="text-xs text-muted-foreground">
            {isSearchActive ? `${jobs.length} risultati trovati` : `${jobs.length} impieghi disponibili`}
          </p>
        </div>
      </Map>

      <JobDetailsSheet job={lastSelectedJob} isOpen={isDetailsOpen} onClose={handleCloseDetails} />
    </>
  );
}

// Simple fallback when no token
function MapFallback({ jobs, isEmployer }: { jobs: Job[]; isEmployer: boolean }) {
  return (
    <div className="relative w-full h-full bg-muted overflow-hidden rounded-3xl flex items-center justify-center">
      <div className="text-center p-6">
        <p className="text-muted-foreground">Mappa non disponibile</p>
        <p className="text-xs text-muted-foreground mt-1">{jobs.length} impieghi disponibili</p>
      </div>
    </div>
  );
}

// Export memoized component to prevent parent re-renders from causing map re-renders
export const InteractiveMap = memo(InteractiveMapInner);
