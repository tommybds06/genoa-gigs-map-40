-- Add location columns to profiles table for employer locations
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address_text text,
ADD COLUMN IF NOT EXISTS lat double precision,
ADD COLUMN IF NOT EXISTS lng double precision;