import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ApplicationJob {
  id: string;
  title: string;
  owner_id: string;
  tags: string[] | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_reviewed: boolean;
  job: ApplicationJob | null;
}

const STALE_TIME = 1000 * 60 * 2; // 2 minutes cache

export function useUserApplications(userId: string | undefined) {
  return useQuery({
    queryKey: ["applications", "user", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          jobs(
            id,
            title,
            owner_id,
            tags,
            profiles(full_name, avatar_url)
          )
        `)
        .eq("applicant_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((app) => ({
        ...app,
        job: app.jobs as ApplicationJob | null,
      })) as Application[];
    },
    staleTime: STALE_TIME,
    enabled: !!userId,
  });
}

export function useChatForApplication(jobId: string | undefined, workerId: string | undefined) {
  return useQuery({
    queryKey: ["chat", "application", jobId, workerId],
    queryFn: async () => {
      if (!jobId || !workerId) return null;

      const { data, error } = await supabase
        .from("chats")
        .select("id")
        .eq("job_id", jobId)
        .eq("worker_id", workerId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return data?.id || null;
    },
    enabled: !!jobId && !!workerId,
  });
}
