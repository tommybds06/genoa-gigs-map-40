-- =====================================================================
-- DIAGNOSI DELLE NOTIFICHE PUSH — solo letture, non cambia niente.
-- (11 novembre 2026)
--
-- Si incolla in Lovable («Esegui queste query e mostrami i risultati») quando
-- la prova in Impostazioni dice che il server non manda le notifiche. La
-- catena: notifica creata → trigger/cron → pg_net chiama `invia-notifiche`
-- (col segreto) → la funzione manda a Google/Apple → il telefono.
-- Ogni blocco guarda un anello. ⚠️ Il blocco 4 fallisce se pg_net non c'è:
-- quello È il problema.
-- =====================================================================

-- 1. Indirizzo e segreto per chiamare la funzione (il segreto non si mostra:
--    solo se c'è e quanto è lungo). Senza 'segreto_invio' il database non
--    chiama MAI la funzione, in silenzio.
SELECT chiave,
       CASE WHEN chiave = 'segreto_invio' THEN '(presente, ' || length(valore) || ' caratteri)' ELSE valore END AS valore
  FROM impostazioni_server;

-- 2. Le estensioni: pg_net chiama la funzione, pg_cron fa il giro ogni minuto.
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_net', 'pg_cron');

-- 3. I giri a orario e com'è andato l'ultimo.
SELECT jobname, schedule, active FROM cron.job;
SELECT j.jobname, d.status, left(d.return_message, 160) AS messaggio, d.start_time
  FROM cron.job_run_details d JOIN cron.job j USING (jobid)
 ORDER BY d.start_time DESC LIMIT 10;

-- 4. Le ultime risposte della funzione alle chiamate del database.
--    200 {"push":…} = gira; 401 = il segreto nel database e quello della
--    funzione (INVIO_NOTIFICHE_SEGRETO) sono diversi; 404 = funzione non
--    pubblicata; 5xx = la funzione si è rotta (vedi i suoi log).
SELECT id, status_code, left(content::text, 200) AS risposta, created
  FROM net._http_response ORDER BY created DESC LIMIT 10;

-- 5. I telefoni iscritti, e a chi. «google» = Android/Chrome, «apple» =
--    iPhone (solo con l'app aggiunta alla schermata Home).
SELECT piattaforma,
       CASE WHEN endpoint LIKE '%googleapis%' THEN 'google'
            WHEN endpoint LIKE '%push.apple.com%' THEN 'apple'
            ELSE split_part(endpoint, '/', 3) END AS servizio,
       (SELECT full_name FROM profiles p WHERE p.id = utente_id) AS account,
       creata_il, usata_il
  FROM iscrizioni_push ORDER BY usata_il DESC;

-- 6. Le ultime notifiche push e com'è andata (push_esito dall'11 novembre).
SELECT tipo, titolo, creata_il, push_inviata_il, push_esito
  FROM notifiche WHERE 'push' = ANY (canali)
 ORDER BY creata_il DESC LIMIT 15;
