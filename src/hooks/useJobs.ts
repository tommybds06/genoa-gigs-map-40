import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface JobProfile {
  full_name: string | null;
  avatar_url: string | null;
  address_text: string | null;
  photos?: string[] | null;
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
  profiles?: JobProfile | null;
}

const STALE_TIME = 1000 * 60 * 2; // 2 minutes cache (reduced for faster updates)

// Fetch open jobs for workers (with tag filtering) or all jobs for map
export function useOpenJobs(userTags?: string[]) {
  return useQuery({
    queryKey: ["jobs", "open", userTags],
    queryFn: async () => {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from("jobs")
        .select("*, profiles(full_name, avatar_url, address_text, photos)")
        .eq("status", "open")
        .gte("created_at", fortyEightHoursAgo)
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

      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("jobs")
        .select("*, profiles(full_name, avatar_url, address_text)")
        .eq("owner_id", userId)
        .gte("created_at", fortyEightHoursAgo)
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
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("jobs")
        .select("*, profiles(full_name, avatar_url, address_text, photos)")
        .eq("status", "open")
        .gte("created_at", fortyEightHoursAgo);

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
