import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, Users, ChevronRight, Clock, Euro, ArrowLeft, MessageCircle, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EditJobDialog } from '@/components/jobs/EditJobDialog';
import { DeleteJobDialog } from '@/components/jobs/DeleteJobDialog';

interface Job {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  schedule: string | null;
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
  
  // Edit/Delete dialogs
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    if (!user) return;

    try {
      // Calculate 48 hours ago
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      // Fetch employer's jobs from last 48 hours
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('owner_id', user.id)
        .gte('created_at', fortyEightHoursAgo)
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

  useEffect(() => {
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
    navigate('/messaggi');
  };

  const handleEditClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setEditingJob(job);
  };

  const handleDeleteClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setDeletingJob(job);
  };

  const handleEditSuccess = () => {
    setEditingJob(null);
    fetchJobs(); // Refresh the list
    toast.success('Annuncio aggiornato!', { duration: 2000 });
  };

  const handleDeleteSuccess = () => {
    setDeletingJob(null);
    fetchJobs(); // Refresh the list
    toast.success('Annuncio eliminato!', { duration: 2000 });
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
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Title + Candidature */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {job.applicationCount} candidatur{job.applicationCount === 1 ? 'a' : 'e'}
                    </p>
                  </div>

                  {/* Right: Edit/Delete + Chevron */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleEditClick(e, job)}
                      className="h-8 w-8 rounded-full hover:bg-blue-100"
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(e, job)}
                      className="h-8 w-8 rounded-full hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Edit Dialog */}
      <EditJobDialog
        job={editingJob}
        isOpen={!!editingJob}
        onClose={() => setEditingJob(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Dialog */}
      <DeleteJobDialog
        job={deletingJob}
        isOpen={!!deletingJob}
        onClose={() => setDeletingJob(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default Annunci;
