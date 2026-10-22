-- =====================================================================
-- LA SCADENZA DEGLI ANNUNCI — una data propria, protetta
-- =====================================================================
--
-- Deciso da Tommaso il 23 ottobre 2026:
--   • un annuncio gratuito dura 48 ore;
--   • NESSUNA ripubblicazione gratuita: allo scadere l'employer riceve
--     l'avviso e può pagare per estenderlo a 7 giorni (Fase 8, Stripe),
--     altrimenti resta scaduto;
--   • l'annuncio scaduto NON sparisce per chi l'ha pubblicato: resta in
--     Annunci con l'etichetta «Scaduto», con le candidature arrivate.
--
-- Prima la scadenza era «creato da meno di 48 ore» (`created_at`), calcolata
-- in ogni query. Per estendere un annuncio bisognava falsificarne la data di
-- creazione — e l'ordine «dal più recente» avrebbe mentito. Ora c'è
-- `scade_il`, e l'estensione a pagamento sarà solo spostare quella.
--
-- ⚠️ ORDINE DI DEPLOY: prima questa migration, poi il push del codice
-- (CLAUDE.md §13): il codice nuovo filtra su `scade_il`. Rieseguibile.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. LE COLONNE
--   scade_il        quando l'annuncio smette di essere visibile e di
--                   accettare candidature.
--   scadenza_vista  l'employer ha già visto l'avviso di scadenza (così non
--                   gli ricompare a ogni apertura dell'app).
-- ---------------------------------------------------------------------
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS scade_il       TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS scadenza_vista BOOLEAN NOT NULL DEFAULT false;

-- Recupero: gli annunci esistenti scadono a 48 ore dalla loro creazione,
-- cioè esattamente come si comportavano finora.
UPDATE public.jobs
   SET scade_il = created_at + INTERVAL '48 hours'
 WHERE scade_il IS NULL;

-- Gli annunci già scaduti prima di oggi non mandano l'avviso a posteriori:
-- sarebbe una raffica di finestre su annunci di settimane fa.
UPDATE public.jobs
   SET scadenza_vista = true
 WHERE scade_il < now() AND scadenza_vista = false;

ALTER TABLE public.jobs ALTER COLUMN scade_il SET DEFAULT (now() + INTERVAL '48 hours');
ALTER TABLE public.jobs ALTER COLUMN scade_il SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_scade_il ON public.jobs (scade_il);


-- ---------------------------------------------------------------------
-- 2. LA SCADENZA LA DECIDE IL DATABASE, NON IL CLIENT
--
--    L'employer può modificare i suoi annunci (policy «Owners can update»):
--    senza questa protezione potrebbe spostare `scade_il` da sé e
--    ripubblicare gratis, cioè esattamente quello che si è deciso di non
--    permettere. Quindi:
--    • alla creazione `scade_il` = adesso + 48 ore, qualunque cosa mandi
--      il client;
--    • in modifica `scade_il` non cambia, se a modificare è un utente.
--      Lo potrà cambiare solo il server (auth.uid() NULL: funzioni
--      SECURITY DEFINER, pg_cron, il pagamento della Fase 8).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.proteggi_scadenza_annuncio()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      NEW.scade_il := now() + INTERVAL '48 hours';
    END IF;
    NEW.scadenza_vista := false;
  ELSIF auth.uid() IS NOT NULL THEN
    NEW.scade_il := OLD.scade_il;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proteggi_scadenza_annuncio ON public.jobs;
CREATE TRIGGER proteggi_scadenza_annuncio
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.proteggi_scadenza_annuncio();


-- ---------------------------------------------------------------------
-- 3. NIENTE CANDIDATURE A UN ANNUNCIO SCADUTO O CHIUSO
--
--    L'annuncio scaduto sparisce dalla mappa, ma con un link diretto (una
--    chat, un profilo) la scheda si apre ancora: senza questo controllo il
--    bottone «Candidati» funzionerebbe. Lato app il bottone non c'è più; qui
--    lo si impedisce anche a chi lo chiamasse a mano.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.candidatura_su_annuncio_attivo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
     WHERE j.id = NEW.job_id
       AND j.status = 'open'
       AND j.scade_il > now()
  ) THEN
    RAISE EXCEPTION 'annuncio_non_attivo' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.candidatura_su_annuncio_attivo() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS candidatura_su_annuncio_attivo ON public.applications;
CREATE TRIGGER candidatura_su_annuncio_attivo
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.candidatura_su_annuncio_attivo();