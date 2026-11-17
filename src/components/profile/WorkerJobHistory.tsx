import { useQuery } from '@tanstack/react-query';
import { useCuoriWorker } from '@/hooks/useCuoriWorker';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { StoricoLavoriIcon } from "@/components/icons/uiIcons";
import { CartaCard } from "@/components/ui/CartaCard";
import { RigheStorico } from "@/components/profile/RigheStorico";

interface CompletedJob {
  id: string;
  job_id: string;
  created_at: string;
  // Snapshot salvato alla candidatura (sopravvive alla cancellazione dell'annuncio)
  job_title: string | null;
  employer_name: string | null;
  job: {
    title: string;
    schedule: string | null;
    created_at: string;
    owner_id: string;
    tags: string[] | null;
  } | null;
  employer: {
    id: string;
    full_name: string | null;
  } | null;
}

interface WorkerJobHistoryProps {
  primaryTextClasses: string;
}

/**
 * ⚠️ QUESTA ERA LA LENTEZZA DEL PROFILO WORKER, e non era un'impressione.
 *
 * Prima: una query per le candidature, poi **due query per ogni candidatura**
 * dentro un `Promise.all` — dettagli dell'annuncio e profilo dell'employer.
 * Con 5 lavori completati sono **11 giri di rete**, e siccome stava in un
 * `useEffect` senza cache ripartivano tutti a ogni ritorno sul profilo
 * (`PageTransition` smonta la pagina a ogni cambio di tab). Da lì lo spinner e
 * il salto del contenuto ogni singola volta.
 *
 * Adesso: **3 query fisse**, qualunque sia il numero di lavori — le
 * candidature, poi tutti gli annunci con un `.in()`, poi tutti gli employer con
 * un altro `.in()`. E con react-query, dalla seconda visita entro un minuto
 * (`staleTime` globale) sono **zero**: il contenuto c'è già al primo
 * fotogramma, quindi niente spinner e niente salto.
 */
async function caricaStorico(userId: string): Promise<CompletedJob[]> {
  const { data: candidature, error } = await supabase
    .from('applications')
    .select('id, job_id, created_at, job_title, employer_name')
    .eq('applicant_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!candidature || candidature.length === 0) return [];

  const idAnnunci = [...new Set(candidature.map((c) => c.job_id).filter(Boolean))];
  const { data: annunci } = idAnnunci.length
    ? await supabase
        .from('jobs')
        .select('id, title, schedule, created_at, owner_id, tags')
        .in('id', idAnnunci)
    : { data: [] };

  const perId = new Map((annunci || []).map((j) => [j.id, j]));

  const idEmployer = [...new Set((annunci || []).map((j) => j.owner_id).filter(Boolean))];
  const { data: profili } = idEmployer.length
    ? await supabase.from('profiles').select('id, full_name').in('id', idEmployer)
    : { data: [] };

  const employerPerId = new Map((profili || []).map((p) => [p.id, p]));

  return candidature.map((c) => {
    const annuncio = perId.get(c.job_id) ?? null;
    return {
      id: c.id,
      job_id: c.job_id,
      created_at: c.created_at,
      job_title: c.job_title,
      employer_name: c.employer_name,
      job: annuncio
        ? {
            title: annuncio.title,
            schedule: annuncio.schedule,
            created_at: annuncio.created_at,
            owner_id: annuncio.owner_id,
            tags: annuncio.tags,
          }
        : null,
      employer: annuncio?.owner_id ? employerPerId.get(annuncio.owner_id) ?? null : null,
    };
  });
}

export const WorkerJobHistory = ({ primaryTextClasses }: WorkerJobHistoryProps) => {
  const { user } = useAuth();

  const { data: cuori } = useCuoriWorker(user?.id);
  const { data: jobs = [], isLoading: loading } = useQuery({
    queryKey: ['worker-job-history', user?.id],
    queryFn: () => caricaStorico(user!.id),
    enabled: !!user?.id,
  });

  return (
    <CartaCard seme="storico" raggio={20} className="p-4 mb-4">
      <h3 className="titolo-mini mb-1 flex items-center gap-2">
        <StoricoLavoriIcon className={`w-5 h-5 ${primaryTextClasses}`} />
        Storico lavori
        {jobs.length > 0 && <span className="text-ink-soft">· {jobs.length}</span>}
      </h3>
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <p className="py-3 text-sm text-ink-soft">
          Qui finiranno i lavori conclusi, con il cuore di chi ti ha preso.
        </p>
      ) : (
        <RigheStorico
          righe={jobs.map((job) => ({
            id: job.id,
            titolo: job.job?.title || job.job_title || 'Lavoro',
            attivita: job.employer?.full_name || job.employer_name || 'Attività',
            data: job.created_at,
            tags: job.job?.tags ?? [],
            cuore: !!cuori?.has(job.id),
            employerId: job.employer?.id ?? null,
          }))}
        />
      )}
    </CartaCard>
  );
};