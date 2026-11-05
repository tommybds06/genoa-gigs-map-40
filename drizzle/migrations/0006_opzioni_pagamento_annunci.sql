ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS paga_tipo text CHECK (paga_tipo IN ('oraria', 'forfait')),
  ADD COLUMN IF NOT EXISTS paga_importo numeric(10, 2) CHECK (paga_importo >= 0),
  ADD COLUMN IF NOT EXISTS paga_lorda boolean,
  ADD COLUMN IF NOT EXISTS ore_totali numeric(6, 1) CHECK (ore_totali > 0),
  ADD COLUMN IF NOT EXISTS ore_giorno numeric(4, 1) CHECK (ore_giorno > 0),
  ADD COLUMN IF NOT EXISTS giorni integer CHECK (giorni > 0),
  ADD COLUMN IF NOT EXISTS ore_settimana numeric(5, 1) CHECK (ore_settimana > 0),
  ADD COLUMN IF NOT EXISTS settimane integer CHECK (settimane > 0);

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS opzione text NOT NULL DEFAULT 'nessuna'
    CHECK (opzione IN ('nessuna', 'potenziamento', 'allungamento', 'pacchetto')),
  ADD COLUMN IF NOT EXISTS prezzo_potenziamento numeric(6, 2),
  ADD COLUMN IF NOT EXISTS prezzo_allungamento numeric(6, 2),
  ADD COLUMN IF NOT EXISTS prezzo_pacchetto numeric(6, 2);

CREATE OR REPLACE FUNCTION public.prova_gratuita()
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$ SELECT true $$;

CREATE OR REPLACE FUNCTION public.proteggi_scadenza_annuncio()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      IF NEW.opzione IN ('allungamento', 'pacchetto') AND public.prova_gratuita() THEN
        NEW.scade_il := now() + INTERVAL '7 days';
      ELSE
        NEW.scade_il := now() + INTERVAL '48 hours';
      END IF;
    END IF;
    NEW.scadenza_vista := false;
  ELSIF auth.uid() IS NOT NULL THEN
    NEW.scade_il := OLD.scade_il;
    NEW.opzione := OLD.opzione;
    NEW.prezzo_potenziamento := OLD.prezzo_potenziamento;
    NEW.prezzo_allungamento := OLD.prezzo_allungamento;
    NEW.prezzo_pacchetto := OLD.prezzo_pacchetto;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proteggi_scadenza_annuncio ON public.jobs;
CREATE TRIGGER proteggi_scadenza_annuncio
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.proteggi_scadenza_annuncio();