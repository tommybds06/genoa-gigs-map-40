-- Add neighborhood column to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS neighborhood text;

-- Add neighborhood column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS neighborhood text;