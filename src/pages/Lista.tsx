import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { MapPin, Clock, Euro, SearchX, Tag, Briefcase } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { TagBadges } from "@/components/tags/TagSelector";
import { Link } from "react-router-dom";
import { JobDetailsSheet } from "@/components/map/JobDetailsSheet";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { isRoleTag } from "@/constants/tags";
import { useOpenJobs, useEmployerJobs, Job } from "@/hooks/useJobs";
import { JobCardSkeletonList } from "@/components/skeletons/JobCardSkeleton";

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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const isEmployer = profile?.role === "employer";
  const userTags = profile?.tags || [];

  // Use React Query for caching - conditionally based on role
  const employerJobsQuery = useEmployerJobs(isEmployer ? user?.id : undefined);
  const workerJobsQuery = useOpenJobs(!isEmployer && userTags.length > 0 ? userTags : undefined);

  // Select the right query based on role
  const { data: jobs = [], isLoading } = isEmployer ? employerJobsQuery : workerJobsQuery;

  // Show loading while profile is loading
  const loading = profileLoading || isLoading;

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 px-4 pb-20 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-3">
          {isEmployer ? "I Tuoi Annunci" : "Impieghi per Te"}
        </h2>
        
        {loading ? (
          <JobCardSkeletonList count={5} />
        ) : jobs.length === 0 ? (
          <EmptyState isEmployer={isEmployer} hasTags={userTags.length > 0} />
        ) : (
          <div className="space-y-3">
            {jobs.map((job, index) => {
              // Get dynamic icon based on role tags
              const roleTag = job.tags?.find(t => isRoleTag(t));
              const Icon = getJobIconFromTags(job.tags);
              const roleLabel = roleTag || "Generale";
              
              return (
                <div 
                  key={job.id} 
                  className="material-card p-4 animate-fade-in cursor-pointer hover:shadow-md transition-shadow"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => handleJobClick(job)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-accent text-accent-foreground rounded-2xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{job.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{roleLabel}</p>
                      
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
                        {job.lat && job.lng && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            Genova
                          </span>
                        )}
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
        )}
      </main>

      <BottomNav />

      {/* Job Details Sheet */}
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
        onClose={handleCloseDetails}
      />
    </div>
  );
};

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
        className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        {hasTags ? "Modifica Tag" : "Vai al Profilo"}
      </Link>
    </div>
  );
}

export default Lista;
