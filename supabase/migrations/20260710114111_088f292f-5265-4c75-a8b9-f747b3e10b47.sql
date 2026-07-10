ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS employer_name text;

UPDATE public.applications a
SET job_title = j.title, employer_name = p.full_name
FROM public.jobs j
LEFT JOIN public.profiles p ON p.id = j.owner_id
WHERE a.job_id = j.id AND a.job_title IS NULL;