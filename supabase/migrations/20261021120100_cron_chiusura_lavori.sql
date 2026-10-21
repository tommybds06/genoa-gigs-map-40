-- =====================================================================
-- LA CHIUSURA AUTOMATICA, OGNI GIORNO — pg_cron
-- =====================================================================
--
-- Esegue `public.chiudi_lavori_scaduti()` (migration precedente) una volta
-- al giorno, sul server: funziona anche se l'employer non apre più l'app.
--
-- 03:15 UTC = le 4:15 o le 5:15 in Italia: a quell'ora la data UTC
-- (CURRENT_DATE nel database) è la stessa di Genova, quindi «il 16» è il 16
-- anche per chi usa l'app.
--
-- ⚠️ File a parte apposta: se il database di Lovable non avesse pg_cron,
-- fallisce SOLO questo, e la migration con le colonne resta applicata.
-- Rieseguibile: se il job c'è già, lo toglie e lo rimette.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule(jobid)
  FROM cron.job
 WHERE jobname = 'politask-chiudi-lavori-scaduti';

SELECT cron.schedule(
  'politask-chiudi-lavori-scaduti',
  '15 3 * * *',
  $$SELECT public.chiudi_lavori_scaduti();$$
);
