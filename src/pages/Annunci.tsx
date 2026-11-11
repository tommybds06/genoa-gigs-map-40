import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Loader2, Check } from 'lucide-react';
import { PennaIcon, BidoneIcon, XIcon, AnnunciVuotaIcon, PiuIcon, OrologioIcon } from "@/components/icons/uiIcons";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EditJobDialog } from '@/components/jobs/EditJobDialog';
import { DeleteJobDialog } from '@/components/jobs/DeleteJobDialog';
import { useAllaRiattivazione } from '@/hooks/useScheda';
import { annuncioScaduto, scadenzaDi, testoScadenza } from "@/lib/scadenzaAnnunci";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { TesseraIcona, TesseraIndietro } from "@/components/ui/Tessera";
import { cn } from "@/lib/utils";

/**
 * I TUOI ANNUNCI — la pagina dell'employer (rifatta l'11 novembre).
 *
 * Tommaso: «un listone poco differenziato, con due tipi di tag poco utili,
 * la possibilità di modificare quelli chiusi, nomi tagliati, informazioni
 * gestite male, poca importanza al tasto per creare annunci nuovi». E:
 * «una lista dei vecchi annunci può essere utile per ripescare qualche
 * candidato passato».
 *
 * - **Pubblica un annuncio**: il bottone grande, a tutta larghezza, in cima.
 *   Era una pillolina «Crea» accanto al titolo.
 * - **Attivi** (sulla mappa adesso), il più vicino alla scadenza per primo:
 *   card con la tessera del mestiere, il titolo intero (due righe), quanto
 *   manca e quante candidature aspettano una risposta; a destra il numero
 *   delle candidature, grande. Era «1 candidatura · scade tra 44 minuti»
 *   su una riga sola, che a 390 px si spezzava in due colonne storte.
 * - **Passati** (scaduti o chiusi): righe leggere in un riquadro solo, dal più
 *   recente, cinque alla volta. Niente «Modifica»: un annuncio che non è più
 *   sulla mappa non si corregge (si poteva, con tanto di «Salva modifiche»).
 *   Toccandoli si aprono le candidature, a cui si può ancora rispondere.
 * - Via le etichette «Scaduto»/«Chiuso» su ogni riga: lo dice la sezione,
 *   e il «quando» lo dice la riga sotto il titolo.
 * - Modifica ed Elimina stanno nella pagina dell'annuncio, non su ogni riga:
 *   tre icone per riga erano rumore, e un cestino a portata di pollice in un
 *   elenco è un incidente che aspetta di succedere.
 * - Ripubblicare NON si può (decisione di Tommaso, 11 novembre): la notifica
 *   «è scaduto» porta qui, alle candidature.
 */

interface Job {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  schedule: string | null;
  category: string | null;
  created_at: string;
  status: string;
  scade_il: string | null;
  tags: string[] | null;
}

interface Annuncio extends Job {
  candidature: number;
  /** In attesa di una risposta (`pending`). */
  daVedere: number;
}

interface Application {
  id: string;
  created_at: string;
  status: string;
  job_id: string;
  applicant: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
}

const PASSATI_ALLA_VOLTA = 5;
const ORE_URGENTE = 6;

/** Sulla mappa adesso: aperto e non scaduto. */
const attivo = (j: Job) => j.status === 'open' && !annuncioScaduto(j);

const data = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).replace('.', '') : '';

/** «il 9 nov», ma «l'8 nov» e «l'11 nov». */
const ilGiorno = (iso: string | null) => {
  const d = data(iso);
  return /^(8|11) /.test(d) ? `l'${d}` : `il ${d}`;
};

/** La riga sotto il titolo di un annuncio passato. */
const quandoPassato = (j: Job) =>
  j.status !== 'open'
    ? `Chiuso · pubblicato ${ilGiorno(j.created_at)}`
    : `Scaduto ${ilGiorno(scadenzaDi(j)?.toISOString() ?? null)}`;

const candidature = (n: number) => `${n} candidatur${n === 1 ? 'a' : 'e'}`;

