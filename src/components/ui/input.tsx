import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  /**
   * Toglie il tratto disegnato attorno al campo.
   * Serve dove il campo non ha l'altezza standard di 48px: il disegno e' fatto
   * su una tavola 250x56 e sotto i ~44px il browser lo rimpicciolisce da solo,
   * sfalsando angoli e spessore. Usato dalla barra di ricerca (h-10).
   */
  senzaTratto?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, senzaTratto, ...props }, ref) => {
    return (
      /* Il guscio serve al tratto disegnato (vedi .campo-guscio in index.css):
         su un <input> non esiste ::after, e il bordo messo sul campo stesso
         gli mangerebbe lo spazio del testo.
         `flex-1` c'e' perche' alcuni campi stanno in una riga flex (la chat,
         la barra di ricerca) e prima era l'input a portarselo: senza, il
         guscio si stringerebbe. Fuori da un flex non fa niente.
         ⚠️ Il guscio e' `relative`, quindi entra nello strato degli elementi
         posizionati e coprirebbe le icone `absolute` messe PRIMA nel DOM
         (era il caso delle icone dei campi in Auth). A quelle serve `z-10`. */
      <div
        className={cn(
          "relative w-full min-w-0 flex-1",
          !senzaTratto && "campo-guscio"
        )}
      >
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
            // Il focus usa `ring`/`border-ring`, non `primary`: cosi' segue il
            // ruolo (vedi [data-ruolo="employer"] in index.css) invece di essere
            // arancione anche in contesto employer.
            "flex h-12 w-full rounded-xl border border-input bg-field px-4 py-2 text-base ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring focus-visible:bg-card disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
