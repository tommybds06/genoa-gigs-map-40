-- Add tags column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN tags text[] DEFAULT '{}';

-- Add tags column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN tags text[] DEFAULT '{}';

-- Create index for faster tag matching queries
CREATE INDEX idx_profiles_tags ON public.profiles USING GIN(tags);
CREATE INDEX idx_jobs_tags ON public.jobs USING GIN(tags);