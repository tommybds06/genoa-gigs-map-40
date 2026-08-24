import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * BASE DEI BOTTONI — Politask.
 *
 * Raggio `xl` come i campi (erano `md`, 6px, mentre input e card stavano a
 * 12-24: il bottone sembrava di un'altra libreria). Altezze allineate alla
 * scala dei campi, con `default` a 44px, che e' il minimo per un bersaglio di
 * tocco su mobile.
 *
 * ⚠️ Gancio per le CORNICI DISEGNATE: quando arrivano i 6 SVG (bottone/chip/
 * contenitore x 2 spessori, specifiche in brand/POLITASK-specifiche-disegni.md)
 * si aggiunge `.cornice-bottone` — vedi index.css — che sostituisce bordo e
 * raggio con `border-image` a 9 sezioni. Le varianti qui sotto restano valide:
 * la cornice cambia il CONTORNO, non il riempimento ne' il testo.
 */
const buttonVariants = cva(
  "font-[Shinjo,Outfit,sans-serif] [font-synthesis:none] tracking-[-0.04em] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // `accent` segue il ruolo (vedi [data-ruolo="employer"] in index.css):
        // prima l'hover di outline e ghost virava all'arancio anche in blu.
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-[13px]",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    /* La sagoma disegnata va SOLO sui bottoni PIENI d'azione (default e
       destructive): sono gli unici che hanno un fondo da ritagliare. Su ghost,
       link e outline non c'e' niente da tagliare, e outline ha gia' un bordo suo.
       Il raggio resta impostato qui, e serve da FALLBACK: dove la maschera non
       e' supportata il bottone e' semplicemente arrotondato. Sta qui e non
       nella classe CSS perche' le utility di Tailwind vincono su @layer
       components — messo altrove, `rounded-xl` della base lo ricoprirebbe. */
    compoundVariants: [
      { variant: "default", size: "default", className: "sagoma-btn sagoma-btn-md rounded-full" },
      { variant: "default", size: "lg", className: "sagoma-btn sagoma-btn-lg rounded-full" },
      { variant: "default", size: "sm", className: "sagoma-chip rounded-full" },
      { variant: "destructive", size: "default", className: "sagoma-btn sagoma-btn-md rounded-full" },
      { variant: "destructive", size: "lg", className: "sagoma-btn sagoma-btn-lg rounded-full" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
