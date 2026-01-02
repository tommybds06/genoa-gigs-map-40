import { MapPin, Briefcase, GraduationCap, Truck, PartyPopper } from "lucide-react";

// Sample job markers for visualization
const sampleJobs = [
  { id: 1, type: "tutoring", position: { top: "25%", left: "30%" }, icon: GraduationCap },
  { id: 2, type: "delivery", position: { top: "45%", left: "60%" }, icon: Truck },
  { id: 3, type: "event", position: { top: "60%", left: "25%" }, icon: PartyPopper },
  { id: 4, type: "general", position: { top: "35%", left: "70%" }, icon: Briefcase },
  { id: 5, type: "tutoring", position: { top: "70%", left: "55%" }, icon: GraduationCap },
  { id: 6, type: "delivery", position: { top: "20%", left: "50%" }, icon: Truck },
];

export function MapPlaceholder() {
  return (
    <div className="relative w-full h-full bg-muted overflow-hidden rounded-3xl">
      {/* Stylized map background - representing Genova's terrain */}
      <div className="absolute inset-0">
        {/* Water/Sea */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-blue-100/60" />
        
        {/* Hills/Terrain Lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Terrain contour lines */}
          <path
            d="M0 70 Q20 60 40 65 T80 55 T100 60"
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="0.2"
            opacity="0.2"
          />
          <path
            d="M0 50 Q30 40 50 45 T90 35 T100 40"
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="0.2"
            opacity="0.2"
          />
          <path
            d="M0 30 Q25 20 45 25 T85 15 T100 20"
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="0.2"
            opacity="0.2"
          />
          
          {/* Roads */}
          <path
            d="M10 90 L30 50 L60 40 L90 20"
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="0.4"
            opacity="0.15"
          />
          <path
            d="M0 60 L40 55 L100 50"
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="0.4"
            opacity="0.15"
          />
        </svg>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Job Markers */}
      {sampleJobs.map((job) => {
        const Icon = job.icon;
        return (
          <button
            key={job.id}
            className="job-marker absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ top: job.position.top, left: job.position.left }}
          >
            <Icon className="w-5 h-5" />
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
        <p className="text-xs text-muted-foreground">6 lavoretti disponibili</p>
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
