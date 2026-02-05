import { useUser } from "@/contexts/UserContext";

interface HeaderProps {
  title?: string;
  titleColor?: string;
  showSearch?: boolean;
}

export function Header({
  title = "Annunci",
  titleColor,
  showSearch = false
}: HeaderProps) {
  const { isEmployer } = useUser();

  // Default color based on role if not provided
  const colorClass = titleColor || (isEmployer ? "text-blue-600" : "text-primary");

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-8 pb-3">
      {/* Title */}
      <h1 className={`text-2xl font-bold ${colorClass} mb-3`}>{title}</h1>

      {/* Search Bar - placeholder for future use */}
      {showSearch && (
        <div className="flex items-center gap-2">
          {/* Search components can be added here */}
        </div>
      )}
    </header>
  );
}