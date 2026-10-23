import { Header } from "@/components/layout/Header";
import { MapPin, Clock, Euro, SearchX, Tag, Briefcase, FileText } from "lucide-react";
import { XIcon, DocumentoIcon, AnnunciVuotaIcon, CuoreIcon } from "@/components/icons/uiIcons";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { JobDetailsSheet } from "@/components/map/JobDetailsSheet";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { useOpenJobs, useEmployerJobs, Job } from "@/hooks/useJobs";
import { useUserApplications } from "@/hooks/useApplications";
import { JobCardSkeletonList } from "@/components/skeletons/JobCardSkeleton";
import { SwipeNavigator } from "@/components/layout/SwipeNavigator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ApplicationCard, ApplicationCardSkeleton } from "@/components/applications/ApplicationCard";
import { TesseraIcona } from "@/components/ui/Tessera";


const Lista = () => {
  const { user } = useAuth();
  /* ⚠️ Il profilo da UserContext, NON da `useProfile()`: quello lo rileggeva
     dal database a ogni montaggio, cioe' a ogni ritorno sulla tab
     (PageTransition smonta le pagine). Intanto la lista mostrava lo
     scheletro, e la query dei lavori — che dipende dai tag — partiva solo
     dopo: scheletro → contenuto a ogni visita. Qui serve solo `tags`, e
     UserContext ce l'ha gia' in memoria (e aggiornato quando cambiano). */
  const { profile, loading: profileLoading } = useUser();
  const { isEmployer } = useAppTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("explore");

  // Reopen sheet when returning from employer profile
  useEffect(() => {
    const returnJob = location.state?.returnJob;
    if (returnJob) {
      setSelectedJob(returnJob);
      setIsDetailsOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userTags = profile?.tags || [];
  const employerJobsQuery = useEmployerJobs(isEmployer ? user?.id : undefined);
  const workerJobsQuery = useOpenJobs(!isEmployer && userTags.length > 0 ? userTags : undefined);
  const { data: jobs = [], isLoading } = isEmployer ? employerJobsQuery : workerJobsQuery;
  const { data: applications = [], isLoading: applicationsLoading } = useUserApplications(
    !isEmployer ? user?.id : undefined
  );
  const loading = profileLoading || isLoading;

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  return (
    <SwipeNavigator>
      <div className="flex flex-col h-full bg-background">
        <Header title="Lista" titleColor="text-primary" />

        <main className="flex-1 px-4 pb-4 overflow-y-auto">
          {/* Tabs for Workers only */}
          {!isEmployer ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* ⚠️ La scheda ATTIVA usa l'inchiostro, non l'arancione.
                  Nel resto dell'app l'arancione vuol dire "azione": metterlo
                  sulla scheda in cui ti trovi gia' dice la cosa sbagliata.
                  Qui lo stato lo portano il FOGLIO rialzato e il peso del
                  testo — la posizione, non la tinta.

                  ⚠️ Tolto il contatore delle candidature: mostrava il TOTALE,
                  che non chiede niente a nessuno, ma un pallino accanto a
                  un'etichetta promette una novita'. Acceso sempre, smette di
                  essere guardato — e quando ci sara' davvero qualcosa di nuovo
                  non si notera'. Da rimettere quando esistera' lo stato
                  "aggiornata da quando l'hai vista": allora dira' "2 novita'"
                  e varra' la pena.

                  La sagoma sta sulla PISTA e non sulla linguetta: mascherare
                  entrambe farebbe tagliare la seconda dalla prima agli estremi. */}
              <TabsList className="w-full h-12 p-1 mb-4 bg-muted sagoma-quartiere rounded-[19px]">
                <TabsTrigger
                  value="explore"
                  className="linguetta flex-1 h-full rounded-[15px] font-[Shinjo,Outfit,sans-serif] [font-synthesis:none] tracking-[-0.04em] text-[15px] text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                >
                  Esplora
                </TabsTrigger>
                <TabsTrigger
                  value="applications"
                  className="linguetta flex-1 h-full rounded-[15px] font-[Shinjo,Outfit,sans-serif] [font-synthesis:none] tracking-[-0.04em] text-[15px] text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                >
                  Candidature
                </TabsTrigger>
              </TabsList>

              <TabsContent value="explore" className="mt-0 focus-visible:outline-none">
                <h2 className="titolo-sezione mb-3">
                  Impieghi per Te
                </h2>
                <JobsList 
                  jobs={jobs} 
                  loading={loading} 
                  isEmployer={isEmployer} 
                  hasTags={userTags.length > 0} 
                  onJobClick={handleJobClick} 
                />
              </TabsContent>

              <TabsContent value="applications" className="mt-0 focus-visible:outline-none">
                <h2 className="titolo-sezione mb-3">
                  Stato Candidature
                </h2>
                <ApplicationsList 
                  applications={applications} 
                  loading={applicationsLoading} 
                  userId={user?.id || ""} 
                />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <h2 className="titolo-sezione mb-3">
                I tuoi Annunci
              </h2>
              <JobsList 
                jobs={jobs} 
                loading={loading} 
                isEmployer={isEmployer} 
                hasTags={userTags.length > 0} 
                onJobClick={handleJobClick} 
              />
            </>
          )}
        </main>

        <JobDetailsSheet
          job={selectedJob ? {
            ...selectedJob,
            lat: selectedJob.lat || 0,
            lng: selectedJob.lng || 0,
            schedule: selectedJob.schedule || undefined,
            tags: selectedJob.tags || undefined,
            profiles: selectedJob.profiles || undefined,
          } : null}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          showMiniMap={true}
        />
      </div>
    </SwipeNavigator>
  );
};

interface JobsListProps {
  jobs: Job[];
  loading: boolean;
  isEmployer: boolean;
  hasTags: boolean;
  onJobClick: (job: Job) => void;
  /**
   * Cosa dire sotto il titolo: la ZONA (in Lista, dove la mappa non c'è) o
   * l'ATTIVITÀ (nella lista di una zona della mappa, dove il quartiere è già
   * nel titolo e ripeterlo su ogni card non direbbe niente).
   */
  sottoTitolo?: "zona" | "attivita";
  /** Annunci che corrispondono alla ricerca della mappa: tessera nei colori del pin evidenziato. */
  evidenziati?: Set<string>;
}

export function JobsList({ jobs, loading, isEmployer, hasTags, onJobClick, sottoTitolo = "zona", evidenziati }: JobsListProps) {
  if (loading) {
    return <JobCardSkeletonList count={5} />;
  }

  if (jobs.length === 0) {
    return <EmptyState isEmployer={isEmployer} hasTags={hasTags} />;
  }

  /* LA CARD DELL'ANNUNCIO IN LISTA — tessera col mestiere, titolo, e una
     riga «zona · paga» (Tommaso, 21 ottobre: «tante informazioni messe male
     ed evitabili»). Il resto (tag, orario, descrizione) sta nella scheda che
     si apre toccandola. Qui restano le tre domande con cui si sceglie su cosa
     toccare: che lavoro è, dove (in Lista la mappa non c'è a dirlo), quanto
     paga (il secondo criterio: senza, per confrontare bisognerebbe aprirli
     tutti). Tolti: i tag (l'icona dice già il mestiere), l'orario, il «ieri»
     (la lista è già dalla più recente).
     La paga sta A DESTRA, in colonna sua (Tommaso: «a sinistra pieno, a
     destra bianco, sbilanciato»): è anche il posto dove l'occhio la cerca
     scorrendo, come il prezzo su Subito o la paga su Indeed, e i valori si
     confrontano in colonna invece che in mezzo a una frase.
     ⚠️ Prima la paga era «€ 9€/h» — l'euro due volte, perché il campo è
     libero e spesso lo contiene già — e in arancio pastello a ~1,9:1. */
  return (
    <div className="space-y-3 card-tilt">
      {jobs.map((job) => {
        const Icon = getJobIconFromTags(job.tags);
        const zona =
          sottoTitolo === "attivita"
            ? job.profiles?.full_name || null
            : job.neighborhood || ((job.lat && job.lng) ? "Genova" : null);

        return (
          <div
            key={job.id}
            className="material-card flex cursor-pointer items-center gap-3 p-3.5 touch-feedback"
            onClick={() => onJobClick(job)}
          >
            <TesseraIcona icona={Icon} evidenziata={evidenziati?.has(job.id)} />
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{job.title}</h3>
              {zona && <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{zona}</p>}
            </div>
            {job.price && (
              <p className="max-w-[38%] shrink-0 text-right text-[15px] font-semibold leading-snug text-primary-strong line-clamp-2">
                {job.price}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ApplicationsListProps {
  applications: import("@/hooks/useApplications").Application[];
  loading: boolean;
  userId: string;
}

function ApplicationsList({ applications, loading, userId }: ApplicationsListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <ApplicationCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <TesseraIcona icona={DocumentoIcon} misura="lg" className="mb-4" />
        <h3 className="titolo-vuoto mb-2">Nessuna candidatura</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Non hai ancora inviato candidature. Esplora gli annunci e candidati!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 card-tilt">
      {applications.map((application) => (
        <div key={application.id}>
          <ApplicationCard application={application} userId={userId} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ isEmployer, hasTags }: { isEmployer: boolean; hasTags: boolean }) {
  if (isEmployer) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <TesseraIcona icona={AnnunciVuotaIcon} misura="lg" className="mb-4" />
        <h3 className="titolo-vuoto mb-2">Nessun annuncio creato</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Crea il tuo primo annuncio di lavoro per trovare lavoratori
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <TesseraIcona icona={hasTags ? XIcon : CuoreIcon} misura="lg" className="mb-4" />
      <h3 className="titolo-vuoto mb-2">
        {hasTags ? "Nessun lavoro trovato" : "Imposta i tuoi interessi"}
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-4">
        {hasTags 
          ? "Non ci sono lavori che corrispondono ai tuoi tag. Prova a modificarli o cerca sulla Mappa!" 
          : "Seleziona i tag nel tuo profilo per vedere i lavori personalizzati per te"
        }
      </p>
      <Link 
        to="/profilo" 
        className="px-4 py-2 bg-primary text-primary-foreground sagoma-chip rounded-full text-sm font-medium touch-feedback"
      >
        {hasTags ? "Modifica Tag" : "Vai al Profilo"}
      </Link>
    </div>
  );
}

export default Lista;
