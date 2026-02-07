import { memo } from "react";
import { Marker } from "react-map-gl";
import { Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Job } from "@/hooks/useJobs";

interface EmployerGroupMarkerProps {
  employerId: string;
  jobs: Job[];
  lat: number;
  lng: number;
  isEmployer: boolean;
  onMarkerClick: (employerId: string, jobs: Job[]) => void;
}

export const EmployerGroupMarker = memo(function EmployerGroupMarker({
  employerId,
  jobs,
  lat,
  lng,
  isEmployer,
  onMarkerClick,
}: EmployerGroupMarkerProps) {
  const firstJob = jobs[0];
  const count = jobs.length;
  
  // Get employer avatar from first job's profile
  const photos = firstJob.profiles?.photos;
  const avatarUrl = photos && photos.length > 0 
    ? photos[0] 
    : firstJob.profiles?.avatar_url || null;
  const employerName = firstJob.profiles?.full_name || "Employer";
  const initials = employerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

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
      <button className="group flex flex-col items-center cursor-pointer transition-all duration-300 ease-out hover:scale-110 touch-feedback relative">
        {/* Badge counter */}
        <div className="absolute -top-1 -right-1 z-10 min-w-[22px] h-[22px] bg-red-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
          <span className="text-white text-xs font-bold px-1">{count}</span>
        </div>
        
        {/* Main marker with avatar */}
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shadow-material-md relative overflow-hidden border-3",
            isEmployer 
              ? "border-blue-600 bg-blue-50" 
              : "border-primary bg-accent"
          )}
        >
          {avatarUrl ? (
            <Avatar className="w-full h-full">
              <AvatarImage src={avatarUrl} alt={employerName} className="object-cover" />
              <AvatarFallback className={cn(
                "font-bold text-sm",
                isEmployer ? "bg-blue-100 text-blue-700" : "bg-accent text-primary"
              )}>
                {initials}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Building2 
              className={cn(
                "w-6 h-6",
                isEmployer ? "text-blue-600" : "text-primary"
              )} 
            />
          )}
        </div>
        
        {/* Pointer triangle */}
        <div
          className={cn(
            "w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-l-transparent border-r-transparent -mt-1",
            isEmployer 
              ? "border-t-blue-600" 
              : "border-t-primary"
          )}
        />
      </button>
    </Marker>
  );
});
