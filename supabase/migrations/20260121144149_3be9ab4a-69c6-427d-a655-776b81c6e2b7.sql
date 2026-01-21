-- Add looking_for column to profiles for employers
ALTER TABLE public.profiles 
ADD COLUMN looking_for text NULL;