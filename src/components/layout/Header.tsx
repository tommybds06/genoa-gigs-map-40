import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 safe-top">
      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mb-3">GenoaGigs</h1>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cerca lavoretti..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="material-input w-full pl-12 pr-4 text-base placeholder:text-muted-foreground"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        <button className="material-chip">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtri</span>
        </button>
      </div>
    </header>
  );
}
