import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Chat {
  id: string;
  job_id: string;
  worker_id: string;
  employer_id: string;
  created_at: string;
  job?: {
    title: string;
  };
  other_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  unread_count?: number;
  application_status?: string;
}

const STALE_TIME = 1000 * 60 * 2; // 2 minutes cache (reduced for faster updates)

export function useChats(userId: string | undefined) {
  return useQuery({
    queryKey: ["chats", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("chats")
        .select("*, jobs(title)")
        .or(`worker_id.eq.${userId},employer_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch other user's profile, unread count, and application status for each chat
      const chatsWithUsers = await Promise.all(
        (data || []).map(async (chat) => {
          const otherUserId = chat.worker_id === userId ? chat.employer_id : chat.worker_id;
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, photos")
            .eq("id", otherUserId)
            .single();

          // Count unread messages
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("chat_id", chat.id)
            .eq("is_read", false)
            .neq("sender_id", userId);

          // Get application status for this chat's job
          const { data: applicationData } = await supabase
            .from("applications")
            .select("status")
            .eq("job_id", chat.job_id)
            .eq("applicant_id", chat.worker_id)
            .single();

          const avatarUrl =
            profile?.photos && profile.photos.length > 0
              ? profile.photos[0]
              : profile?.avatar_url;

          return {
            ...chat,
            job: chat.jobs,
            other_user: profile
              ? {
                  id: profile.id,
                  full_name: profile.full_name,
                  avatar_url: avatarUrl,
                }
              : { id: otherUserId, full_name: null, avatar_url: null },
            unread_count: count || 0,
            application_status: applicationData?.status || "pending",
          };
        })
      );

      return chatsWithUsers as Chat[];
    },
    staleTime: STALE_TIME,
    enabled: !!userId,
  });
}
