import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, Users, ChevronRight, ArrowLeft, Loader2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { IndietroIcon, PennaIcon, BidoneIcon, XIcon } from '@/components/icons/uiIcons';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  job_id: string;
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
  const queryClient = useQueryClient();
  const [jobs, setJobs] = useState<JobWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  
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
          applicant_id,
          job_id
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data for each applicant (include photos for avatar)
      const applicationsWithProfiles = await Promise.all(
        (data || []).map(async (app) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, bio, level, photos')
            .eq('id', app.applicant_id)
            .single();

          // Use first photo as avatar if available
          const avatarUrl = profile?.photos && profile.photos.length > 0 
            ? profile.photos[0] 
            : profile?.avatar_url;

          return {
            id: app.id,
            created_at: app.created_at,
            status: app.status,
            job_id: app.job_id,
            applicant: {
              id: profile?.id || app.applicant_id,
              full_name: profile?.full_name || null,
              avatar_url: avatarUrl || null,
              bio: profile?.bio || null,
              level: profile?.level || 1,
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

  const handleReject = async (app: Application) => {
    setProcessingAppId(app.id);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', app.id);

      if (error) throw error;

      // Update local state
      setApplications(prev => 
        prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a)
      );
      
      // Invalidate cache
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      
      toast.success('Candidatura rifiutata', { duration: 2000 });
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Errore nel rifiutare la candidatura', { duration: 2000 });
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

      // Invalidate caches for instant UI refresh
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
        queryClient.invalidateQueries({ queryKey: ['chats'] }),
      ]);

      toast.success('Candidatura accettata! Apri la chat...', { duration: 2000 });
      
      // Navigate AFTER cache invalidation (in onSuccess equivalent)
      navigate(`/messaggi?chat=${chatId}`);
    } catch (error) {
      console.error('Error accepting application:', error);
      toast.error('Errore nell\'accettare la candidatura', { duration: 2000 });
    } finally {
      setProcessingAppId(null);
    }
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
    fetchJobs();
    toast.success('Annuncio aggiornato!', { duration: 2000 });
  };

  const handleDeleteSuccess = () => {
    setDeletingJob(null);
    fetchJobs();
    toast.success('Annuncio eliminato!', { duration: 2000 });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hired':
        return <Badge className="bg-green-600 text-white">Assunto</Badge>;
      case 'accepted':
        return <Badge className="bg-employer text-employer-foreground">In Colloquio</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white">Rifiutato</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500 text-white">Concluso</Badge>;
      default:
        return <Badge className="bg-yellow-500 text-white">In attesa</Badge>;
    }
  };

  if (selectedJob) {
    return (
      <div className="flex flex-col h-full bg-background">
        <Header />
        
        <main className="flex-1 px-4 pb-4 overflow-y-auto">
          {/* Back button and job title */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-full bg-employer-50 text-employer hover:bg-employer-100 touch-feedback"
            >
              <IndietroIcon className="h-5 w-5" />
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
              <XIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">Nessuna candidatura</h3>
              <p className="text-sm text-muted-foreground">
                Non ci sono ancora candidati per questo annuncio
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
                    <Avatar className="h-14 w-14 border-2 border-employer/20">
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
                  </div>

                  {/* Actions row */}
                  <div className="mt-4 flex items-center justify-between">
                    {app.status === 'pending' ? (
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          onClick={() => handleReject(app)}
                          disabled={processingAppId === app.id}
                          variant="outline"
                          className="flex-1 border-slate-300 text-slate-500 hover:bg-slate-50 touch-feedback"
                        >
                          {processingAppId === app.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-1" />
                              Rifiuta
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleAccept(app)}
                          disabled={processingAppId === app.id}
                          className="flex-1 bg-employer hover:bg-employer-700 text-employer-foreground touch-feedback"
                        >
                          {processingAppId === app.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Accetta
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full flex justify-center">
                        {getStatusBadge(app.status)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with "Annunci" title in blue for employers */}
      <Header />

      <main className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">I Tuoi Annunci Pubblicati</h2>
          <Button
            onClick={() => navigate('/create-job')}
            className="bg-employer hover:bg-employer-700 text-employer-foreground rounded-full px-4 touch-feedback"
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
                className="material-card p-4 cursor-pointer touch-feedback"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {job.applicationCount} candidatur{job.applicationCount === 1 ? 'a' : 'e'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleEditClick(e, job)}
                      className="h-8 w-8 rounded-full hover:bg-employer-100 touch-feedback"
                    >
                      <PennaIcon className="h-4 w-4 text-employer" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(e, job)}
                      className="h-8 w-8 rounded-full hover:bg-red-100 touch-feedback"
                    >
                      <BidoneIcon className="h-4 w-4 text-destructive" />
                    </Button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

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
