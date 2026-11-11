-- =====================================================================
-- DIAGNOSI DELLE NOTIFICHE PUSH — UNA query, solo letture, non cambia niente.
-- (11 novembre 2026)
--
-- Si incolla in Lovable («Esegui questa query così com'è e mostrami il
-- risultato»). Una riga per anello della catena:
--   notifica creata → pg_net chiama `invia-notifiche` (col segreto) → la
--   funzione manda a Google/Apple → il telefono.
-- Non si rompe se pg_net o pg_cron mancano (è proprio una delle cose da
-- scoprire): le parti che li leggono partono solo se ci sono
-- (`to_regclass` + `query_to_xml`, che esegue il testo solo se chiamata).
-- Il segreto NON si mostra: solo se c'è e quanto è lungo.
-- =====================================================================
WITH x AS (
  SELECT
    to_regclass('cron.job') IS NOT NULL AS c_cron,
    to_regclass('net._http_response') IS NOT NULL AS c_net
)
SELECT controllo, esito FROM (
  SELECT 1 AS n, '1. segreto per chiamare la funzione' AS controllo,
         coalesce((SELECT 'presente, ' || length(valore) || ' caratteri' FROM impostazioni_server WHERE chiave = 'segreto_invio'),
                  'MANCA: il database non chiama mai la funzione') AS esito
  UNION ALL
  SELECT 2, '2. indirizzo della funzione',
         coalesce((SELECT valore FROM impostazioni_server WHERE chiave = 'url_invio'), 'MANCA')
  UNION ALL
  SELECT 3, '3. pg_net (chiama la funzione)',
         coalesce((SELECT 'installato ' || extversion FROM pg_extension WHERE extname = 'pg_net'), 'NON installato')
  UNION ALL
  SELECT 4, '4. pg_cron (giro ogni minuto)',
         coalesce((SELECT 'installato ' || extversion FROM pg_extension WHERE extname = 'pg_cron'), 'NON installato')
  UNION ALL
  SELECT 5, '5. giri a orario',
         CASE WHEN (SELECT c_cron FROM x) THEN
           coalesce((xpath('/row/v/text()', query_to_xml(
             $q$SELECT string_agg(jobname || ' ' || CASE WHEN active THEN 'attivo' ELSE 'SPENTO' END, ' · ') AS v FROM cron.job$q$,
             false, true, '')))[1]::text, 'nessuno')
         ELSE '-' END
  UNION ALL
  SELECT 6, '6. ultimo giro dell''invio',
         CASE WHEN (SELECT c_cron FROM x) THEN
           coalesce((xpath('/row/v/text()', query_to_xml(
             $q$SELECT d.status || ' ' || to_char(d.start_time AT TIME ZONE 'Europe/Rome', 'DD/MM HH24:MI') || ' ' || coalesce(left(d.return_message, 120), '') AS v
                  FROM cron.job_run_details d JOIN cron.job j USING (jobid)
                 WHERE j.jobname = 'politask-invia-notifiche' ORDER BY d.start_time DESC LIMIT 1$q$,
             false, true, '')))[1]::text, 'mai girato')
         ELSE '-' END
  UNION ALL
  SELECT 7, '7. ultime risposte della funzione',
         CASE WHEN (SELECT c_net FROM x) THEN
           coalesce((xpath('/row/v/text()', query_to_xml(
             $q$SELECT string_agg(coalesce(status_code::text, 'nessuna risposta') || ' ' || coalesce(left(content::text, 80), coalesce(left(error_msg, 80), '')), ' | ') AS v
                  FROM (SELECT * FROM net._http_response ORDER BY created DESC LIMIT 3) r$q$,
             false, true, '')))[1]::text, 'nessuna chiamata registrata')
         ELSE '-' END
  UNION ALL
  SELECT 8, '8. telefoni iscritti',
         coalesce((SELECT string_agg(
                    (SELECT coalesce(full_name, '?') FROM profiles p WHERE p.id = i.utente_id) || ': ' ||
                    CASE WHEN endpoint LIKE '%googleapis%' THEN 'google'
                         WHEN endpoint LIKE '%push.apple.com%' THEN 'apple'
                         ELSE split_part(endpoint, '/', 3) END, ' · ')
                    FROM iscrizioni_push i), 'nessuno')
  UNION ALL
  SELECT 9, '9. ultima notifica di prova',
         coalesce((SELECT to_char(creata_il AT TIME ZONE 'Europe/Rome', 'DD/MM HH24:MI:SS') || ' · inviata: ' ||
                          coalesce(to_char(push_inviata_il AT TIME ZONE 'Europe/Rome', 'HH24:MI:SS'), 'NO') || ' · esito: ' ||
                          coalesce(push_esito, '-')
                     FROM notifiche WHERE tipo = 'prova' ORDER BY creata_il DESC LIMIT 1), 'nessuna')
) righe
ORDER BY n;
