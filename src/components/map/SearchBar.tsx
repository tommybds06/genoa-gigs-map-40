import { useState } from "react";
import { Search, SlidersHorizontal, X, MapPin, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DiamondButton } from "@/components/ui/DiamondButton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ROLE_TAGS, TYPE_TAGS } from "@/constants/tags";
import { GENOA_NEIGHBORHOODS } from "@/constants/geofencing";
import { cn } from "@/lib/utils";
import { getTagSelectedClasses } from "@/lib/tagColors";

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
  
  // Temporary state for filters (applied only on "Applica")
  const [tempSelectedTags, setTempSelectedTags] = useState<string[]>(selectedTags);
  const [tempSelectedNeighborhoods, setTempSelectedNeighborhoods] = useState<string[]>(selectedNeighborhoods);

  const openFilters = () => {
    // Sync temp state with current filters when opening
    setTempSelectedTags(selectedTags);
    setTempSelectedNeighborhoods(selectedNeighborhoods);
    setIsFilterOpen(true);
  };

  const toggleTempTag = (tag: string) => {
    if (tempSelectedTags.includes(tag)) {
      setTempSelectedTags(tempSelectedTags.filter((t) => t !== tag));
    } else {
      setTempSelectedTags([...tempSelectedTags, tag]);
    }
  };

  const toggleTempNeighborhood = (neighborhood: string) => {
    if (tempSelectedNeighborhoods.includes(neighborhood)) {
      setTempSelectedNeighborhoods(tempSelectedNeighborhoods.filter((n) => n !== neighborhood));
    } else {
      setTempSelectedNeighborhoods([...tempSelectedNeighborhoods, neighborhood]);
    }
  };

  const clearTempFilters = () => {
    setTempSelectedTags([]);
    setTempSelectedNeighborhoods([]);
  };

  const applyFilters = () => {
    onTagsChange(tempSelectedTags);
    onNeighborhoodsChange(tempSelectedNeighborhoods);
    setIsFilterOpen(false);
  };

  const activeFiltersCount = selectedTags.length + selectedNeighborhoods.length;
  const tempFiltersCount = tempSelectedTags.length + tempSelectedNeighborhoods.length;

  return (
    <>
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

        {/* Diamond Filter Button */}
        <DiamondButton
          onClick={openFilters}
          variant={activeFiltersCount > 0 ? "primary" : "default"}
          badge={activeFiltersCount > 0 ? activeFiltersCount : undefined}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </DiamondButton>
      </div>

      {/* Full Screen Filter Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] flex flex-col rounded-t-3xl"
          hideCloseButton
        >
          {/* Header */}
          <SheetHeader className="flex-shrink-0 border-b pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold">Filtri</SheetTitle>
              <div className="flex items-center gap-2">
                {tempFiltersCount > 0 && (
                  <button
                    onClick={clearTempFilters}
                    className="text-sm text-muted-foreground hover:text-foreground px-3 py-1"
                  >
                    Cancella tutti
                  </button>
                )}
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </SheetHeader>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto py-6 space-y-8">
            {/* Role Tags */}
            <div>
              <h4 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                Ruoli
              </h4>
              <div className="flex flex-wrap gap-2">
                {ROLE_TAGS.map((tag) => {
                  const isSelected = tempSelectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTempTag(tag)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
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
              <h4 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                Modalità
              </h4>
              <div className="flex flex-wrap gap-2">
                {TYPE_TAGS.map((tag) => {
                  const isSelected = tempSelectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTempTag(tag)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
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
              <h4 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Quartiere
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {GENOA_NEIGHBORHOODS.map((neighborhood) => {
                  const isSelected = tempSelectedNeighborhoods.includes(neighborhood);
                  return (
                    <button
                      key={neighborhood}
                      onClick={() => toggleTempNeighborhood(neighborhood)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all border",
                        isSelected
                          ? "bg-primary text-white border-primary"
                          : "bg-muted/50 text-foreground border-transparent hover:bg-muted"
                      )}
                    >
                      <span className="truncate">{neighborhood}</span>
                      {isSelected && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <SheetFooter className="flex-shrink-0 border-t pt-4">
            <Button
              onClick={applyFilters}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 rounded-xl"
            >
              Applica Filtri
              {tempFiltersCount > 0 && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  {tempFiltersCount}
                </span>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
