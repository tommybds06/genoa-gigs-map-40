import { cn } from "@/lib/utils";

interface NumeroPinProps {
  n: number;
  isEmployer: boolean;
  className?: string;
}

/**
 * IL NUMERO SOPRA UN PIN — quanti annunci ci sono lì sotto. Lo stesso per la
 * zona (annunci vicini raggruppati) e per il gruppo di un locale: un numero
 * sopra un pin vuol dire sempre «N annunci».
 *
 * In Shinjo (Tommaso, 22 ottobre). ⚠️ La regola dice Shinjo mai sotto i ~18 px:
 * per questo la cifra è a 18 e il tondo è da 26, non i 20 del contatore di
 * prima. Colori: quelli del contatore che sostituisce (pieno del ruolo +
 * il suo testo, bordo carta per staccarlo dal pin).
 */
export function NumeroPin({ n, isEmployer, className }: NumeroPinProps) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute -right-1.5 -top-1.5 z-10 flex h-[26px] min-w-[26px] items-center justify-center rounded-full border-2 border-card px-1",
        "font-[Shinjo,Outfit,sans-serif] text-[18px] leading-none [font-synthesis:none]",
        isEmployer ? "bg-employer-700 text-employer-foreground" : "bg-primary text-primary-foreground",
        className
      )}
    >
      {/* Shinjo siede alto sulla riga: mezzo pixel giù per centrarlo nel tondo. */}
      <span className="translate-y-[1px]">{n}</span>
    </span>
  );
}
