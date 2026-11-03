import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";
import { useCerchioImperfetto } from "@/hooks/useCerchioImperfetto";
import { eRidimensionata, MISURA_FOTO, spegniTrasformazioni, urlFoto } from "@/lib/foto";

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

/**
 * La foto si chiede a `MISURA_FOTO.avatar` (256 px), non intera (lib/foto.ts):
 * prima un avatar da 44 px scaricava la foto da 4 MB della fotocamera.
 * Se la versione piccola non arriva, si prova l'originale: Radix su errore
 * mostra le iniziali, quindi il ripiego passa dal suo stato di caricamento.
 */
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, onLoadingStatusChange, ...props }, ref) => {
  const piccola = urlFoto(src, MISURA_FOTO.avatar, true);
  // Legato alla foto: se `src` cambia, si riprova la versione piccola.
  const [originaleDi, setOriginaleDi] = React.useState<string>();
  const originale = originaleDi === src;
  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={originale ? src : piccola}
      decoding="async"
      onLoadingStatusChange={(stato) => {
        if (stato === "error" && !originale && eRidimensionata(piccola)) setOriginaleDi(src);
        // L'originale arriva e la versione piccola no: è il servizio a
        // mancare, non la foto (lib/foto.ts).
        if (stato === "loaded" && originale && src !== piccola) spegniTrasformazioni();
        onLoadingStatusChange?.(stato);
      }}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
});
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
