import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GalleryDialog } from "@/components/profile/GalleryDialog";
import { JobDetailsSheet } from "@/components/map/JobDetailsSheet";
import { OrologioIcon, CalendarioIcon, IndietroIcon, StellaIcon, DocumentoIcon, FotoIcon, AnnunciAttiviIcon, MappaIcon, StoricoLavoriIcon, AnnunciVuotaIcon, CuoreIcon } from "@/components/icons/uiIcons";
import { useCuoriWorker } from "@/hooks/useCuoriWorker";
import { GenericoIcon } from "@/components/icons/roleIcons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useUser } from "@/contexts/UserContext";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { adessoISO } from "@/lib/scadenzaAnnunci";
import { TesseraIcona, TesseraIndietro } from "@/components/ui/Tessera";
import { LinkSocial } from "@/components/profile/LinkSocial";
import { Foglietto } from "@/components/ui/Foglietto";
import { RecensioniRicevute } from "@/components/reviews/RecensioniRicevute";
import { mediaRecensioni, useRecensioniRicevute } from "@/hooks/useRecensioni";
import { FotoStampata } from "@/components/ui/FotoStampata";
import { numeroDa, Scotch, type StrisciaScotch } from "@/components/ui/Scotch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { SocialLinks } from "@/contexts/UserContext";

// Tag durata usati prima della rinomina, ancora presenti su annunci vecchi

/* Le foto: il pezzo lungo in alto al centro, uno solo (Tommaso). Il
   disordine lo davano i pezzi in diagonale sugli angoli. */
const SCOTCH_FOTO: StrisciaScotch[] = [{ pezzo: "lungo", lato: "centro" }];

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  address_text: string | null;
  neighborhood: string | null;
  role: "worker" | "employer";
  photos: string[];
  looking_for: string | null;
  experience: string | null;
  social_links?: SocialLinks | null;
}

interface CompletedJob {
  id: string;
  applicationId: string;
  title: string;
  employerName: string;
  completedAt: string;
  tags: string[];
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  category: string | null;
  schedule: string | null;
  neighborhood: string | null;
  created_at: string;
  tags: string[];
}


