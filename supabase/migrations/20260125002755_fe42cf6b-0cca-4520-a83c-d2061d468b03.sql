-- Create reviews table for employer reviews (workers review employers)
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating DOUBLE PRECISION NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Workers can create reviews
CREATE POLICY "Workers can create reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid() = worker_id);

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

-- Workers can update their own reviews
CREATE POLICY "Workers can update own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = worker_id);

-- Add is_reviewed column to applications table
ALTER TABLE public.applications 
ADD COLUMN is_reviewed BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster review lookups by employer
CREATE INDEX idx_reviews_employer_id ON public.reviews(employer_id);
CREATE INDEX idx_reviews_job_id ON public.reviews(job_id);