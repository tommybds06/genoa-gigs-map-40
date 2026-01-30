-- Allow all authenticated users to view completed applications for any worker
-- This enables employers to see the job history of workers
CREATE POLICY "Anyone can view completed applications"
ON public.applications
FOR SELECT
USING (status = 'completed');

-- Enable realtime for applications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;