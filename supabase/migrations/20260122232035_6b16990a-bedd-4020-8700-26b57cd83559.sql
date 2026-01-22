-- Fix RLS policies for applications table

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Owners can view applications to their jobs" ON public.applications;
DROP POLICY IF EXISTS "Workers can apply to jobs" ON public.applications;
DROP POLICY IF EXISTS "Owners can update application status" ON public.applications;

-- Workers can INSERT applications (apply to jobs)
CREATE POLICY "Workers can apply to jobs" 
ON public.applications 
FOR INSERT 
WITH CHECK (
  auth.uid() = applicant_id 
  AND get_user_role(auth.uid()) = 'worker'::user_role
);

-- Workers can view their own applications
CREATE POLICY "Workers can view own applications" 
ON public.applications 
FOR SELECT 
USING (auth.uid() = applicant_id);

-- Employers can view applications to their jobs
CREATE POLICY "Employers can view job applications" 
ON public.applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = applications.job_id 
    AND jobs.owner_id = auth.uid()
  )
);

-- Employers can update application status on their jobs
CREATE POLICY "Employers can update application status" 
ON public.applications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = applications.job_id 
    AND jobs.owner_id = auth.uid()
  )
);