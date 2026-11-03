import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { eRidimensionata, spegniTrasformazioni, trasformazioniAttive } from "@/lib/foto";

const BUCKET = "chat-attachments";

/** Extracts the storage path from either a stored path or a legacy public URL. */
export const toStoragePath = (value: string): string => {
  const marker = `/${BUCKET}/`;
  const idx = value.indexOf(marker);
  if (idx === -1) return value;
  return value.slice(idx + marker.length).split("?")[0];
};

/**
 * Un allegato della chat come indirizzo firmato temporaneo. Con `larghezza`
 * lo si chiede già ridimensionato (lib/foto.ts): prima una foto in chat
 * scaricava lo scatto intero della fotocamera. Se la versione ridimensionata
 * non arriva, `ripiega` (sull'`onError` dell'immagine) rifirma l'originale.
 */
export const useAllegato = (value: string | null | undefined, larghezza?: number) => {
  const [url, setUrl] = useState<string | null>(null);
  const [originale, setOriginale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setUrl(null);
      return;
    }

    const path = toStoragePath(value);
    const trasforma = !!larghezza && !originale && trasformazioniAttive();
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60, trasforma ? { transform: { width: larghezza, resize: "contain", quality: 75 } } : undefined)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [value, larghezza, originale]);

  const ripiega = useCallback(() => {
    if (!eRidimensionata(url ?? undefined)) return;
    setOriginale(true);
  }, [url]);
  // Rifirmato l'originale: se si carica, a mancare era il ridimensionamento.
  const caricata = useCallback(() => {
    if (originale) spegniTrasformazioni();
  }, [originale]);

  return { url, ripiega, caricata };
};

/** Resolves a chat attachment reference to a temporary signed URL. */
export const useAttachmentUrl = (value: string | null | undefined) => useAllegato(value).url;
