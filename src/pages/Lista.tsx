import { Header } from "@/components/layout/Header";
import { MapPin, Clock, Euro, SearchX, Tag, Briefcase, FileText } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAppTheme } from "@/hooks/useAppTheme";
import { TagBadges } from "@/components/tags/TagSelector";
import { Link } from "react-router-dom";
import { JobDetailsSheet } from "@/components/map/JobDetailsSheet";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { isRoleTag } from "@/constants/tags";
import { useOpenJobs, useEmployerJobs, Job } from "@/hooks/useJobs";
import { useUserApplications } from "@/hooks/useApplications";
import { JobCardSkeletonList } from "@/components/skeletons/JobCardSkeleton";
import { SwipeNavigator } from "@/components/layout/SwipeNavigator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ApplicationCard, ApplicationCardSkeleton } from "@/components/applications/ApplicationCard";

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  return `${diffDays} giorni fa`;
}

const Lista = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { isEmployer } = useAppTheme();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("explore");

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
              <TabsList className="w-full h-12 p-1 mb-4 bg-muted rounded-xl">
                <TabsTrigger 
                  value="explore" 
                  className="flex-1 h-full rounded-lg font-semibold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200"
                >
                  Esplora
                </TabsTrigger>
                <TabsTrigger 
                  value="applications" 
                  className="flex-1 h-full rounded-lg font-semibold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200"
                >
                  Le mie Candidature
                  {applications.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                      {applications.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="explore" className="mt-0 focus-visible:outline-none">
                <h2 className="text-lg font-semibold mb-3 text-foreground">
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
                <h2 className="text-lg font-semibold mb-3 text-foreground">
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
              <h2 className="text-lg font-semibold mb-3 text-foreground">
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
}

function JobsList({ jobs, loading, isEmployer, hasTags, onJobClick }: JobsListProps) {
  if (loading) {
    return <JobCardSkeletonList count={5} />;
  }

  if (jobs.length === 0) {
    return <EmptyState isEmployer={isEmployer} hasTags={hasTags} />;
  }

  return (
    <div className="space-y-3">
      {jobs.map((job, index) => {
        const roleTag = job.tags?.find(t => isRoleTag(t));
        const Icon = getJobIconFromTags(job.tags);
        const roleLabel = roleTag || "Generale";
        
        return (
          <div 
            key={job.id} 
            className="material-card p-4 cursor-pointer touch-feedback"
            onClick={() => onJobClick(job)}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-accent text-accent-foreground rounded-2xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate mb-2">{job.title}</h3>
                
                {job.tags && job.tags.length > 0 && (
                  <TagBadges tags={job.tags} className="mb-2" />
                )}
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  {job.schedule && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {job.schedule}
                    </span>
                  )}
                  {(job.lat && job.lng) || job.neighborhood ? (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.neighborhood || "Genova"}
                    </span>
                  ) : null}
                  {job.price && (
                    <span className="inline-flex items-center gap-1 text-primary font-semibold">
                      <Euro className="w-3.5 h-3.5" />
                      {job.price}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" />
                {getTimeAgo(job.created_at)}
              </span>
            </div>
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
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Nessuna candidatura</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Non hai ancora inviato candidature. Esplora gli annunci e candidati!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Briefcase className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Nessun annuncio creato</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Crea il tuo primo annuncio di lavoro per trovare lavoratori
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        {hasTags ? (
          <SearchX className="w-8 h-8 text-muted-foreground" />
        ) : (
          <Tag className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="font-semibold text-lg mb-2">
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
        className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium touch-feedback"
      >
        {hasTags ? "Modifica Tag" : "Vai al Profilo"}
      </Link>
    </div>
  );
}

export default Lista;
