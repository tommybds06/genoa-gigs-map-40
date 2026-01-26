-- Allow workers to update their own applications (for marking as reviewed)
CREATE POLICY "Workers can update own applications"
ON public.applications
FOR UPDATE
USING (auth.uid() = applicant_id)
WITH CHECK (auth.uid() = applicant_id);