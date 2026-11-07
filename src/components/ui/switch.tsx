import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";
import { useAppTheme } from "@/hooks/useAppTheme";
import { cerchioImperfetto } from "@/lib/formaCerchio";

/* Il pomello: 24 px, disegnato una volta (stesso seme per tutti: sono lo
   stesso oggetto ripetuto, non persone diverse). Il tracciato è da 22 px
   spostato di 1, così il filo da 1,1 px non esce dal riquadro. */
const POMELLO = cerchioImperfetto(22, "interruttore");

/**
 * L'INTERRUTTORE (7 novembre) — era quello di serie di shadcn: pillola CSS
 * liscia, pallino bianco con l'ombra nera, arancio PASTELLO acceso anche
 * nell'app dell'employer.
 *
 * - Il BINARIO è un chip ritagliato (`sagoma-chip`), come i tag: 32 px di
 *   altezza, sopra i 30 che servono alla maschera (15 + 15).
 * - Acceso: il PIENO del ruolo (`--primary` / `--employer-700`, con la
 *   gerarchia scura gli inchiostri), cioè il colore dei bottoni pieni.
 *   Spento: `paper-line`, abbastanza scuro da staccare il pomello.
 * - Il POMELLO è un cerchio imperfetto in carta col filo delle card
 *   (`--paper-edge`, 1,1 px): niente ombra, che la direzione bandisce.
 *
 * ⚠️ La maschera sta su uno span DENTRO il bottone, non sul bottone: taglierebbe
 * anche l'anello del fuoco e il pomello, che deve restare intero.
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const { isEmployer } = useAppTheme();
  return (
    <SwitchPrimitives.Root
      className={cn(
        "group peer relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
      ref={ref}
    >
      <span
        aria-hidden="true"
        className={cn(
          "sagoma-chip absolute inset-0 rounded-full bg-paper-line transition-colors duration-200",
          isEmployer ? "group-data-[state=checked]:bg-employer-700" : "group-data-[state=checked]:bg-primary",
        )}
      />
      <SwitchPrimitives.Thumb className="pointer-events-none relative block h-6 w-6 translate-x-1 transition-transform duration-200 ease-out data-[state=checked]:translate-x-7">
        <svg viewBox="0 0 24 24" className="block h-6 w-6">
          <path
            d={POMELLO}
            transform="translate(1 1)"
            fill="hsl(var(--paper-sheet))"
            stroke="hsl(var(--paper-edge))"
            strokeWidth={1.1}
            strokeLinejoin="round"
          />
        </svg>
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
