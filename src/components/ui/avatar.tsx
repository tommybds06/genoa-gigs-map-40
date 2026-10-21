import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";
import { useCerchioImperfetto } from "@/hooks/useCerchioImperfetto";

/**
 * ⚠️ Ogni avatar dell'app è un CERCHIO IMPERFETTO (hooks/useCerchioImperfetto,
 * lib/formaCerchio): stesso tratto a mano delle sagome della bacheca,
 * calcolato in pixel dalla misura vera. `rounded-full` resta solo per il
 * primo fotogramma, prima della misura.
 *
 * `seme`: in una lista ogni avatar deve avere il suo (l'id della persona), se
 * no tutti i cerchi hanno lo stesso identico tremolio e leggono come
 * fotocopia (§6).
 *
 * ⚠️ Niente `border`, `ring` o `shadow` sugli avatar: il ritaglio li taglia, e
 * resterebbe un anello mozzato a tratti.
 */
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & { seme?: string }
>(({ className, style, seme, ...props }, ref) => {
  const cerchio = useCerchioImperfetto<HTMLSpanElement>(seme);
  const unisciRef = React.useCallback(
    (el: HTMLSpanElement | null) => {
      (cerchio.ref as React.MutableRefObject<HTMLSpanElement | null>).current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLSpanElement | null>).current = el;
    },
    [ref, cerchio.ref]
  );
  return (
    <AvatarPrimitive.Root
      ref={unisciRef}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      style={{ ...cerchio.style, ...style }}
      {...props}
    />
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