/** «3,5», non «3.5»: la virgola dei decimali, in italiano. */
const votoItaliano = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { data: cuori } = useCuoriWorker(userId);
  const navigate = useNavigate();
  const { theme } = useAppTheme();
  const { isEmployer } = useUser();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: reviews = [] } = useRecensioniRicevute(profile?.role === "employer" ? userId : undefined);
  const reviewStats = mediaRecensioni(reviews);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      setLoading(true);
      
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        
        if (profileError) throw profileError;
        
        if (profileData) {
          setProfile({
            ...profileData,
            photos: profileData.photos || [],
            social_links: profileData.social_links as SocialLinks | null,
          });

          // If employer profile, fetch reviews
          if (profileData.role === "employer") {
            // Le recensioni le legge `useRecensioniRicevute` (tutte, in cache).

            // Gli annunci attivi: aperti e non scaduti (lib/scadenzaAnnunci.ts).
            const { data: jobsData, error: jobsError } = await supabase
              .from("jobs")
              .select("*")
              .eq("owner_id", userId)
              .eq("status", "open")
              .gt("scade_il", adessoISO())
              .order("created_at", { ascending: false });
            
            if (!jobsError) {
              setJobs((jobsData || []).map(j => ({ ...j, tags: j.tags || [] })));
            }
          }

          // If worker profile, fetch completed jobs
          if (profileData.role === "worker") {
            const { data: applicationsData, error: applicationsError } = await supabase
              .from("applications")
              .select(`
                id,
                updated_at,
                job_id,
                jobs (
                  id,
                  title,
                  tags,
                  owner_id,
                  profiles!jobs_owner_id_fkey (
                    full_name
                  )
                )
              `)
              .eq("applicant_id", userId)
              .eq("status", "completed")
              .order("updated_at", { ascending: false });

            if (!applicationsError && applicationsData) {
              const formattedJobs: CompletedJob[] = applicationsData.map((app: any) => ({
                id: app.jobs?.id || app.job_id,
                applicationId: app.id,
                title: app.jobs?.title || "Lavoro",
                employerName: app.jobs?.profiles?.full_name || "Attività",
                completedAt: app.updated_at,
                tags: app.jobs?.tags || [],
              }));
              setCompletedJobs(formattedJobs);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching public profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const nextPhoto = () => {
    if (profile?.photos && profile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length);
    }
  };

  const prevPhoto = () => {
    if (profile?.photos && profile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header showSearch={false} />
        <main className="flex-1 pb-20 px-4">
          <div className="py-4 space-y-6">
            {/* Loading skeleton */}
            <div className="flex justify-center">
              <Skeleton className="w-32 h-32 rounded-full" />
            </div>
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header showSearch={false} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="titolo-vuoto mb-2">Profilo non trovato</h2>
            <p className="text-muted-foreground mb-4">L'utente richiesto non esiste.</p>
            <Button onClick={() => navigate(-1)}>
              <IndietroIcon className="w-4 h-4 mr-2" />
              Torna indietro
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const displayName = profile.full_name || "Utente";
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const hasPhotos = profile.photos && profile.photos.length > 0;
  const avatarUrl = hasPhotos ? profile.photos[0] : profile.avatar_url;

  // Determine if viewing a worker or employer profile
  const isWorkerProfile = profile.role === "worker";
  // I worker mostrano solo il quartiere, le attività l'indirizzo.
  const luogo = isWorkerProfile ? profile.neighborhood : profile.address_text;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header showSearch={false} />

      <main className="flex-1 pb-20 overflow-y-auto">
        {/* Back Button */}
        <div className="px-4 py-2">
          <TesseraIndietro onClick={() => navigate(-1)} />
        </div>

        {/* Profile Header - CV Style */}
        <div className="px-4 pb-6">
          {/* Avatar - Large, Circular, Centered */}
          <div className="flex justify-center mb-4">
            {/* Cerchio imperfetto (ui/avatar): via il bordo bianco e l'ombra,
                che il ritaglio taglierebbe a tratti. */}
            {/* Lo scotch è un FRATELLO dell'avatar: il cerchio imperfetto è un
                ritaglio, e lo taglierebbe. Un pezzettino piccolo, al centro. */}
            <div className="relative">
              <Avatar seme={userId} className="w-32 h-32">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} className="object-cover" />
                <AvatarFallback className={`${isWorkerProfile ? 'bg-accent text-primary-strong' : 'bg-employer-50 text-employer-800'} text-4xl font-bold`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Scotch pezzo="strappato" lato="centro" seme={numeroDa(userId || "avatar")} employer={!isWorkerProfile} scala={0.8} />
            </div>
          </div>

          {/* L'INTESTAZIONE: tre righe, non cinque (Tommaso, 24 ottobre). Erano
              nome, pillola del ruolo, indirizzo, sito e una fila di stelle,
              ognuno su una riga sua e centrato: un elenco, non un'intestazione.
              - Via la pillola «Employer»/«Worker»: a un profilo ci si arriva da
                un annuncio o da una candidatura, il ruolo lo si sa già (e lo
                dice il colore).
              - Voto e zona in UNA riga, come Airbnb e Google Maps: «★ 3,5 (6) ·
                piazza delle erbe». Una stella sola: col numero scritto, la fila
                di cinque ripeteva lo stesso dato. Toccandolo si va alle recensioni. */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {(reviewStats || luogo) && (
              <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-muted-foreground">
                {reviewStats && !isWorkerProfile && (
                  <button
                    type="button"
                    onClick={() => document.getElementById("recensioni")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    aria-label={`${votoItaliano(reviewStats.avg)} su 5, ${reviewStats.count} recensioni: vai alle recensioni`}
                    className="inline-flex items-center gap-1"
                  >
                    <StellaIcon className="h-4 w-4 text-employer-800" />
                    <span className="font-semibold text-foreground">{votoItaliano(reviewStats.avg)}</span>
                    <span>({reviewStats.count})</span>
                  </button>
                )}
                {reviewStats && !isWorkerProfile && luogo && <span aria-hidden="true">·</span>}
                {luogo && (
                  <span className="inline-flex items-center gap-1">
                    <MappaIcon className="h-4 w-4 shrink-0" />
                    {luogo}
                  </span>
                )}
              </p>
            )}

            {/* Prima qui non c'erano: si scrivevano nell'onboarding e li vedeva
                solo il proprietario. Per un'attività il sito e l'Instagram sono
                il modo di capire chi è prima di candidarsi. */}
            <LinkSocial social={profile.social_links} employer={!isWorkerProfile} className="mt-1" />
          </div>
        </div>

        {/* Photo Gallery */}
        {profile.photos && profile.photos.length > 1 && (
          <div className="px-4 pb-6">
            <Foglietto seme="riquadro-foto" employer={!isWorkerProfile} scotch={[{ pezzo: "corto", lato: "sopraSx" }]}>
            <div className="material-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <FotoIcon className={`w-5 h-5 ${isWorkerProfile ? 'text-primary-strong' : 'text-employer-800'}`} />
                <h3 className="font-bold text-lg">Foto</h3>
                <span className="text-muted-foreground text-sm">({profile.photos.length})</span>
              </div>
              
              {/* Foto STAMPATE (ui/FotoStampata): ognuna storta a modo suo e
                  tenuta da un pezzo di scotch diverso. Più spazio fra le
                  righe: lo scotch esce sopra la foto. ⚠️ Il fuoco da tastiera
                  resta sul bottone, fuori dalla stampa. */}
              <div className="grid grid-cols-3 gap-x-3 gap-y-5 pt-2">
                {profile.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setGalleryIndex(index);
                      setIsGalleryOpen(true);
                    }}
                    aria-label={`Apri la foto ${index + 1}`}
                    className="block w-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <FotoStampata
                      seme={photo}
                      employer={!isWorkerProfile}
                      scotch={SCOTCH_FOTO}
                    >
                      <img src={photo} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
                    </FotoStampata>
                  </button>
                ))}
              </div>
            </div>
            </Foglietto>
          </div>
        )}

        {/* Photo Gallery Dialog */}
        <GalleryDialog
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          photos={profile.photos || []}
          currentIndex={galleryIndex}
          onIndexChange={setGalleryIndex}
          employer={!isWorkerProfile}
        />

        {isWorkerProfile && (
          <>
            {/* Sezione 1: Presentazione (Bio) */}
            <div className="px-4 pb-6">
              <Foglietto seme="presentazione" employer={false} scotch={[{ pezzo: "cortoB", lato: "sopraDx" }]}>
              <div className="material-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <DocumentoIcon className="w-5 h-5 text-primary-strong" />
                  <h3 className="font-bold text-lg">Presentazione</h3>
                </div>
                <p className="text-foreground leading-relaxed">
                  {profile.bio || "Nessuna presentazione inserita."}
                </p>
              </div>
              </Foglietto>
            </div>

            {/* Sezione 2: Esperienze (if available) */}
            {profile.experience && (
              <div className="px-4 pb-6">
                <Foglietto seme="esperienze" employer={false} scotch={[{ pezzo: "corto", lato: "sopraSx" }]}>
                <div className="material-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <GenericoIcon className="w-5 h-5 text-primary-strong" />
                    <h3 className="font-bold text-lg">Esperienze</h3>
                  </div>
                  <p className="text-foreground leading-relaxed">{profile.experience}</p>
                </div>
                </Foglietto>
              </div>
            )}

            {/* Sezione 3: Storico lavori Completati */}
            <div className="px-4 pb-6">
              <div className="material-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <StoricoLavoriIcon className="w-5 h-5 text-primary-strong" />
                  <h3 className="font-bold text-lg">Storico lavori</h3>
                </div>
                
                {completedJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AnnunciVuotaIcon className="w-10 h-10 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-sm">Nessun lavoro completato ancora</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedJobs.map((job) => {
                      const Icon = getJobIconFromTags(job.tags);
                      
                      return (
                        <div
                          key={job.applicationId}
                          className="flex items-start gap-3 p-3 rounded-xl bg-card border-2 border-primary/30"
                        >
                          <div className="flex items-center justify-center shrink-0">
                            <Icon className="w-11 h-11 text-primary-strong" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{job.title}</h4>
                            <p className="text-xs text-muted-foreground">{job.employerName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <CalendarioIcon className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatDate(job.completedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            {/* Era un badge a contorno con testo in arancio pastello
                                (1,8:1): lo stato «Concluso» ha la sua sorgente unica. */}
                            <StatusBadge stato="completed" />
                            {/* Il cuore dell'attività: pubblico, è la reputazione
                                del worker. Senza cuore non si mostra niente. */}
                            {cuori?.has(job.applicationId) && (
                              <span className="flex items-center gap-1 text-xs font-medium text-primary-strong">
                                <CuoreIcon className="h-4 w-4" aria-hidden="true" />
                                Cuore
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* EMPLOYER PROFILE SECTIONS */}
        {!isWorkerProfile && (
          <>
            {/* Bio Section */}
            {profile.bio && (
              <div className="px-4 pb-6">
                <Foglietto seme="chi-siamo" employer scotch={[{ pezzo: "cortoB", lato: "sopraDx" }]}>
                <div className="material-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <DocumentoIcon className="w-5 h-5 text-employer-800" />
                    <h3 className="font-bold text-lg">Chi siamo</h3>
                  </div>
                  <p className="text-foreground leading-relaxed">{profile.bio}</p>
                </div>
                </Foglietto>
              </div>
            )}

            {/* Looking For Section */}
            {profile.looking_for && (
              <div className="px-4 pb-6">
                <Foglietto seme="chi-cerchiamo" employer scotch={[{ pezzo: "corto", lato: "sopraSx" }]}>
                <div className="material-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <GenericoIcon className="w-5 h-5 text-employer-800" />
                    <h3 className="font-bold text-lg">Chi cerchiamo</h3>
                  </div>
                  <p className="text-foreground leading-relaxed">{profile.looking_for}</p>
                </div>
                </Foglietto>
              </div>
            )}

            {/* Reviews Section — `id`: ci porta il voto in testa al profilo.
                `scroll-mt` perché lo scotch sopra la card resti in vista. */}
            <div id="recensioni" className="scroll-mt-6 px-4 pb-6">
              <Foglietto seme="recensioni" employer scotch={[{ pezzo: "cortoB", lato: "sopraDx" }]}>
              <div className="material-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <StellaIcon className="w-5 h-5 text-employer-800" />
                  <h3 className="font-bold text-lg">Recensioni</h3>
                </div>
                <RecensioniRicevute recensioni={reviews} />
              </div>
              </Foglietto>
            </div>

            {/* Active Jobs Section */}
            <div className="px-4 pb-6">
              <div className="material-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AnnunciAttiviIcon className="w-5 h-5 text-employer-800" />
                  <h3 className="font-bold text-lg">Annunci attivi</h3>
                </div>
                
                {jobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <TesseraIcona icona={AnnunciVuotaIcon} misura="lg" className="mb-3" />
                    <p className="text-muted-foreground text-sm">Nessun annuncio attivo</p>
                  </div>
                ) : (
                  /* RIGHE, non card dentro la card (Tommaso, 23 ottobre: «brutto»).
                     Prima: un riquadro grigio con un bordo CSS da 1 px dentro la
                     card disegnata, l'icona in un quadratino CSS pastello e la
                     paga «€ 9€/h» col doppio euro. Ora la stessa riga della Lista
                     — tessera col mestiere, titolo, orario, paga a destra in
                     inchiostro — divise dalla linea sottile come la lista chat. */
                  <div className="-mb-2">
                    {jobs.map((job, i) => {
                      const Icon = getJobIconFromTags(job.tags);
                      return (
                        <button
                          key={job.id}
                          onClick={() => {
                            setSelectedJob(job);
                            setIsJobDetailsOpen(true);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 py-3 text-left transition-colors active:bg-accent/40",
                            i > 0 && "linea-divisoria-sottile"
                          )}
                        >
                          <TesseraIcona icona={Icon} />
                          <div className="min-w-0 flex-1">
                            <h4 className="line-clamp-2 text-[15px] font-semibold leading-snug">{job.title}</h4>
                            {job.schedule && (
                              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted-foreground">
                                <OrologioIcon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{job.schedule}</span>
                              </p>
                            )}
                          </div>
                          {job.price && (
                            <p
                              className={cn(
                                "line-clamp-2 max-w-[38%] shrink-0 text-right text-[15px] font-semibold leading-snug",
                                // L'inchiostro del ruolo di chi guarda, come in Lista: mai il pastello.
                                isEmployer ? "text-employer-800" : "text-primary-strong"
                              )}
                            >
                              {job.price}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Job Details Sheet */}
        <JobDetailsSheet 
          job={selectedJob ? {
            id: selectedJob.id,
            title: selectedJob.title,
            description: selectedJob.description,
            price: selectedJob.price,
            category: selectedJob.category,
            schedule: selectedJob.schedule,
            tags: selectedJob.tags,
            lat: 0,
            lng: 0,
            owner_id: userId || "",
            status: "open",
            neighborhood: selectedJob.neighborhood || profile?.neighborhood || null,
            profiles: profile ? {
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              photos: profile.photos,
              address_text: profile.address_text
            } : undefined
          } : null} 
          isOpen={isJobDetailsOpen} 
          onClose={() => setIsJobDetailsOpen(false)} 
        />
      </main>

      <BottomNav />
    </div>
  );
};

export default PublicProfile;