import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatoLavoro, statoLavoro, UnitaPaga } from "@/lib/bacheca";

/**
 * La bacheca del WORKER: i lavori in cui un employer l'ha appeso alla sua
 * bacheca (in prova o assunto). Legge gli stessi cartellini che l'employer
 * modifica — il worker li può solo leggere (RLS della migration cartellini).
 *
 * Tre query fisse, non una per card: i cartellini con candidatura, annuncio
 * e attività dentro; le recensioni già lasciate; le chat.
 *
 * ⚠️ Chiave sotto 'applications': ReviewPrompt, dopo una recensione, invalida
 * ['applications'] — così la card passa da «Da recensire» a «Concluso» da sola.
 */

export const CHIAVE_LAVORI_WORKER = ["applications", "bacheca-worker"];

export interface LavoroWorker {
  id: string;
  applicationId: string;
  jobId: string;
  employerId: string;
  chatId: string | null;
  stato: StatoLavoro;
  dataInizio: string | null;
  dataFine: string | null;
  pagaImporto: number | null;
  pagaUnita: UnitaPaga | null;
  pagaAnnuncio: string | null;
  /** Giorni ISO della settimana (1 = lunedì). Null = non fissati. */
  giorni: number[] | null;
  orari: string | null;
  /** I tag dell'annuncio: decidono l'icona del mestiere. */
  tags: string[];
  attivita: string;
  foto: string | null;
  ruolo: string;
}

async function carica(workerId: string): Promise<LavoroWorker[]> {
  const { data, error } = await supabase
    .from("cartellini")
    .select(`
      id, application_id, job_id, employer_id,
      data_inizio, data_fine, paga_importo, paga_unita, giorni, orari, created_at,
      employer:profiles!cartellini_employer_id_fkey ( full_name, avatar_url, photos ),
      job:jobs!cartellini_job_id_fkey ( title, price, tags ),
      candidatura:applications!cartellini_application_id_fkey ( status, job_title, employer_name )
    `)
    .eq("worker_id", workerId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const idLavori = [...new Set(data.map((r) => r.job_id))];
  const [{ data: recensioni }, { data: chats }] = await Promise.all([
    supabase.from("reviews").select("job_id").eq("worker_id", workerId).in("job_id", idLavori),
    supabase.from("chats").select("id, job_id, employer_id").eq("worker_id", workerId).in("job_id", idLavori),
  ]);
  const recensiti = new Set((recensioni || []).map((r) => r.job_id));
  const chatPer = new Map((chats || []).map((c) => [`${c.job_id}:${c.employer_id}`, c.id]));

  const lavori = data.flatMap((r): LavoroWorker[] => {
    const stato = statoLavoro(r.candidatura?.status, recensiti.has(r.job_id), r.data_fine);
    if (!stato) return [];
    const p = r.employer;
    return [{
      id: r.id,
      applicationId: r.application_id,
      jobId: r.job_id,
      employerId: r.employer_id,
      chatId: chatPer.get(`${r.job_id}:${r.employer_id}`) ?? null,
      stato,
      dataInizio: r.data_inizio,
      dataFine: r.data_fine,
      pagaImporto: r.paga_importo === null ? null : Number(r.paga_importo),
      pagaUnita: (r.paga_unita as UnitaPaga | null) ?? null,
      pagaAnnuncio: r.job?.price ?? null,
      giorni: r.giorni,
      orari: r.orari,
      tags: r.job?.tags || [],
      attivita: p?.full_name || r.candidatura?.employer_name || "Attività",
      foto: p?.photos && p.photos.length > 0 ? p.photos[0] : p?.avatar_url ?? null,
      ruolo: r.job?.title || r.candidatura?.job_title || "Lavoro",
    }];
  });

  // Le concluse in fondo, dopo le attive; dentro ogni gruppo, l'ordine di arrivo.
  return [...lavori.filter((l) => l.stato !== "concluso"), ...lavori.filter((l) => l.stato === "concluso")];
}

export function useLavoriWorker(workerId: string | undefined) {
  return useQuery({
    queryKey: [...CHIAVE_LAVORI_WORKER, workerId],
    queryFn: () => carica(workerId!),
    enabled: !!workerId,
    retry: false,
  });
}
