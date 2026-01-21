import { useState, useCallback, useEffect } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import { GraduationCap, Briefcase, Clock, ChevronRight, Bike, Utensils, Sparkles, Laptop, Palette, PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JobDetailsSheet } from "./JobDetailsSheet";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { isRoleTag } from "@/constants/tags";
import "mapbox-gl/dist/mapbox-gl.css";

// Profile type from join
interface JobProfile {
  full_name: string | null;
  avatar_url: string | null;
  address_text: string | null;
}

// Job type from database
interface Job {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  category: string | null;
  tags: string[] | null;
  lat: number;
  lng: number;
  owner_id: string;
  status: string;
  schedule?: string | null;
  profiles?: JobProfile | null;
}

// Helper function to get icon based on job tags
const getIconFromTags = (tags: string[] | null): typeof Briefcase => {
  if (!tags || tags.length === 0) return Briefcase;
  
  const tagsLower = tags.map(t => t.toLowerCase());
  
  // Check for specific tag matches
  if (tagsLower.some(t => t.includes('rider') || t.includes('consegn'))) return Bike;
  if (tagsLower.some(t => t.includes('cameriere') || t.includes('bar') || t.includes('cassa'))) return Utensils;
  if (tagsLower.some(t => t.includes('ripetizioni') || t.includes('studio'))) return GraduationCap;
  if (tagsLower.some(t => t.includes('pulizie'))) return Sparkles;
  if (tagsLower.some(t => t.includes('grafico') || t.includes('design'))) return Palette;
  if (tagsLower.some(t => t.includes('tech') || t.includes('software') || t.includes('social'))) return Laptop;
  if (tagsLower.some(t => t.includes('staff') || t.includes('event'))) return PartyPopper;
  
  return Briefcase; // Default
};

export function InteractiveMap() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [lastSelectedJob, setLastSelectedJob] = useState<Job | null>(null);
  const { isEmployer } = useUser();
  const { theme } = useAppTheme();

  // Dynamic marker colors based on role
  const markerBgClass = isEmployer ? "bg-blue-600" : "bg-primary";
  const markerPointerClass = isEmployer ? "border-t-blue-600" : "border-t-primary";

  // Fetch jobs from database (only last 48 hours)
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Calculate 48 hours ago
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
          .from('jobs')
          .select('*, profiles(full_name, avatar_url, address_text)')
          .eq('status', 'open')
          .gte('created_at', fortyEightHoursAgo);

        if (error) throw error;

        // Filter jobs with valid coordinates
        const validJobs = (data || []).filter(job => 
          job.lat != null && job.lng != null && 
          job.lat !== 0 && job.lng !== 0
        );

        console.log("Totale Jobs:", data?.length || 0, "Jobs Validi:", validJobs.length);
        setJobs(validJobs as Job[]);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setMapboxToken(""); // Empty string means failed
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
        setMapboxToken(""); // Empty string means failed
      }
    };
    
    fetchMapboxToken();
  }, []);

  // Store the last selected job for the drawer
  useEffect(() => {
    if (selectedJob) {
      setLastSelectedJob(selectedJob);
    }
  }, [selectedJob]);

  const handleMarkerClick = useCallback((job: Job) => {
    setSelectedJob(job);
  }, []);

  const handlePopupClick = useCallback(() => {
    setSelectedJob(null); // Close popup first
    setIsDetailsOpen(true); // Then open drawer
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedJob(null);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
  }, []);

  // Dynamic loading colors
  const loadingBgClass = isEmployer ? "bg-blue-600/20" : "bg-primary/20";
  const loadingIconClass = isEmployer ? "text-blue-600" : "text-primary";

  // Show loading state while fetching token
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

  // Fallback if token failed to load
  if (mapboxToken === "") {
    return <MapFallback 
      jobs={jobs} 
      markerBgClass={markerBgClass}
      markerPointerClass={markerPointerClass}
      onJobSelect={(job) => {
        setSelectedJob(job);
        setIsDetailsOpen(true);
      }} 
    />;
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

        {jobs.map((job) => {
          // Use dynamic icon based on tags
          const Icon = getIconFromTags(job.tags);

          return (
            <Marker
              key={job.id}
              longitude={job.lng}
              latitude={job.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(job);
              }}
            >
              <button className="group flex flex-col items-center hover:scale-110 transition-transform cursor-pointer">
                {/* Pin body */}
                <div className={`w-10 h-10 ${markerBgClass} rounded-full flex items-center justify-center shadow-material-md relative`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {/* Pin pointer */}
                <div className={`w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent ${markerPointerClass} -mt-1`} />
              </button>
            </Marker>
          );
        })}

        {selectedJob && (
          <Popup
            longitude={selectedJob.lng}
            latitude={selectedJob.lat}
            anchor="bottom"
            onClose={() => setSelectedJob(null)}
            closeButton={false}
            closeOnClick={false}
            offset={20}
            className="job-popup"
          >
            <div
              className="p-3 cursor-pointer min-w-[200px]"
              onClick={handlePopupClick}
            >
              <h3 className="font-bold text-foreground text-sm mb-2">
                {selectedJob.title}
              </h3>
              
              {selectedJob.price && (
                <Badge className={`${theme.btnFilled} font-semibold text-xs px-2 py-1 rounded-full`}>
                  {selectedJob.price}
                </Badge>
              )}
              
              {/* Colored Tags */}
              {selectedJob.tags && selectedJob.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedJob.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isRoleTag(tag)
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {selectedJob.schedule && (
                <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{selectedJob.schedule}</span>
                </div>
              )}
              
              <div className={`flex items-center justify-end mt-2 ${theme.primaryText} font-medium text-xs`}>
                Vedi dettagli
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </Popup>
        )}

        {/* Location Label Card */}
        <div className="absolute bottom-4 left-4 material-card px-4 py-3">
          <p className="text-sm font-semibold">📍 Genova Centro</p>
          <p className="text-xs text-muted-foreground">{jobs.length} impieghi disponibili</p>
        </div>

      </Map>

      <JobDetailsSheet
        job={lastSelectedJob}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    </>
  );
}

