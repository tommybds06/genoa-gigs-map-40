import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Recensione {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  worker_name: string;
}

export const CHIAVE_RECENSIONI = "recensioni";

/**
 * Le recensioni RICEVUTE da un'attività, dalla più recente. Una lettura sola
 * per il profilo pubblico e per il proprio profilo (stessa chiave, stessa
 * cache).
 *
 * ⚠️ TUTTE, senza `limit`: il profilo pubblico ne leggeva 10 e da quelle
 * calcolava anche media e numero in testa al profilo, che oltre la decima
 * recensione sarebbero stati sbagliati. Quante se ne MOSTRANO lo decide
 * l'elenco (`RecensioniRicevute`, tre alla volta).
 */
export function useRecensioniRicevute(employerId: string | undefined) {
  return useQuery({
    queryKey: [CHIAVE_RECENSIONI, employerId],
    enabled: !!employerId,
    queryFn: async (): Promise<Recensione[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, profiles!reviews_worker_id_fkey ( full_name )")
        .eq("employer_id", employerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        worker_name: (r.profiles as unknown as { full_name: string | null } | null)?.full_name || "Utente",
      }));
    },
  });
}

/** Media a un decimale e numero, o null se non ce n'è nessuna. */
export function mediaRecensioni(recensioni: Recensione[] | undefined) {
  if (!recensioni || recensioni.length === 0) return null;
  const avg = recensioni.reduce((s, r) => s + r.rating, 0) / recensioni.length;
  return { avg: Math.round(avg * 10) / 10, count: recensioni.length };
}
