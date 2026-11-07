-- =====================================================================
-- IL PROMEMORIA DEL PRIMO GIORNO DI LAVORO VIENE DAL CARTELLINO
-- 7 novembre 2026
--
-- «Quando inizia» è stato tolto dal form dell'annuncio (Tommaso): la data
-- d'inizio si decide dopo l'assunzione, nel cartellino della bacheca
-- (`cartellini.data_inizio`), e il promemoria nasce da lì.
--
-- Cambia solo l'ultimo blocco di `notifiche_a_orario()` (il resto è
-- identico alla 20261105140000). Prima: 24 ore prima di `jobs.inizio_il`,
-- con l'ora. Ora: il giorno prima di `cartellini.data_inizio`, dalle 18,
-- perché il cartellino ha la data ma non l'ora (gli orari sono testo
-- libero, e finiscono nel testo della notifica).
--
-- La colonna `jobs.inizio_il` resta (vuota): toglierla obbligherebbe
-- Lovable a rigenerare i tipi per niente.
--
-- Rieseguibile: è solo un CREATE OR REPLACE.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.notifiche_a_orario()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_oggi date := date(now() AT TIME ZONE 'Europe/Rome');
BEGIN
  -- Annuncio in scadenza tra 6 ore (app).
  FOR r IN SELECT id, owner_id, title FROM jobs
            WHERE status = 'open' AND scade_il > now() AND scade_il <= now() + INTERVAL '6 hours'
  LOOP
    PERFORM crea_notifica(r.owner_id, 'in_scadenza', 'Il tuo annuncio scade tra poche ore', r.title,
      'annunci', r.id, 'in_scadenza:' || r.id, 'unico');
  END LOOP;

  -- Scaduto senza nessuno scelto (in prova, assunto o concluso).
  FOR r IN SELECT j.id, j.owner_id, j.title FROM jobs j
            WHERE j.status = 'open' AND j.scade_il <= now() AND j.scade_il > now() - INTERVAL '1 day'
              AND NOT EXISTS (SELECT 1 FROM applications a
                               WHERE a.job_id = j.id AND a.status IN ('accepted', 'hired', 'completed'))
  LOOP
    PERFORM crea_notifica(r.owner_id, 'scaduto', 'Il tuo annuncio è scaduto. Vuoi ripubblicarlo?', r.title,
      'annunci', r.id, 'scaduto:' || r.id, 'unico');
  END LOOP;

  -- I giorni previsti sono passati: il lavoro è finito? (a chi l'ha offerto)
  FOR r IN SELECT c.id, c.employer_id, c.worker_id FROM cartellini c
             JOIN applications a ON a.id = c.application_id
            WHERE c.data_fine IS NOT NULL AND c.data_fine < v_oggi AND a.status IN ('accepted', 'hired')
  LOOP
    PERFORM crea_notifica(r.employer_id, 'lavoro_finito',
      'Il lavoro con ' || nome_di(r.worker_id) || ' è finito?', 'Segnalo come concluso',
      'bacheca', r.id, 'finito:' || r.id, 'unico');
  END LOOP;

  -- Promemoria del primo giorno di lavoro (7 novembre). La data viene dal
  -- CARTELLINO, che l'employer compila subito dopo l'assunzione, non più
  -- dall'annuncio. Il giorno prima, dalle 18 (ora di Genova). Il testo
  -- porta gli orari concordati, se ci sono. Per chi è in prova o assunto.
  -- Una volta sola per cartellino e data: se l'employer sposta l'inizio, ne
  -- arriva uno nuovo.
  IF extract(hour FROM now() AT TIME ZONE 'Europe/Rome') >= 18 THEN
    FOR r IN SELECT c.id, c.employer_id, c.worker_id, c.data_inizio,
                    c.data_fine = c.data_inizio AS un_giorno,
                    nullif(btrim(c.orari), '') AS orari
               FROM cartellini c
               JOIN applications a ON a.id = c.application_id AND a.status IN ('accepted', 'hired')
              WHERE c.data_inizio = v_oggi + 1
    LOOP
      PERFORM crea_notifica(r.worker_id, 'promemoria',
        CASE WHEN r.un_giorno THEN 'Domani lavori da ' ELSE 'Domani inizi a lavorare da ' END || nome_di(r.employer_id),
        coalesce(r.orari, 'Promemoria'),
        'bacheca', r.id, 'promemoria:' || r.id || ':' || r.data_inizio, 'unico');
    END LOOP;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notifiche_a_orario() FROM anon, authenticated, PUBLIC;