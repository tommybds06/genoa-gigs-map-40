-- =====================================================================
-- LA PAGA AL GIORNO, A SETTIMANA, AL MESE
-- 7 novembre 2026
--
-- Fino a ieri un annuncio si pagava solo all'ora o a forfait. Tommaso:
-- «paga anche giornaliera, settimanale o mensile». Le unità che il form
-- offre dipendono dalla durata (lib/prezzi.ts, `UNITA_PER_DURATA`):
--   Una tantum          → all'ora, forfait
--   Giorni              → + al giorno
--   Settimane           → + al giorno, a settimana
--   Mesi, Continuativo  → + al giorno, a settimana, al mese
--
-- 1. `jobs.paga_tipo` accetta i tre valori nuovi. Il vincolo l'aveva creato
--    la 20261105120000 dentro ADD COLUMN, quindi col nome scelto da
--    Postgres: si cerca per definizione, non per nome.
-- 2. `jobs.giorni_settimana`: con la paga AL GIORNO su un lavoro di
--    settimane o mesi («60 € a serata, 2 sere a settimana») serve sapere
--    quanti giorni a settimana, per il valore dell'annuncio.
--
-- Nessun dato da toccare: gli annunci di prima sono «oraria» o «forfait».
-- Rieseguibile.
-- =====================================================================

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint
            WHERE conrelid = 'public.jobs'::regclass AND contype = 'c'
              AND pg_get_constraintdef(oid) LIKE '%paga_tipo%'
  LOOP
    EXECUTE format('ALTER TABLE public.jobs DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_paga_tipo_check
  CHECK (paga_tipo IN ('oraria', 'giornaliera', 'settimanale', 'mensile', 'forfait'));

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS giorni_settimana integer CHECK (giorni_settimana BETWEEN 1 AND 7);
