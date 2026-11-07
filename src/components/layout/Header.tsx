import { useUser } from "@/contexts/UserContext";
import { srcLogo } from "@/lib/gerarchia";
import { Campanella } from "@/components/notifiche/Campanella";

interface HeaderProps {
  title?: string;
  titleColor?: string;
  showSearch?: boolean;
  /** La campanella delle notifiche, in alto a destra: sulle pagine con la
   *  barra in basso sì, sulle pagine di dettaglio (profilo pubblico) no. */
  campanella?: boolean;
}

export function Header({
  showSearch = false,
  campanella = true,
}: HeaderProps) {
  const { isEmployer } = useUser();

  const logoSrc = srcLogo(isEmployer);

  return (
    <header className="sticky top-0 z-40 bg-background px-4 pt-8 pb-3">
      <div className="mb-3 flex items-center justify-between">
        <img src={logoSrc} alt="Politask" className="h-14 w-auto" />
        {campanella && <Campanella className="-mr-2" />}
      </div>

      {/* Search Bar - placeholder for future use */}
      {showSearch && (
        <div className="flex items-center gap-2">
          {/* Search components can be added here */}
        </div>
      )}
    </header>
  );
}