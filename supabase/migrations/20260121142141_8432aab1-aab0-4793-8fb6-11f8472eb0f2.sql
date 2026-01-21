-- Create applications table for job applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Workers can apply to jobs (create application)
CREATE POLICY "Workers can apply to jobs"
  ON public.applications
  FOR INSERT
  WITH CHECK (
    auth.uid() = applicant_id 
    AND public.get_user_role(auth.uid()) = 'worker'
  );

-- Applicants can view their own applications
CREATE POLICY "Applicants can view own applications"
  ON public.applications
  FOR SELECT
  USING (auth.uid() = applicant_id);

-- Job owners can view applications to their jobs
CREATE POLICY "Owners can view applications to their jobs"
  ON public.applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.owner_id = auth.uid()
    )
  );

-- Job owners can update application status
CREATE POLICY "Owners can update application status"
  ON public.applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.owner_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Also add RLS policy for job owners to view their own jobs
CREATE POLICY "Owners can view own jobs"
  ON public.jobs
  FOR SELECT
  USING (auth.uid() = owner_id);