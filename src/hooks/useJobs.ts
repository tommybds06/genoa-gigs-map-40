import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adessoISO } from "@/lib/scadenzaAnnunci";

interface JobProfile {
  full_name: string | null;
  avatar_url: string | null;
  address_text: string | null;
  photos?: string[] | null;
  /** Chi lo offre (24 ottobre): attività o privato, e le verifiche. */
  tipo_employer?: "attivita" | "privato" | null;
  piva_verificata?: boolean;
  identita_verificata?: boolean;
}

export interface Job {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  price: string | null;
  schedule: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  tags: string[];
  owner_id: string;
  status: string;
  neighborhood: string | null;
  /** Quando smette di essere visibile (vedi lib/scadenzaAnnunci.ts). */
  scade_il?: string | null;
  /** Annuncio di un privato: il raggio dell'area (lat/lng = centro già
      spostato). NULL = annuncio di un'attività, con il pin. */
  area_raggio?: number | null;
  profiles?: JobProfile | null;
}

const STALE_TIME = 1000 * 60 * 2; // 2 minutes cache (reduced for faster updates)

// Fetch open jobs for workers (with tag filtering) or all jobs for map
export function useOpenJobs(userTags?: string[]) {
  return useQuery({
    queryKey: ["jobs", "open", userTags],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*, profiles(full_name, avatar_url, address_text, photos, tipo_employer, piva_verificata, identita_verificata)")
        .eq("status", "open")
        // Visibili = non ancora scaduti (lib/scadenzaAnnunci.ts).
        .gt("scade_il", adessoISO())
        .order("created_at", { ascending: false });

      // If user has tags, filter by overlap
      if (userTags && userTags.length > 0) {
        query = query.overlaps("tags", userTags);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((j) => ({ ...j, tags: j.tags || [] })) as Job[];
    },
    staleTime: STALE_TIME,
    enabled: true,
  });
}

// Fetch employer's own jobs
export function useEmployerJobs(userId: string | undefined) {
  return useQuery({
    queryKey: ["jobs", "employer", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("jobs")
        .select("*, profiles(full_name, avatar_url, address_text)")
        .eq("owner_id", userId)
        .gt("scade_il", adessoISO())
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((j) => ({ ...j, tags: j.tags || [] })) as Job[];
    },
    staleTime: STALE_TIME,
    enabled: !!userId,
  });
}

// Fetch all open jobs for map (no tag filtering)
export function useMapJobs() {
  return useQuery({
    queryKey: ["jobs", "map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, profiles(full_name, avatar_url, address_text, photos, tipo_employer, piva_verificata, identita_verificata)")
        .eq("status", "open")
        .gt("scade_il", adessoISO());

      if (error) throw error;

      // Filter jobs with valid coordinates
      const validJobs = (data || []).filter(
        (job) => job.lat != null && job.lng != null && job.lat !== 0 && job.lng !== 0
      );

      return validJobs.map((j) => ({ ...j, tags: j.tags || [] })) as Job[];
    },
    staleTime: STALE_TIME,
  });
}

/**
 * Gli annunci dell'employer appena SCADUTI di cui non ha ancora visto l'avviso
 * (`scadenza_vista`). Li mostra `PromemoriaScadenza`, uno alla volta.
 * Sotto `['jobs', …]`: si rilegge con tutto il resto quando cambia un annuncio.
 */
export function useAnnunciScadutiDaVedere(userId: string | undefined) {
  return useQuery({
    queryKey: ["jobs", "scaduti-da-vedere", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, scade_il")
        .eq("owner_id", userId!)
        .eq("status", "open")
        .eq("scadenza_vista", false)
        .lte("scade_il", adessoISO())
        .order("scade_il", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
