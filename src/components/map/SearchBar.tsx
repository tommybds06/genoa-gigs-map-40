import { useState } from "react";
import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ROLE_TAGS, TYPE_TAGS } from "@/constants/tags";
import { GENOA_NEIGHBORHOODS } from "@/constants/geofencing";
import { cn } from "@/lib/utils";
import { getTagSelectedClasses } from "@/lib/tagColors";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedNeighborhoods: string[];
  onNeighborhoodsChange: (neighborhoods: string[]) => void;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagsChange,
  selectedNeighborhoods,
  onNeighborhoodsChange,
}: SearchBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const toggleNeighborhood = (neighborhood: string) => {
    if (selectedNeighborhoods.includes(neighborhood)) {
      onNeighborhoodsChange(selectedNeighborhoods.filter((n) => n !== neighborhood));
    } else {
      onNeighborhoodsChange([...selectedNeighborhoods, neighborhood]);
    }
  };

  const clearFilters = () => {
    onTagsChange([]);
    onNeighborhoodsChange([]);
  };

  const activeFiltersCount = selectedTags.length + selectedNeighborhoods.length;

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cerca impiego..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-8 bg-background shadow-md border-0 rounded-full h-10"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Button with Popover */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "relative rounded-full h-10 w-10 shadow-md border-0",
              activeFiltersCount > 0
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-background hover:bg-accent"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-4 bg-background border shadow-lg z-50" 
          align="end"
          sideOffset={8}
        >
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Filtri</h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancella tutti
                  </button>
                )}
              </div>

              {/* Role Tags */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Ruoli</h4>
                <div className="flex flex-wrap gap-2">
                  {ROLE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                          getTagSelectedClasses(tag, isSelected)
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type Tags */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Modalità</h4>
                <div className="flex flex-wrap gap-2">
                  {TYPE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                          getTagSelectedClasses(tag, isSelected)
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Neighborhoods */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Quartiere
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                  {GENOA_NEIGHBORHOODS.map((neighborhood) => {
                    const isSelected = selectedNeighborhoods.includes(neighborhood);
                    return (
                      <button
                        key={neighborhood}
                        onClick={() => toggleNeighborhood(neighborhood)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {neighborhood}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
