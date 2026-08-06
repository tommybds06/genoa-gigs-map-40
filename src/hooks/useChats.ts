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
  last_message?: {
    content: string | null;
    created_at: string;
    sender_id: string;
    has_attachment: boolean;
  } | null;
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

          // Ultimo messaggio, per l'anteprima in lista.
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at, sender_id, attachment_url")
            .eq("chat_id", chat.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get application status for this chat's job
          // maybeSingle(): se la candidatura non esiste più, single() risponderebbe
          // 406 e riempirebbe la console di errori (stesso bug già visto in
          // WorkerJobHistory).
          const { data: applicationData } = await supabase
            .from("applications")
            .select("status")
            .eq("job_id", chat.job_id)
            .eq("applicant_id", chat.worker_id)
            .maybeSingle();

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
            last_message: lastMessage
              ? {
                  content: lastMessage.content,
                  created_at: lastMessage.created_at,
                  sender_id: lastMessage.sender_id,
                  has_attachment: !!lastMessage.attachment_url,
                }
              : null,
          };
        })
      );

      // Riordino sull'ultimo messaggio reale.
      // La query ordina per `chats.updated_at`, ma quella colonna non viene
      // aggiornata quando si inserisce un messaggio: la lista arrivava in un
      // ordine arbitrario (22/07, 10/07, 22/07, 03/03…). Finché non c'è un
      // trigger che tocca `updated_at`, l'ordine giusto lo ricaviamo qui.
      return (chatsWithUsers as Chat[]).sort((a, b) => {
        const ta = new Date(a.last_message?.created_at ?? a.created_at).getTime();
        const tb = new Date(b.last_message?.created_at ?? b.created_at).getTime();
        return tb - ta;
      });
    },
    staleTime: STALE_TIME,
    enabled: !!userId,
  });
}
