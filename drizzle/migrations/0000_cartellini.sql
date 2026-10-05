CREATE OR REPLACE FUNCTION public.proteggi_candidatura()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> NEW.applicant_id THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.is_reviewed := false;
    RETURN NEW;
  END IF;
  IF (to_jsonb(NEW) - 'is_reviewed' - 'updated_at')
     IS DISTINCT FROM (to_jsonb(OLD) - 'is_reviewed' - 'updated_at') THEN
    RAISE EXCEPTION 'Il candidato puo'' modificare solo is_reviewed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.proteggi_candidatura() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS proteggi_candidatura ON public.applications;
CREATE TRIGGER proteggi_candidatura
  BEFORE INSERT OR UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.proteggi_candidatura();

CREATE TABLE IF NOT EXISTS public.cartellini (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  employer_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  worker_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id         UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  data_inizio    DATE DEFAULT CURRENT_DATE,
  data_fine      DATE,
  paga_importo   NUMERIC(8,2),
  paga_unita     TEXT,
  giorni         SMALLINT[],
  orari          TEXT,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT cartellini_date_ordinate
    CHECK (data_fine IS NULL OR data_inizio IS NULL OR data_fine >= data_inizio),
  CONSTRAINT cartellini_paga_positiva
    CHECK (paga_importo IS NULL OR paga_importo >= 0),
  CONSTRAINT cartellini_paga_unita
    CHECK (paga_unita IS NULL OR paga_unita IN ('ora', 'giorno', 'settimana', 'mese', 'forfait')),
  CONSTRAINT cartellini_giorni_validi
    CHECK (giorni IS NULL OR giorni <@ ARRAY[1,2,3,4,5,6,7]::SMALLINT[]),
  CONSTRAINT cartellini_orari_lunghezza
    CHECK (orari IS NULL OR char_length(orari) <= 200)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cartellini TO authenticated;
GRANT ALL ON public.cartellini TO service_role;

CREATE INDEX IF NOT EXISTS idx_cartellini_employer ON public.cartellini(employer_id);
CREATE INDEX IF NOT EXISTS idx_cartellini_worker   ON public.cartellini(worker_id);

DROP TRIGGER IF EXISTS update_cartellini_updated_at ON public.cartellini;
CREATE TRIGGER update_cartellini_updated_at
  BEFORE UPDATE ON public.cartellini
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.compila_cartellino()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  candidatura RECORD;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.application_id := OLD.application_id;
    NEW.employer_id    := OLD.employer_id;
    NEW.worker_id      := OLD.worker_id;
    NEW.job_id         := OLD.job_id;
    NEW.created_at     := OLD.created_at;
    RETURN NEW;
  END IF;
  SELECT a.applicant_id, a.job_id, a.status, j.owner_id
    INTO candidatura
    FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
   WHERE a.id = NEW.application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidatura inesistente' USING ERRCODE = '23503';
  END IF;
  IF candidatura.status NOT IN ('accepted', 'hired') THEN
    RAISE EXCEPTION 'Si appende solo chi e'' in prova o assunto (stato: %)', candidatura.status
      USING ERRCODE = '23514';
  END IF;
  NEW.employer_id := candidatura.owner_id;
  NEW.worker_id   := candidatura.applicant_id;
  NEW.job_id      := candidatura.job_id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.compila_cartellino() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS compila_cartellino ON public.cartellini;
CREATE TRIGGER compila_cartellino
  BEFORE INSERT OR UPDATE ON public.cartellini
  FOR EACH ROW EXECUTE FUNCTION public.compila_cartellino();

CREATE OR REPLACE FUNCTION public.appendi_assunto()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.cartellini (application_id, employer_id, worker_id, job_id)
  SELECT NEW.id, j.owner_id, NEW.applicant_id, NEW.job_id
    FROM public.jobs j
   WHERE j.id = NEW.job_id
  ON CONFLICT (application_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.appendi_assunto() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS appendi_assunto ON public.applications;
CREATE TRIGGER appendi_assunto
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW
  WHEN (NEW.status = 'hired' AND OLD.status IS DISTINCT FROM 'hired')
  EXECUTE FUNCTION public.appendi_assunto();

ALTER TABLE public.cartellini ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cartellini FROM anon;

DROP POLICY IF EXISTS "Employer e worker vedono i propri cartellini" ON public.cartellini;
CREATE POLICY "Employer e worker vedono i propri cartellini"
  ON public.cartellini FOR SELECT TO authenticated
  USING (auth.uid() = employer_id OR auth.uid() = worker_id);

DROP POLICY IF EXISTS "Employer appende alla propria bacheca" ON public.cartellini;
CREATE POLICY "Employer appende alla propria bacheca"
  ON public.cartellini FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "Employer modifica i propri cartellini" ON public.cartellini;
CREATE POLICY "Employer modifica i propri cartellini"
  ON public.cartellini FOR UPDATE TO authenticated
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "Employer stacca i propri cartellini" ON public.cartellini;
CREATE POLICY "Employer stacca i propri cartellini"
  ON public.cartellini FOR DELETE TO authenticated
  USING (auth.uid() = employer_id);

INSERT INTO public.cartellini (application_id, employer_id, worker_id, job_id, data_inizio)
SELECT a.id, j.owner_id, a.applicant_id, a.job_id, a.updated_at::date
  FROM public.applications a
  JOIN public.jobs j ON j.id = a.job_id
 WHERE a.status = 'hired'
ON CONFLICT (application_id) DO NOTHING;