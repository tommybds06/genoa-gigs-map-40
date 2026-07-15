-- Snapshot del titolo annuncio e del nome employer sulle candidature.
-- Motivo: quando un employer cancella un annuncio, le candidature/lo storico che lo
-- referenziano restano orfani e il titolo viene perso (in UI compare "Lavoro"/"Attività",
-- e le query .single() sul job cancellato restituiscono 406).
-- Salvando uno snapshot alla creazione della candidatura, lo storico sopravvive alla
-- cancellazione dell'annuncio.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS employer_name text;

-- Backfill: popola le candidature esistenti il cui annuncio esiste ancora.
-- (Le candidature verso annunci GIÀ cancellati non sono recuperabili: il dato è perso.)
UPDATE public.applications a
SET
  job_title = j.title,
  employer_name = p.full_name
FROM public.jobs j
LEFT JOIN public.profiles p ON p.id = j.owner_id
WHERE a.job_id = j.id
  AND a.job_title IS NULL;
