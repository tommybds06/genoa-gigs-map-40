-- Drop the "Workers can view jobs they applied to" policy on jobs.
--
-- This policy caused a circular RLS dependency:
--   jobs SELECT policy → queries applications
--   applications SELECT policy ("Employers can view job applications") → queries jobs
--   → infinite recursion, breaking ALL queries on both tables
--
-- The review flow (ReviewPrompt.tsx) already handles closed jobs via a chats fallback,
-- so this policy is not needed.
DROP POLICY IF EXISTS "Workers can view jobs they applied to" ON public.jobs;
