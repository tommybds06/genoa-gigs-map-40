import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // STILE UNICO DEI CAMPI — Politask.
          // Il campo e' un INCAVO nella carta: fondo piu' scuro del foglio
          // (bg-muted) e bordo caldo. Prima esistevano quattro stili diversi
          // (Auth grigio pieno senza bordo, CreateJob crema con bordo,
          // TagSelector pillola, select quartiere con icona) e l'incoerenza si
          // sentiva piu' che altrove, perche' il campo e' cio' che si tocca di piu'.
          // h-12: bersaglio di tocco decente su mobile.
          "flex h-12 w-full rounded-xl border border-input bg-muted px-4 py-2 text-base ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary focus-visible:bg-card disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
