-- Add new columns to profiles table for onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS experience text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_onboarded boolean DEFAULT false;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile photos
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);