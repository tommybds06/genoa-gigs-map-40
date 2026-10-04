import { memo, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Map, { Marker, MapRef } from "react-map-gl";
import { Clock } from "lucide-react";
import { JobDetailsSheet } from "./JobDetailsSheet";
import { EmployerGroupMarker } from "./EmployerGroupMarker";
import { EmployerJobsDrawer } from "./EmployerJobsDrawer";
import { UserLocationMarker } from "./UserLocationMarker";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useUser } from "@/contexts/UserContext";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { groupJobsByEmployer, EmployerGroup } from "@/lib/groupJobsByEmployer";
import { Job } from "@/hooks/useJobs";
import { cn } from "@/lib/utils";
import "mapbox-gl/dist/mapbox-gl.css";

interface InteractiveMapProps {
  jobs?: Job[];
  allJobs?: Job[];
  isSearchActive?: boolean;
  filteredJobIds?: Set<string>;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  userLocation?: { lat: number; lng: number } | null;
}

// Memoized single job marker component
const SingleJobMarker = memo(function SingleJobMarker({ 
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
            "w-12 h-12 rounded-full flex items-center justify-center shadow-material-md relative transition-all duration-300",
            isHighlighted
              ? cn("bg-card border-3", isEmployer ? "border-employer-800" : "border-primary-strong")
              : isEmployer
                ? "bg-employer-700"
                : "bg-primary"
          )}
          style={isHighlighted ? { borderWidth: '3px' } : undefined}
        >
          {/* ⚠️ `text-primary-foreground` e' l'INK: giusto sull'arancio (6,45),
              nero su nero sul blu scuro. Stesso inciampo dell'icona mail in
              Impostazioni: il fondo seguiva il ruolo, il testo no.
              ⚠️ Lo stato EVIDENZIATO aveva lo stesso difetto al contrario: un
              tratto da 3px e un'icona in `primary` — l'arancio pastello — su
              `bg-card`, cioe' 1,9:1, e per giunta arancione anche in un'app
              blu. Sui fondi chiari vanno gli inchiostri. */}
          <Icon
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
        <div
          className={cn(
            // la punta prendeva il blu PASTELLO mentre il cerchio sopra era
            // employer-700: due blu diversi nello stesso pin
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

function InteractiveMapInner({ 
  jobs: externalJobs = [], 
  allJobs: externalAllJobs = [],
  isSearchActive = false,
  filteredJobIds = new Set(),
  initialCenter = { lat: 44.4056, lng: 8.9463 },
  initialZoom = 13,
  userLocation = null
}: InteractiveMapProps) {
  const jobs = externalJobs;
  const allJobs = externalAllJobs.length > 0 ? externalAllJobs : externalJobs;
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  /* Il token arriva dalla cache condivisa: vedi hooks/useMapboxToken.ts. */
  const mapboxToken = useMapboxToken();
  const [lastSelectedJob, setLastSelectedJob] = useState<Job | null>(null);
  
  // Employer group drawer state
  const [selectedEmployerJobs, setSelectedEmployerJobs] = useState<Job[]>([]);
  const [isEmployerDrawerOpen, setIsEmployerDrawerOpen] = useState(false);
  
  const { isEmployer } = useUser();
  const location = useLocation();
  const mapNavigate = useNavigate();

  // Reopen sheet when returning from employer profile
  const didRestoreJob = useRef(false);
  const mappaRef = useRef<MapRef>(null);
  const giaCentrata = useRef(false);

  /**
   * ⚠️ `initialViewState` vale SOLO al primo montaggio. La posizione del
   * telefono arriva dopo — il browser deve chiedere il permesso e leggere il
   * GPS, cioe' da mezzo secondo a diversi secondi — e a quel punto la mappa e'
   * gia' disegnata su Genova. Per questo spesso non eri centrato dov'eri:
   * il dato arrivava, ma nessuno spostava piu' la mappa.
   *
   * `giaCentrata` fa avvenire lo spostamento UNA VOLTA sola: se l'utente ha
   * gia' trascinato la mappa per guardare un'altra zona, un secondo
   * aggiornamento del GPS non deve riportarlo indietro sotto le dita.
   */
  useEffect(() => {
    if (!userLocation || giaCentrata.current) return;
    const map = mappaRef.current;
    if (!map) return;
    giaCentrata.current = true;
    map.easeTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      duration: 900,
    });
  }, [userLocation]);
  useEffect(() => {
    if (didRestoreJob.current) return;
    const returnJob = location.state?.returnJob as Job | undefined;
    if (returnJob) {
      didRestoreJob.current = true;
      setLastSelectedJob(returnJob);
      setIsDetailsOpen(true);
      mapNavigate(location.pathname, { replace: true, state: null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Group jobs by employer
  const employerGroups = useMemo(() => {
    const jobsToGroup = isSearchActive ? allJobs : jobs;
    return groupJobsByEmployer(jobsToGroup);
  }, [jobs, allJobs, isSearchActive]);

  // For search filtering, we need to know which groups have filtered jobs
  const filteredIdsString = useMemo(() => Array.from(filteredJobIds).sort().join(','), [filteredJobIds]);

  /**
   * ⚠️ NIENTE NUVOLETTA. C'era un `Popup` di Mapbox che mostrava titolo, paga,
   * orario e tag; toccandolo si apriva la scheda, che mostra le stesse cose
   * PIU' employer, descrizione e mappa. Era l'anteprima di una cosa che stava a
   * un tocco di distanza: due tocchi per lo stesso contenuto, e un elemento in
   * piu' da mantenere e da disegnare.
   *
   * Ora il pin apre direttamente la scheda, che si ferma bassa (vedi i punti di
   * aggancio in JobDetailsSheet): la mappa resta visibile sopra, il pin non
   * viene coperto, e per il resto si trascina in su. E' il comportamento di
   * Apple Maps e Google Maps.
   */
  const apriScheda = useCallback((job: Job) => {
    setLastSelectedJob(job);
    setIsDetailsOpen(true);
  }, []);

  const handleSingleJobClick = useCallback((job: Job) => {
    apriScheda(job);
  }, [apriScheda]);

  const handleGroupMarkerClick = useCallback((employerId: string, employerJobs: Job[]) => {
    if (employerJobs.length === 1) {
      apriScheda(employerJobs[0]);
    } else {
      // Multiple jobs - open employer drawer
      setSelectedEmployerJobs(employerJobs);
      setIsEmployerDrawerOpen(true);
    }
  }, [apriScheda]);

  const handleJobSelectFromDrawer = useCallback((job: Job) => {
    setLastSelectedJob(job);
    setIsDetailsOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
  }, []);

  const handleCloseEmployerDrawer = useCallback(() => {
    setIsEmployerDrawerOpen(false);
    setSelectedEmployerJobs([]);
  }, []);

  // Render markers based on employer groups
  const markers = useMemo(() => {
    return employerGroups.map((group) => {
      const hasFilteredJobs = isSearchActive 
        ? group.jobs.some(job => filteredJobIds.has(job.id))
        : true;
      
      const isDimmed = isSearchActive && !hasFilteredJobs;
      const isHighlighted = isSearchActive && hasFilteredJobs;

      if (group.jobs.length === 1) {
        // Single job - use standard marker
        const job = group.jobs[0];
        return (
          <SingleJobMarker
            key={job.id}
            job={job}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            isEmployer={isEmployer}
            isSearchActive={isSearchActive}
            onMarkerClick={handleSingleJobClick}
          />
        );
      } else {
        // Multiple jobs - use employer group marker with search/filter support
        return (
          <EmployerGroupMarker
            key={group.employerId}
            employerId={group.employerId}
            jobs={group.jobs}
            lat={group.lat}
            lng={group.lng}
            isEmployer={isEmployer}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            isSearchActive={isSearchActive}
            onMarkerClick={handleGroupMarkerClick}
          />
        );
      }
    });
  }, [employerGroups, isSearchActive, filteredIdsString, isEmployer, handleSingleJobClick, handleGroupMarkerClick]);

  const loadingBgClass = isEmployer ? "bg-employer/20" : "bg-primary/20";
  const loadingIconClass = isEmployer ? "text-employer" : "text-primary";

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
        ref={mappaRef}
        initialViewState={{
          longitude: initialCenter.lng,
          latitude: initialCenter.lat,
          zoom: initialZoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        reuseMaps
      >
        {/* Niente NavigationControl: su mobile lo zoom si fa con le dita, e i
            quadratini bianchi di serie di Mapbox erano l'unico elemento di UI
            in tutta l'app a non essere nostro. */}

        {/* User location marker (Worker only) */}
        {userLocation && (
          <UserLocationMarker
            latitude={userLocation.lat}
            longitude={userLocation.lng}
          />
        )}
        
        {markers}
      </Map>

      {/* Single Job Details Sheet */}
      <JobDetailsSheet job={lastSelectedJob} isOpen={isDetailsOpen} onClose={handleCloseDetails} />
      
      {/* Employer Jobs Selection Drawer */}
      <EmployerJobsDrawer
        isOpen={isEmployerDrawerOpen}
        onClose={handleCloseEmployerDrawer}
        jobs={selectedEmployerJobs}
        onJobSelect={handleJobSelectFromDrawer}
      />
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
