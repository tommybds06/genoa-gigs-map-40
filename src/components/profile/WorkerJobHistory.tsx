import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Loader2, Calendar, Building2, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CompletedJob {
  id: string;
  job_id: string;
  created_at: string;
  job: {
    title: string;
    schedule: string | null;
    created_at: string;
    owner_id: string;
  } | null;
  employer: {
    id: string;
    full_name: string | null;
  } | null;
}

function formatJobDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

interface WorkerJobHistoryProps {
  primaryTextClasses: string;
}

export const WorkerJobHistory = ({ primaryTextClasses }: WorkerJobHistoryProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedJobs = async () => {
      if (!user) return;

      try {
        // Fetch ONLY completed applications for current worker
        const { data: applicationsData, error } = await supabase
          .from('applications')
          .select('id, job_id, created_at')
          .eq('applicant_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch job and employer details for each application
        const jobsWithDetails = await Promise.all(
          (applicationsData || []).map(async (app) => {
            // Fetch job details
            const { data: jobData } = await supabase
              .from('jobs')
              .select('title, schedule, created_at, owner_id')
              .eq('id', app.job_id)
              .single();

            // Fetch employer details
            let employerData = null;
            if (jobData?.owner_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('id', jobData.owner_id)
                .single();
              employerData = profile;
            }

            return {
              id: app.id,
              job_id: app.job_id,
              created_at: app.created_at,
              job: jobData,
              employer: employerData,
            };
          })
        );

        setJobs(jobsWithDetails);
      } catch (error) {
        console.error('Error fetching job history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedJobs();
  }, [user]);

  if (loading) {
    return (
      <div className="material-card p-4 mb-4 animate-fade-in">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Briefcase className={`w-4 h-4 ${primaryTextClasses}`} />
          Storico Lavori Completati
        </h3>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="material-card p-4 mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="job-history" className="border-none">
          <AccordionTrigger className="py-0 hover:no-underline">
            <h3 className="font-semibold flex items-center gap-2">
              <Briefcase className={`w-4 h-4 ${primaryTextClasses}`} />
              Storico Lavori Completati ({jobs.length})
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            {jobs.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Nessun lavoro completato ancora
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-muted/50 rounded-xl p-3 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => job.employer?.id && navigate(`/profile/${job.employer.id}`)}
                  >
                    <h4 className="font-medium text-sm">{job.job?.title || 'Lavoro'}</h4>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{job.employer?.full_name || 'Attività'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatJobDate(job.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};