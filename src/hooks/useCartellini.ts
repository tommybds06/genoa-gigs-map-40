import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Cartellino, STATO_DA_CANDIDATURA, UnitaPaga } from "@/lib/bacheca";

/**
 * Le letture della bacheca. In react-query e non in un `useEffect`: la pagina
 * Messaggi si smonta a ogni cambio di tab (PageTransition), e senza cache la
 * bacheca ripartirebbe da uno spinner a ogni ritorno.
 */

export const CHIAVE_CARTELLINI = "cartellini";
export const CHIAVE_CANDIDATI = "candidati-bacheca";

function primaFoto(p: { photos: string[] | null; avatar_url: string | null } | null) {
  if (!p) return null;
  return p.photos && p.photos.length > 0 ? p.photos[0] : p.avatar_url;
}

async function caricaCartellini(employerId: string): Promise<Cartellino[]> {
  const { data, error } = await supabase
    .from("cartellini")
    .select(`
      id, application_id, worker_id, job_id,
      data_inizio, data_fine, paga_importo, paga_unita, giorni, orari, created_at,
      worker:profiles!cartellini_worker_id_fkey ( full_name, avatar_url, photos ),
      job:jobs!cartellini_job_id_fkey ( title, tags, price ),
      candidatura:applications!cartellini_application_id_fkey ( status, job_title )
    `)
    .eq("employer_id", employerId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // La chat serve per il tasto «Chat»: una sola query per tutte, non una a testa.
  const { data: chats } = await supabase
    .from("chats")
    .select("id, job_id, worker_id")
    .eq("employer_id", employerId)
    .in("job_id", [...new Set(data.map((r) => r.job_id))]);
  const chatPer = new Map((chats || []).map((c) => [`${c.job_id}:${c.worker_id}`, c.id]));

  return data.flatMap((r): Cartellino[] => {
    const stato = STATO_DA_CANDIDATURA[r.candidatura?.status ?? ""];
    // Una candidatura tornata `rejected` o `pending` non ha piu' posto sulla
    // bacheca. Non succede dall'app, ma non deve rompere la griglia.
    if (!stato) return [];
    return [{
      id: r.id,
      applicationId: r.application_id,
      workerId: r.worker_id,
      jobId: r.job_id,
      chatId: chatPer.get(`${r.job_id}:${r.worker_id}`) ?? null,
      stato,
      dataInizio: r.data_inizio,
      dataFine: r.data_fine,
      pagaImporto: r.paga_importo === null ? null : Number(r.paga_importo),
      pagaUnita: (r.paga_unita as UnitaPaga | null) ?? null,
      giorni: r.giorni,
      orari: r.orari,
      nome: r.worker?.full_name || "Senza nome",
      foto: primaFoto(r.worker),
      mestiere: r.job?.title || r.candidatura?.job_title || "Lavoro",
      tags: r.job?.tags || [],
      pagaAnnuncio: r.job?.price ?? null,
    }];
  });
}

export function useCartellini(employerId: string | undefined) {
  return useQuery({
    queryKey: [CHIAVE_CARTELLINI, employerId],
    queryFn: () => caricaCartellini(employerId!),
    enabled: !!employerId,
    // Se la tabella non c'e' ancora (migration non applicata) non ha senso
    // riprovare tre volte: l'errore lo mostra la bacheca.
    retry: false,
  });
}

export interface CandidatoDaAppendere {
  applicationId: string;
  workerId: string;
  jobId: string;
  nome: string;
  foto: string | null;
  mestiere: string;
  pagaAnnuncio: string | null;
}

/** Chi ha la candidatura accettata (in colloquio) e non e' ancora sulla bacheca. */
async function caricaCandidati(employerId: string): Promise<CandidatoDaAppendere[]> {
  const { data, error } = await supabase
    .from("applications")
    .select(`
      id, applicant_id, job_id, job_title,
      job:jobs!inner ( owner_id, title, price ),
      worker:profiles!applications_applicant_id_fkey ( full_name, avatar_url, photos ),
      cartellini ( id )
    `)
    .eq("status", "accepted")
    .eq("job.owner_id", employerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data || [])
    .filter((r) => !r.cartellini || (Array.isArray(r.cartellini) ? r.cartellini.length === 0 : false))
    .map((r) => ({
      applicationId: r.id,
      workerId: r.applicant_id,
      jobId: r.job_id,
      nome: r.worker?.full_name || "Senza nome",
      foto: primaFoto(r.worker),
      mestiere: r.job?.title || r.job_title || "Lavoro",
      pagaAnnuncio: r.job?.price ?? null,
    }));
}

export function useCandidatiDaAppendere(employerId: string | undefined, attivo: boolean) {
  return useQuery({
    queryKey: [CHIAVE_CANDIDATI, employerId],
    queryFn: () => caricaCandidati(employerId!),
    enabled: !!employerId && attivo,
    retry: false,
  });
}
