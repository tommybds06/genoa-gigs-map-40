import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, Users, ChevronRight, Clock, Euro, ArrowLeft, MessageCircle, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface Job {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  category: string | null;
  created_at: string;
  status: string;
}

interface Application {
  id: string;
  created_at: string;
  status: string;
  applicant: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    level: number;
  };
}

interface JobWithCount extends Job {
  applicationCount: number;
}

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

const Annunci = () => {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return;

      try {
        // Fetch employer's jobs
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (jobsError) throw jobsError;

        // Fetch application counts for each job
        const jobsWithCounts = await Promise.all(
          (jobsData || []).map(async (job) => {
            const { count } = await supabase
              .from('applications')
              .select('*', { count: 'exact', head: true })
              .eq('job_id', job.id);

            return {
              ...job,
              applicationCount: count || 0,
            };
          })
        );

        setJobs(jobsWithCounts);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user]);

  const fetchApplications = async (jobId: string) => {
    setLoadingApplications(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          status,
          applicant_id
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data for each applicant
      const applicationsWithProfiles = await Promise.all(
        (data || []).map(async (app) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, bio, level')
            .eq('id', app.applicant_id)
            .single();

          return {
            id: app.id,
            created_at: app.created_at,
            status: app.status,
            applicant: profile || {
              id: app.applicant_id,
              full_name: null,
              avatar_url: null,
              bio: null,
              level: 1,
            },
          };
        })
      );

      setApplications(applicationsWithProfiles);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    fetchApplications(job.id);
  };

  const handleBack = () => {
    setSelectedJob(null);
    setApplications([]);
  };

  const handleChatClick = (applicantId: string) => {
    // Navigate to messages tab (simulating opening a chat)
    navigate('/messaggi');
  };

  if (selectedJob) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        
        <main className="flex-1 px-4 pb-20 overflow-y-auto">
          {/* Back button and job title */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">{selectedJob.title}</h2>
              <p className="text-sm text-muted-foreground">Candidature ricevute</p>
            </div>
          </div>

          {loadingApplications ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">Nessuna candidatura</h3>
              <p className="text-sm text-muted-foreground">
                Non ci sono ancora candidati per questo annuncio
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="material-card p-4 flex items-center gap-4"
                >
                  <Avatar className="h-14 w-14 border-2 border-blue-600/20">
                    <AvatarImage src={app.applicant.avatar_url || undefined} />
                    <AvatarFallback className={`${theme.accentBg} ${theme.primaryText} font-semibold`}>
                      {(app.applicant.full_name || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">
                      {app.applicant.full_name || 'Utente'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Lv. {app.applicant.level}
                    </p>
                    {app.applicant.bio && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {app.applicant.bio}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => handleChatClick(app.applicant.id)}
                    className={`${theme.btnFilled} ${theme.btnFilledHover} rounded-full px-4`}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chatta
                  </Button>
                </div>
              ))}
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 px-4 pb-20 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">I Tuoi Annunci Pubblicati</h2>
          <Button
            onClick={() => navigate('/create-job')}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Crea
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="material-card p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-muted rounded-2xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className={`h-12 w-12 ${theme.primaryText} mx-auto mb-3`} />
            <h3 className="font-semibold text-lg mb-1">Nessun annuncio</h3>
            <p className="text-sm text-muted-foreground">
              Non hai ancora creato annunci di lavoro
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job)}
                className="material-card p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${theme.accentBg} rounded-2xl flex items-center justify-center shrink-0`}>
                    <Briefcase className={`h-6 w-6 ${theme.primaryText}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{job.title}</h3>
                      {job.applicationCount > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                          {job.applicationCount}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(job.created_at)}
                      </span>
                      {job.price && (
                        <span className="flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {job.price}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      <Users className="h-3 w-3 inline mr-1" />
                      {job.applicationCount} candidatur{job.applicationCount === 1 ? 'a' : 'e'}
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Annunci;
