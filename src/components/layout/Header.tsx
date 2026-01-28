import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
interface HeaderProps {
  showSearch?: boolean;
}
export function Header({
  showSearch = true
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    isEmployer
  } = useUser();

  // Dynamic filter button styles based on role
  const filterButtonClass = isEmployer ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-accent text-primary hover:bg-accent/80";
  return <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 safe-top">
      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mb-3">Annunci</h1>

      {/* Search Bar - Only show for Workers or when explicitly requested */}
      {showSearch && <>
          

          {/* Filter Chips */}
          <div className="flex items-center gap-2">
            
          </div>
        </>}
    </header>;
}