import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { SearchBar } from "@/components/map/SearchBar";
import { useUser } from "@/contexts/UserContext";
import { useMapJobs } from "@/hooks/useJobs";
import { SwipeNavigator } from "@/components/layout/SwipeNavigator";

// Default center: Genova
const DEFAULT_CENTER = { lat: 44.4056, lng: 8.9463 };
const DEFAULT_ZOOM = 13;
const USER_LOCATION_ZOOM = 14;

const Index = () => {
  const { isEmployer, isWorker, loading: profileLoading, profile } = useUser();
  const { data: allJobs = [] } = useMapJobs();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  
  // User location state (only for Workers)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  
  // Geolocation effect - ONLY for Workers
  useEffect(() => {
    // Skip if not a worker or already requested
    if (!isWorker || locationRequested || profileLoading) return;
    
    setLocationRequested(true);
    
    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        // Silently handle errors - fallback to default Genova view
        console.log("Geolocation error (silent):", error.code);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [isWorker, locationRequested, profileLoading]);
  
  // Calculate initial map center based on role
  const mapCenter = useMemo(() => {
    if (isWorker && userLocation) {
      // Worker with location: center on user
      return userLocation;
    }
    
    if (isEmployer && profile?.lat && profile?.lng) {
      // Employer with business location: center on their activity
      return { lat: profile.lat, lng: profile.lng };
    }
    
    // Default: Genova center
    return DEFAULT_CENTER;
  }, [isWorker, isEmployer, userLocation, profile?.lat, profile?.lng]);
  
  // Calculate zoom level
  const mapZoom = useMemo(() => {
    if (isWorker && userLocation) {
      return USER_LOCATION_ZOOM;
    }
    return DEFAULT_ZOOM;
  }, [isWorker, userLocation]);

  const filteredJobs = useMemo(() => {
    if (isEmployer) return allJobs;
    
    let filtered = allJobs;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((job) => {
        const titleMatch = job.title.toLowerCase().includes(query);
        const employerMatch = job.profiles?.full_name?.toLowerCase().includes(query) || false;
        return titleMatch || employerMatch;
      });
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter((job) => {
        if (!job.tags || job.tags.length === 0) return false;
        return selectedTags.some((tag) => job.tags.includes(tag));
      });
    }

    if (selectedNeighborhoods.length > 0) {
      filtered = filtered.filter((job) => {
        const jobNeighborhood = (job as { neighborhood?: string }).neighborhood;
        if (!jobNeighborhood) return false;
        return selectedNeighborhoods.includes(jobNeighborhood);
      });
    }
    
    return filtered;
  }, [allJobs, searchQuery, selectedTags, selectedNeighborhoods, isEmployer]);

  const isSearchActive = searchQuery.trim().length > 0 || selectedTags.length > 0 || selectedNeighborhoods.length > 0;

  const filteredJobIds = useMemo(() => {
    return new Set(filteredJobs.map((job) => job.id));
  }, [filteredJobs]);

  // Loading state
  if (profileLoading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground font-medium">Stiamo preparando il tuo profilo...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
       {/* Swipe zone - only header/search area triggers navigation */}
       <SwipeNavigator zoneRestricted>
         <Header />
 
         {!isEmployer && (
           <div className="px-4 pt-2 pb-3 z-30 shrink-0">
             <SearchBar
               searchQuery={searchQuery}
               onSearchChange={setSearchQuery}
               selectedTags={selectedTags}
               onTagsChange={setSelectedTags}
               selectedNeighborhoods={selectedNeighborhoods}
               onNeighborhoodsChange={setSelectedNeighborhoods}
             />
           </div>
         )}
       </SwipeNavigator>

       {/* Map area - no swipe navigation here to allow panning */}
      <main className="flex-1 px-4 pb-2 min-h-0">
        <div className="w-full h-full rounded-3xl overflow-hidden shadow-material-lg">
          <InteractiveMap 
            jobs={filteredJobs}
            allJobs={allJobs}
            isSearchActive={isSearchActive}
            filteredJobIds={filteredJobIds}
            initialCenter={mapCenter}
            initialZoom={mapZoom}
            userLocation={isWorker ? userLocation : null}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
