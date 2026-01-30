import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { SearchBar } from "@/components/map/SearchBar";
import { useUser } from "@/contexts/UserContext";
import { useMapJobs } from "@/hooks/useJobs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { isEmployer, loading: profileLoading, profile } = useUser();
  const { data: allJobs = [] } = useMapJobs();
  
  // Search and filter state (only used for Workers)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

  // Filter jobs based on search query, selected tags, and neighborhoods
  const filteredJobs = useMemo(() => {
    if (isEmployer) return allJobs; // Employers see all jobs
    
    let filtered = allJobs;
    
    // Filter by search query (title or employer name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((job) => {
        const titleMatch = job.title.toLowerCase().includes(query);
        const employerMatch = job.profiles?.full_name?.toLowerCase().includes(query) || false;
        return titleMatch || employerMatch;
      });
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((job) => {
        if (!job.tags || job.tags.length === 0) return false;
        return selectedTags.some((tag) => job.tags.includes(tag));
      });
    }

    // Filter by selected neighborhoods
    if (selectedNeighborhoods.length > 0) {
      filtered = filtered.filter((job) => {
        const jobNeighborhood = (job as { neighborhood?: string }).neighborhood;
        if (!jobNeighborhood) return false;
        return selectedNeighborhoods.includes(jobNeighborhood);
      });
    }
    
    return filtered;
  }, [allJobs, searchQuery, selectedTags, selectedNeighborhoods, isEmployer]);

  // Check if search is active (for highlighting markers)
  const isSearchActive = searchQuery.trim().length > 0 || selectedTags.length > 0 || selectedNeighborhoods.length > 0;

  // Get IDs of filtered jobs for highlighting
  const filteredJobIds = useMemo(() => {
    return new Set(filteredJobs.map((job) => job.id));
  }, [filteredJobs]);

  // BLOCKING: Show full-screen loading until profile is ready
  if (profileLoading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground font-medium">Stiamo preparando il tuo profilo...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with dynamic title and color */}
      <Header 
        title="Mappa" 
        titleColor={isEmployer ? "text-blue-600" : "text-primary"}
      />

      {/* Search Bar - Only for Workers */}
      {!isEmployer && (
        <div className="px-4 pt-2 pb-3 z-30">
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

      {/* Map Container - Takes remaining space */}
      <main className="flex-1 px-4 pb-20 overflow-hidden">
        <div className="map-container w-full h-full rounded-3xl overflow-hidden">
          <InteractiveMap 
            jobs={filteredJobs}
            allJobs={allJobs}
            isSearchActive={isSearchActive}
            filteredJobIds={filteredJobIds}
          />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
