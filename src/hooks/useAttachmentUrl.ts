import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "chat-attachments";

/** Extracts the storage path from either a stored path or a legacy public URL. */
export const toStoragePath = (value: string): string => {
  const marker = `/${BUCKET}/`;
  const idx = value.indexOf(marker);
  if (idx === -1) return value;
  return value.slice(idx + marker.length).split("?")[0];
};

/** Resolves a chat attachment reference to a temporary signed URL. */
export const useAttachmentUrl = (value: string | null | undefined) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setUrl(null);
      return;
    }

    const path = toStoragePath(value);
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  return url;
};
