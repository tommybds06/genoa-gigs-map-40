import { CSSProperties, useMemo } from "react";
import { cerchioImperfetto } from "@/lib/formaCerchio";
import { useMisure } from "./useMisure";

/**
 * Ritaglia un elemento quadrato a cerchio imperfetto (lib/formaCerchio.ts).
 * Si mette `ref` sull'elemento e `style` nei suoi stili. Prima della misura lo
 * stile è vuoto: resta il `rounded-full` dell'elemento, quindi niente
 * fotogramma quadrato.
 *
 * Il seme decide il tracciato: avatar diversi in una lista devono avere semi
 * diversi (l'id della persona), se no leggono come fotocopia (§6).
 */
export function useCerchioImperfetto<T extends HTMLElement = HTMLDivElement>(seme = "avatar") {
  const { ref, misure } = useMisure<T>();
  const style = useMemo<CSSProperties | undefined>(() => {
    if (!misure || misure.w <= 0) return undefined;
    const clip = `path('${cerchioImperfetto(Math.min(misure.w, misure.h), seme)}')`;
    return { clipPath: clip, WebkitClipPath: clip };
  }, [misure, seme]);
  return { ref, style };
}