// Fallback component when Mapbox token is not available
function MapFallback({ 
  jobs, 
  markerBgClass, 
  markerPointerClass, 
  onJobSelect 
}: { 
  jobs: Job[]; 
  markerBgClass: string;
  markerPointerClass: string;
  onJobSelect: (job: Job) => void;
}) {
  return (
    <div className="relative w-full h-full bg-muted overflow-hidden rounded-3xl">
      {/* Stylized map background */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-blue-100/60" />
        
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 70 Q20 60 40 65 T80 55 T100 60" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" opacity="0.2" />
          <path d="M0 50 Q30 40 50 45 T90 35 T100 40" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" opacity="0.2" />
          <path d="M0 30 Q25 20 45 25 T85 15 T100 20" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" opacity="0.2" />
          <path d="M10 90 L30 50 L60 40 L90 20" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.15" />
          <path d="M0 60 L40 55 L100 50" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.15" />
        </svg>

        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Job Markers */}
      {jobs.map((job, index) => {
        // Use dynamic icon based on tags
        const Icon = getIconFromTags(job.tags);
        const positions = [
          { top: "25%", left: "30%" },
          { top: "45%", left: "60%" },
          { top: "60%", left: "25%" },
          { top: "35%", left: "70%" },
          { top: "70%", left: "55%" },
          { top: "20%", left: "50%" },
        ];
        const pos = positions[index % positions.length];

        return (
          <button
            key={job.id}
            className="absolute transform -translate-x-1/2 -translate-y-full flex flex-col items-center hover:scale-110 transition-transform cursor-pointer"
            style={{ top: pos.top, left: pos.left }}
            onClick={() => onJobSelect(job)}
          >
            {/* Pin body */}
            <div className={`w-10 h-10 ${markerBgClass} rounded-full flex items-center justify-center shadow-material-md`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            {/* Pin pointer */}
            <div className={`w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent ${markerPointerClass} -mt-1`} />
          </button>
        );
      })}

      {/* Center Location Marker */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="w-4 h-4 bg-blue-500 rounded-full shadow-material-lg" />
          <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-pulse-soft" />
        </div>
      </div>

      {/* Location Label Card */}
      <div className="absolute bottom-4 left-4 material-card px-4 py-3">
        <p className="text-sm font-semibold">📍 Genova Centro</p>
        <p className="text-xs text-muted-foreground">{jobs.length} impieghi disponibili</p>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button className="w-10 h-10 material-card flex items-center justify-center text-lg font-medium hover:bg-muted transition-colors">
          +
        </button>
        <button className="w-10 h-10 material-card flex items-center justify-center text-lg font-medium hover:bg-muted transition-colors">
          −
        </button>
      </div>

    </div>
  );
}