const Annunci = () => {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<Annuncio | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  const [passatiVisibili, setPassatiVisibili] = useState(PASSATI_ALLA_VOLTA);

  // Edit/Delete dialogs
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);

  /**
   * In react-query e in UNA query sola: gli stati delle candidature arrivano
   * dentro la stessa risposta (`applications(status)`), da cui si contano
   * il totale e quelle da vedere.
   */
  const { data: jobs = [], isLoading: loading, refetch: rileggiAnnunci } = useQuery({
    // Sotto 'jobs': chi crea un annuncio o assume invalida ['jobs'], e cosi'
    // si aggiorna anche questa lista.
    queryKey: ['jobs', 'annunci-employer', user?.id],
    enabled: !!user,
    // Le candidature le mandano altri, in qualunque momento: a ogni visita si
    // mostra subito la cache e si rilegge in background.
    refetchOnMount: 'always',
    queryFn: async (): Promise<Annuncio[]> => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, applications(status)')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(({ applications, ...job }) => {
        const stati = ((applications as unknown as { status: string }[] | null) ?? []).map((a) => a.status);
        return {
          ...(job as unknown as Job),
          candidature: stati.length,
          daVedere: stati.filter((s) => s === 'pending').length,
        };
      });
    },
  });

  // La pagina resta montata (layout/Schede.tsx): si rilegge a ogni ritorno.
  useAllaRiattivazione(() => rileggiAnnunci());

  const attivi = jobs
    .filter(attivo)
    .sort((a, b) => (scadenzaDi(a)?.getTime() ?? 0) - (scadenzaDi(b)?.getTime() ?? 0));
  const passati = jobs
    .filter((j) => !attivo(j))
    .sort((a, b) => (scadenzaDi(b)?.getTime() ?? 0) - (scadenzaDi(a)?.getTime() ?? 0));

  /** Dopo modifica o cancellazione: si rilegge la lista. */
  const fetchJobs = () => queryClient.invalidateQueries({ queryKey: ['jobs', 'annunci-employer'] });

  const fetchApplications = async (jobId: string) => {
    setLoadingApplications(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id, created_at, status, applicant_id, job_id')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // I profili in UNA query (erano una per candidato).
      const ids = [...new Set((data || []).map((a) => a.applicant_id))];
      const { data: profili } = ids.length
        ? await supabase.from('profiles').select('id, full_name, avatar_url, bio, photos').in('id', ids)
        : { data: [] };
      const perId = new Map((profili || []).map((p) => [p.id, p]));

      setApplications(
        (data || []).map((app) => {
          const p = perId.get(app.applicant_id);
          return {
            id: app.id,
            created_at: app.created_at,
            status: app.status,
            job_id: app.job_id,
            applicant: {
              id: app.applicant_id,
              full_name: p?.full_name || null,
              // La prima foto come avatar, se c'è.
              avatar_url: (p?.photos && p.photos.length > 0 ? p.photos[0] : p?.avatar_url) || null,
              bio: p?.bio || null,
            },
          };
        })
      );
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleJobClick = (job: Annuncio) => {
    setSelectedJob(job);
    fetchApplications(job.id);
  };

  /* «?annuncio=<id>»: da una notifica (nuove candidature, in scadenza,
     scaduto) si apre quell'annuncio. Si toglie subito dall'indirizzo, e lo si
     apre appena la lista c'è. `location.key`: la pagina resta montata (§25). */
  const location = useLocation();
  const daAprire = useRef<string | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('annuncio');
    if (!id) return;
    daAprire.current = id;
    navigate('/annunci', { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);
  useEffect(() => {
    const id = daAprire.current;
    const job = id ? jobs.find((j) => j.id === id) : undefined;
    if (!job) return;
    daAprire.current = null;
    handleJobClick(job);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, location.key]);

  const handleBack = () => {
    setSelectedJob(null);
    setApplications([]);
  };

  const handleReject = async (app: Application) => {
    setProcessingAppId(app.id);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', app.id);

      if (error) throw error;

      setApplications(prev =>
        prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a)
      );
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      fetchJobs();
      toast.success('Candidatura rifiutata', { duration: 1500 });
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Errore nel rifiutare la candidatura', { duration: 1500 });
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleAccept = async (app: Application) => {
    if (!user || !selectedJob) return;
    setProcessingAppId(app.id);

    try {
      // 1. Update application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'accepted' })
        .eq('id', app.id);

      if (updateError) throw updateError;

      // 2. Create or get existing chat
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('job_id', app.job_id)
        .eq('worker_id', app.applicant.id)
        .eq('employer_id', user.id)
        .maybeSingle();

      let chatId = existingChat?.id;

      if (!chatId) {
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({
            job_id: app.job_id,
            worker_id: app.applicant.id,
            employer_id: user.id,
          })
          .select('id')
          .single();

        if (chatError) throw chatError;
        chatId = newChat.id;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
        queryClient.invalidateQueries({ queryKey: ['chats'] }),
      ]);
      fetchJobs();

      toast.success('Candidatura accettata! Apri la chat...', { duration: 1500 });
      navigate(`/messaggi?chat=${chatId}`);
    } catch (error) {
      console.error('Error accepting application:', error);
      toast.error('Errore nell\'accettare la candidatura', { duration: 1500 });
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingJob(null);
    fetchJobs();
    // Il titolo nella pagina dell'annuncio si aggiorna alla prossima apertura:
    // la si chiude, così non resta il vecchio.
    setSelectedJob(null);
    toast.success('Annuncio aggiornato!', { duration: 1500 });
  };

  const handleDeleteSuccess = () => {
    setDeletingJob(null);
    setSelectedJob(null);
    fetchJobs();
    toast.success('Annuncio eliminato!', { duration: 1500 });
  };

  const dialoghi = (
    <>
      <EditJobDialog
        job={editingJob}
        isOpen={!!editingJob}
        onClose={() => setEditingJob(null)}
        onSuccess={handleEditSuccess}
      />
      <DeleteJobDialog
        job={deletingJob}
        isOpen={!!deletingJob}
        onClose={() => setDeletingJob(null)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );

  /* ---------------- LA PAGINA DI UN ANNUNCIO: le candidature ---------------- */
  if (selectedJob) {
    const eAttivo = attivo(selectedJob);
    const stato = eAttivo ? testoScadenza(selectedJob) : quandoPassato(selectedJob);
    return (
      <div className="flex flex-col h-full bg-background">
        <Header />

        <main className="flex-1 px-4 pb-4 overflow-y-auto">
          <div className="flex items-start gap-3 mb-3">
            <TesseraIndietro onClick={handleBack} />
            <div className="min-w-0 flex-1 pt-1">
              <h2 className="titolo-sezione text-[22px] leading-tight">{selectedJob.title}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                {eAttivo && <OrologioIcon className="h-4 w-4 shrink-0" />}
                {eAttivo ? `Sulla mappa · ${stato.toLowerCase()}` : stato}
              </p>
            </div>
          </div>

          {/* Le azioni sull'annuncio stanno qui, non su ogni riga dell'elenco.
              Modifica solo se è ancora sulla mappa. Misura normale (44 px):
              sotto quella il bottone vuoto non ha il contorno disegnato. */}
          <div className="mb-4 flex items-center gap-2">
            {eAttivo && (
              <Button variant="outline" onClick={() => setEditingJob(selectedJob)}>
                <PennaIcon className="h-4 w-4" />
                Modifica
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-danger hover:bg-danger-soft hover:text-danger"
              onClick={() => setDeletingJob(selectedJob)}
            >
              <BidoneIcon className="h-4 w-4" />
              Elimina
            </Button>
          </div>

          {!eAttivo && applications.some((a) => a.status === 'pending') && (
            <p className="mb-4 text-sm text-ink-soft">
              Non è più sulla mappa, ma a chi si è candidato puoi ancora rispondere.
            </p>
          )}

          <h3 className="titolo-mini mb-2">Candidature</h3>

          {loadingApplications ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-10">
              <XIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="titolo-vuoto mb-1">Nessuna candidatura</h3>
              <p className="text-sm text-muted-foreground">
                {eAttivo ? 'Ti avvisiamo appena qualcuno si candida.' : 'Nessuno si è candidato a questo annuncio.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="material-card p-4">
                  <div
                    className="flex items-center gap-4 cursor-pointer touch-feedback"
                    onClick={() => navigate(`/profile/${app.applicant.id}`)}
                  >
                    <Avatar seme={app.applicant.id} className="h-14 w-14">
                      <AvatarImage src={app.applicant.avatar_url || undefined} />
                      <AvatarFallback className={`${theme.accentBg} ${theme.primaryText} font-semibold`}>
                        {(app.applicant.full_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">
                        {app.applicant.full_name || 'Utente'}
                      </h4>
                      {app.applicant.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {app.applicant.bio}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {app.status === 'pending' ? (
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          onClick={() => handleReject(app)}
                          disabled={processingAppId === app.id}
                          variant="outline"
                          className="flex-1 touch-feedback"
                        >
                          {processingAppId === app.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XIcon className="h-4 w-4" />
                              Rifiuta
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleAccept(app)}
                          disabled={processingAppId === app.id}
                          className={cn('flex-1 touch-feedback', theme.btnFilled)}
                        >
                          {processingAppId === app.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Accetta
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full flex justify-center">
                        <StatusBadge stato={app.status} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        {dialoghi}
      </div>
    );
  }

  /* ---------------- L'ELENCO ---------------- */
  return (
    <div className="h-full">
      <div className="flex flex-col h-full bg-background">
        <Header />

        <main className="flex-1 px-4 pb-6 overflow-y-auto">
          <h2 className="titolo-sezione mb-3">I tuoi annunci</h2>

          {/* L'azione principale della pagina: grande, a tutta larghezza. */}
          <Button size="lg" className={cn('mb-6 w-full', theme.btnFilled)} onClick={() => navigate('/create-job')}>
            <PiuIcon className="h-5 w-5" />
            Pubblica un annuncio
          </Button>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="material-card p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-8 text-center">
              <TesseraIcona icona={AnnunciVuotaIcon} misura="lg" className="mx-auto mb-4" />
              <h3 className="titolo-vuoto mb-1">Nessun annuncio</h3>
              <p className="mx-auto max-w-[280px] text-sm text-muted-foreground">
                Resta sulla mappa 48 ore, e ti avvisiamo a ogni candidatura.
              </p>
            </div>
          ) : (
            <>
              {/* ---- ATTIVI ---- */}
              <section className="mb-7">
                <h3 className="titolo-mini mb-2">
                  Sulla mappa <span className="text-ink-soft">· {attivi.length}</span>
                </h3>
                {attivi.length === 0 ? (
                  <p className="text-sm text-ink-soft">Nessun annuncio sulla mappa in questo momento.</p>
                ) : (
                  <div className="space-y-3">
                    {attivi.map((job) => (
                      <CardAttivo key={job.id} job={job} onClick={() => handleJobClick(job)} />
                    ))}
                  </div>
                )}
              </section>

              {/* ---- PASSATI ---- */}
              {passati.length > 0 && (
                <section>
                  <h3 className="titolo-mini mb-2">
                    Passati <span className="text-ink-soft">· {passati.length}</span>
                  </h3>
                  <div className="material-card px-4 py-1">
                    {passati.slice(0, passatiVisibili).map((job, i) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => handleJobClick(job)}
                        className={cn(
                          'flex w-full items-center gap-3 py-3 text-left active:opacity-60',
                          i > 0 && 'linea-divisoria-sottile'
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[15px] leading-snug text-ink">{job.title}</p>
                          {/* Testo che scorre, non colonne: con «da vedere» in una
                              colonna a destra la riga si spezzava a metà
                              («· 3 / candidature»). «Da vedere» nell'inchiostro del
                              ruolo: è il motivo per riaprire un annuncio passato. */}
                          <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">
                            {quandoPassato(job)} · {job.candidature > 0 ? candidature(job.candidature) : 'nessuna candidatura'}
                            {job.daVedere > 0 && (
                              <span className="font-semibold text-employer-800"> · {job.daVedere} da vedere</span>
                            )}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                    {passati.length > passatiVisibili && (
                      <button
                        type="button"
                        onClick={() => setPassatiVisibili((n) => n + PASSATI_ALLA_VOLTA)}
                        className="linea-divisoria-sottile w-full py-3 text-center text-sm font-medium text-employer-800 active:opacity-60"
                      >
                        Mostra altri {Math.min(PASSATI_ALLA_VOLTA, passati.length - passatiVisibili)}
                      </button>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </main>

        {dialoghi}
      </div>
    </div>
  );
};

/** Un annuncio sulla mappa: mestiere, titolo intero, quanto manca, candidature. */
function CardAttivo({ job, onClick }: { job: Annuncio; onClick: () => void }) {
  const Icona = getJobIconFromTags(job.tags);
  const scade = scadenzaDi(job);
  const urgente = !!scade && scade.getTime() - Date.now() < ORE_URGENTE * 3600_000;
  return (
    <button
      type="button"
      onClick={onClick}
      className="material-card flex w-full items-center gap-3 p-3.5 text-left touch-feedback"
    >
      <TesseraIcona icona={Icona} />
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{job.title}</h3>
        <p
          className={cn(
            'mt-1 flex items-center gap-1 text-[13px]',
            urgente ? 'font-medium text-warning-soft-foreground' : 'text-ink-soft'
          )}
        >
          <OrologioIcon className="h-3.5 w-3.5 shrink-0" />
          {testoScadenza(job)}
        </p>
        {job.daVedere > 0 && (
          <p className="mt-0.5 text-[13px] font-semibold text-employer-800">
            {job.daVedere} da vedere
          </p>
        )}
      </div>
      {/* Il numero che si cerca scorrendo: in colonna sua, grande. */}
      <div className="flex shrink-0 flex-col items-center px-1">
        <span className="font-[Shinjo,Outfit,sans-serif] text-[26px] leading-none text-employer-800 [font-synthesis:none]">
          {job.candidature}
        </span>
        <span className="mt-1 text-[11px] text-ink-soft">{job.candidature === 1 ? 'candidatura' : 'candidature'}</span>
      </div>
    </button>
  );
}

export default Annunci;
