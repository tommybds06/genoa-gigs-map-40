import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { SearchBar } from "@/components/map/SearchBar";
import { useUser } from "@/contexts/UserContext";
import { useMapJobs } from "@/hooks/useJobs";
 import { SwipeNavigator } from "@/components/layout/SwipeNavigator";

const Index = () => {
  const { isEmployer, loading: profileLoading, profile } = useUser();
  const { data: allJobs = [] } = useMapJobs();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

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
         <Header 
           title="Mappa" 
           titleColor={isEmployer ? "text-blue-600" : "text-primary"}
         />
 
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
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
