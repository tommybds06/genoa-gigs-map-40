import { useState, useCallback, useEffect } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import { GraduationCap, Truck, PartyPopper, Briefcase, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JobDetailsSheet } from "./JobDetailsSheet";
import { supabase } from "@/integrations/supabase/client";
import "mapbox-gl/dist/mapbox-gl.css";

// Sample job data for Genova
const sampleJobs = [
  {
    id: "1",
    title: "Ripetizioni Matematica",
    description: "Cerco studente universitario per ripetizioni di matematica a mio figlio (3° media). Preferibilmente con esperienza didattica. Le lezioni si terranno a casa nostra in zona Castelletto.",
    price: "15€/h",
    category: "tutoring",
    schedule: "Lun-Ven 15:00-18:00",
    lat: 44.4110,
    lng: 8.9340,
    owner: {
      name: "Maria Rossi",
      avatar: null,
      rating: 4.8,
      reviewCount: 12
    }
  },
  {
    id: "2",
    title: "Consegne Pranzo Centro",
    description: "Ristorante in centro cerca rider per consegne pranzo. Orario flessibile, pagamento giornaliero. Necessario mezzo proprio (bici o scooter).",
    price: "8€/consegna",
    category: "delivery",
    schedule: "Lun-Sab 11:30-14:30",
    lat: 44.4070,
    lng: 8.9320,
    owner: {
      name: "Trattoria Da Luigi",
      avatar: null,
      rating: 4.5,
      reviewCount: 28
    }
  },
  {
    id: "3",
    title: "Staff Evento Laurea",
    description: "Cerchiamo 3 persone per servizio cameriere/a alla festa di laurea. Esperienza preferibile ma non necessaria. Divisa fornita.",
    price: "50€",
    category: "event",
    schedule: "Sab 18:00-24:00",
    lat: 44.4045,
    lng: 8.9450,
    owner: {
      name: "Eventi Genova",
      avatar: null,
      rating: 4.9,
      reviewCount: 45
    }
  },
  {
    id: "4",
    title: "Aiuto Trasloco",
    description: "Cerco 2 persone robuste per aiutarmi con un piccolo trasloco. Solo scatoloni e mobili leggeri, furgone già organizzato.",
    price: "80€",
    category: "general",
    schedule: "Dom 09:00-13:00",
    lat: 44.4150,
    lng: 8.9480,
    owner: {
      name: "Paolo Bianchi",
      avatar: null,
      rating: 4.3,
      reviewCount: 5
    }
  },
  {
    id: "5",
    title: "Lezioni Inglese B2",
    description: "Offro lezioni di conversazione inglese livello B2/C1. Sono madrelingua UK con certificazione TEFL. Lezioni in presenza o online.",
    price: "20€/h",
    category: "tutoring",
    schedule: "Flessibile",
    lat: 44.4020,
    lng: 8.9280,
    owner: {
      name: "Sarah Johnson",
      avatar: null,
      rating: 5.0,
      reviewCount: 18
    }
  },
  {
    id: "6",
    title: "Rider Serale Pizzeria",
    description: "Pizzeria zona Foce cerca rider per consegne serali. Compenso a consegna + mance. Richiesta puntualità e affidabilità.",
    price: "6€/consegna",
    category: "delivery",
    schedule: "Ven-Dom 19:00-23:00",
    lat: 44.3980,
    lng: 8.9400,
    owner: {
      name: "Pizza Express",
      avatar: null,
      rating: 4.6,
      reviewCount: 32
    }
  },
];

const categoryIcons: Record<string, typeof GraduationCap> = {
  tutoring: GraduationCap,
  delivery: Truck,
  event: PartyPopper,
  general: Briefcase,
};

const categoryColors: Record<string, string> = {
  tutoring: "bg-blue-500",
  delivery: "bg-green-500",
  event: "bg-purple-500",
  general: "bg-secondary",
};

type Job = typeof sampleJobs[0];

export function InteractiveMap() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
      }
    };
    
    fetchMapboxToken();
  }, []);

  const handleMarkerClick = useCallback((job: Job) => {
    setSelectedJob(job);
  }, []);

  const handlePopupClick = useCallback(() => {
    setIsDetailsOpen(true);
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedJob(null);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
  }, []);

  // Fallback to static placeholder if no token
  if (!mapboxToken) {
    return <MapFallback jobs={sampleJobs} onJobSelect={(job) => {
      setSelectedJob(job);
      setIsDetailsOpen(true);
    }} />;
  }

  return (
    <>
      <Map
        initialViewState={{
          longitude: 8.9340,
          latitude: 44.4070,
          zoom: 13.5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={mapboxToken}
        onClick={handleMapClick}
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} />

        {sampleJobs.map((job) => {
          const Icon = categoryIcons[job.category] || Briefcase;
          const bgColor = categoryColors[job.category] || "bg-secondary";

          return (
            <Marker
              key={job.id}
              longitude={job.lng}
              latitude={job.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(job);
              }}
            >
              <button
                className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center shadow-material-md hover:scale-110 transition-transform cursor-pointer`}
              >
                <Icon className="w-5 h-5 text-white" />
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
              
              <Badge className="bg-primary text-primary-foreground font-semibold text-xs px-2 py-1 rounded-full">
                {selectedJob.price}
              </Badge>
              
              <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{selectedJob.schedule}</span>
              </div>
              
              <div className="flex items-center justify-end mt-2 text-secondary font-medium text-xs">
                Vedi dettagli
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </Popup>
        )}

        {/* Location Label Card */}
        <div className="absolute bottom-4 left-4 material-card px-4 py-3">
          <p className="text-sm font-semibold">📍 Genova Centro</p>
          <p className="text-xs text-muted-foreground">{sampleJobs.length} impieghi disponibili</p>
        </div>

        {/* Map-First Chip */}
        <div className="absolute top-4 left-4 material-chip-selected">
          <span className="text-xs font-semibold">🗺️ Map-First</span>
        </div>
      </Map>

      <JobDetailsSheet
        job={selectedJob}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    </>
  );
}

// Fallback component when Mapbox token is not available
function MapFallback({ jobs, onJobSelect }: { jobs: Job[]; onJobSelect: (job: Job) => void }) {
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
        const Icon = categoryIcons[job.category] || Briefcase;
        const bgColor = categoryColors[job.category] || "bg-secondary";
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
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 ${bgColor} rounded-full flex items-center justify-center shadow-material-md hover:scale-110 transition-transform cursor-pointer`}
            style={{ top: pos.top, left: pos.left }}
            onClick={() => onJobSelect(job)}
          >
            <Icon className="w-5 h-5 text-white" />
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

      {/* Map-First Chip */}
      <div className="absolute top-4 left-4 material-chip-selected">
        <span className="text-xs font-semibold">🗺️ Map-First</span>
      </div>
    </div>
  );
}
