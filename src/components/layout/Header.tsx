import { useUser } from "@/contexts/UserContext";

interface HeaderProps {
  title?: string;
  titleColor?: string;
  showSearch?: boolean;
}

export function Header({
  showSearch = false
}: HeaderProps) {
  const { isEmployer } = useUser();

  const logoSrc = isEmployer
    ? "/images/logo-employer.svg"
    : "/images/logo-worker.svg";

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-8 pb-3">
      {/* Logo */}
      <img src={logoSrc} alt="Politask" className="h-14 w-auto -ml-1 mb-3" />

      {/* Search Bar - placeholder for future use */}
      {showSearch && (
        <div className="flex items-center gap-2">
          {/* Search components can be added here */}
        </div>
      )}
    </header>
  );
}