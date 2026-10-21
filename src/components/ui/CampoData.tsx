import { CalendarioIcon } from "@/components/icons/uiIcons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * IL CAMPO DATA — con la NOSTRA icona del calendario.
 *
 * ⚠️ L'icona che si vedeva «spostata a destra» non era nostra: è
 * l'indicatore nativo di Chrome dentro `<input type="date">`, disegnato dal
 * browser, attaccato al bordo destro e nel suo stile. Qui resta, ma
 * INVISIBILE e sovrapposto alla nostra icona (`.campo-data` in index.css):
 * toccando l'icona si apre comunque il selettore di sistema. Su iOS
 * l'indicatore non esiste e il selettore si apre toccando il campo.
 */
export function CampoData({
  value,
  onChange,
  min,
  disabled,
  className,
  ...resto
}: {
  value: string;
  onChange: (valore: string) => void;
  min?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        type="date"
        value={value}
        min={min}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn("campo-data relative pr-11", className)}
        {...resto}
      />
      {/* z-10: il guscio del campo è `relative` e coprirebbe l'icona (§6). */}
      <CalendarioIcon
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-ink-soft"
      />
    </div>
  );
}
