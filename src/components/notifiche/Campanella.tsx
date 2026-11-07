import { useNavigate } from "react-router-dom";
import { NotificheIcon } from "@/components/icons/uiIcons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNotifiche } from "@/hooks/useNotifiche";
import { cn } from "@/lib/utils";

/**
 * LA CAMPANELLA — in alto a destra nelle pagine con la barra in basso, col
 * numero delle non lette. Porta al centro notifiche (`/notifiche`).
 * Stessa veste della rotellina del Profilo, che le sta accanto.
 */
export function Campanella({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { isEmployer } = useAppTheme();
  const { nonLette } = useNotifiche();
  const etichetta = nonLette > 0 ? `Notifiche, ${nonLette} da leggere` : "Notifiche";
  return (
    <button
      type="button"
      onClick={() => navigate("/notifiche")}
      aria-label={etichetta}
      title="Notifiche"
      className={cn(
        "relative shrink-0 rounded-full p-2 transition-transform active:scale-95",
        isEmployer ? "hover:bg-employer-50" : "hover:bg-accent",
        className
      )}
    >
      <NotificheIcon className={cn("h-7 w-7", isEmployer ? "text-employer" : "text-primary")} />
      {/* nonLette > 0, non `nonLette &&`: lo zero si stamperebbe (§12).
          Inchiostro sul pieno di ruolo, come il contatore della chat. */}
      {nonLette > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ring-2 ring-background",
            isEmployer ? "bg-employer-700 text-employer-foreground" : "bg-primary text-primary-foreground"
          )}
        >
          {nonLette > 9 ? "9+" : nonLette}
        </span>
      )}
    </button>
  );
}
