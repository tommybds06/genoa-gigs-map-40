-- =====================================================================
-- IL FLUSSO DELL'ASSUNZIONE — date, chiusura automatica, cuore
-- =====================================================================
--
-- Il flusso deciso da Tommaso il 21 ottobre 2026:
--
--   annuncio → candidatura → l'employer accetta (si apre la chat) → accordi
--   → l'employer ASSUME → compila il cartellino (fine, paga, giorni…)
--   → il giorno dopo la data di fine l'app chiede: estendi o concludi?
--     L'employer ha 5 giorni pieni; se non risponde il lavoro SI CHIUDE DA
--     SOLO (fine 10 → domanda l'11 → chiusura il 16).
--   → senza data di fine, ogni 3 mesi dalla data di assunzione l'app chiede
--     se il lavoro è ancora attivo. Qui NIENTE chiusura automatica: un lavoro
--     può durare più di tre mesi.
--   → a lavoro concluso: il worker recensisce, l'employer può mettere un
--     CUORE (o niente). Il cuore è pubblico, nello storico del worker.
--   → l'employer può concludere in qualunque momento.
--
-- La chiusura automatica gira sul SERVER (pg_cron, file successivo): deve
-- funzionare anche se l'employer non apre più l'app.
--
-- ⚠️ ORDINE DI DEPLOY: prima questa migration (e quella di pg_cron), poi il
-- push del codice (CLAUDE.md §13). Rieseguibile senza danni.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. LE COLONNE NUOVE DEL CARTELLINO — tutte nascoste in interfaccia
--
--   assunto_il       il giorno dell'assunzione. Da qui si contano i 3 mesi.
--                    Non è `data_inizio` (che l'employer modifica, e per chi
--                    era in prova è la data della prova).
--   ultimo_controllo l'ultima volta che l'employer ha risposto «è ancora
--                    attivo». Serve solo a non richiederlo a ogni apertura
--                    fino al trimestre dopo.
--   cuore            true = l'employer ha messo il cuore, false = ha saltato,
--                    NULL = non ha ancora risposto.
--   esito_il         quando ha risposto o saltato: la card del cuore si
--                    mostra solo finché è NULL.
-- ---------------------------------------------------------------------
ALTER TABLE public.cartellini
  ADD COLUMN IF NOT EXISTS assunto_il       DATE,
  ADD COLUMN IF NOT EXISTS ultimo_controllo DATE,
  ADD COLUMN IF NOT EXISTS cuore            BOOLEAN,
  ADD COLUMN IF NOT EXISTS esito_il         TIMESTAMP WITH TIME ZONE;

-- Recupero: chi è già assunto (o concluso) prende come data di assunzione
-- la data d'inizio del cartellino, o in mancanza quella di creazione.
UPDATE public.cartellini c
   SET assunto_il = COALESCE(c.data_inizio, c.created_at::date)
  FROM public.applications a
 WHERE a.id = c.application_id
   AND a.status IN ('hired', 'completed')
   AND c.assunto_il IS NULL;

-- I lavori GIÀ conclusi non chiedono il cuore a posteriori: sarebbe una
-- raffica di card su lavori di settimane fa.
UPDATE public.cartellini c
   SET esito_il = now()
  FROM public.applications a
 WHERE a.id = c.application_id
   AND a.status = 'completed'
   AND c.esito_il IS NULL;


-- ---------------------------------------------------------------------
-- 2. CHI VIENE ASSUNTO: cartellino + data di assunzione
--
--    Come prima, il cartellino nasce da solo al passaggio a `hired`. In più
--    segna `assunto_il`. Se il cartellino c'era già (era in prova) resta
--    quello, e prende la data di assunzione di oggi.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.appendi_assunto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.cartellini (application_id, employer_id, worker_id, job_id, assunto_il)
  SELECT NEW.id, j.owner_id, NEW.applicant_id, NEW.job_id, CURRENT_DATE
    FROM public.jobs j
   WHERE j.id = NEW.job_id
  ON CONFLICT (application_id) DO UPDATE
    SET assunto_il = COALESCE(public.cartellini.assunto_il, CURRENT_DATE);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.appendi_assunto() FROM anon, authenticated, PUBLIC;


-- ---------------------------------------------------------------------
-- 3. LA CHIUSURA AUTOMATICA — la chiama pg_cron una volta al giorno
--
--    Chiude i lavori ASSUNTI con la data di fine passata da più di 5 giorni
--    pieni: fine 10 → 10 + 5 = 15 < 16 → si chiude il 16.
--    Quelli «in prova» no: non sono ancora un lavoro, decide l'employer.
--
--    Per ognuno: candidatura → `completed` (così il worker può recensire e
--    l'employer vede la card del cuore), messaggio automatico in chat, e
--    l'annuncio si chiude solo se non resta nessun altro al lavoro (stessa
--    regola di `chiudiAnnuncioSeNessunoResta` in lib/bacheca.ts).
--
--    `auth.uid()` qui è NULL: il trigger `proteggi_candidatura` non
--    interviene. Il messaggio porta come mittente l'employer, perché
--    `sender_id` non può essere vuoto; `is_system` lo distingue.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.chiudi_lavori_scaduti()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  id_chat UUID;
  chiusi INTEGER := 0;
BEGIN
  FOR r IN
    SELECT c.application_id, c.job_id, c.worker_id, c.employer_id, c.data_fine
      FROM public.cartellini c
      JOIN public.applications a ON a.id = c.application_id
     WHERE a.status = 'hired'
       AND c.data_fine IS NOT NULL
       AND c.data_fine + 5 < CURRENT_DATE
  LOOP
    UPDATE public.applications
       SET status = 'completed'
     WHERE id = r.application_id
       AND status = 'hired';

    SELECT ch.id INTO id_chat
      FROM public.chats ch
     WHERE ch.job_id = r.job_id
       AND ch.worker_id = r.worker_id
       AND ch.employer_id = r.employer_id
     LIMIT 1;

    IF id_chat IS NOT NULL THEN
      INSERT INTO public.messages (chat_id, sender_id, content, is_system)
      VALUES (
        id_chat,
        r.employer_id,
        'Il lavoro si è chiuso automaticamente: era previsto fino al ' || to_char(r.data_fine, 'DD/MM') || '.',
        true
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.applications
       WHERE job_id = r.job_id
         AND status IN ('accepted', 'hired')
    ) THEN
      UPDATE public.jobs SET status = 'closed' WHERE id = r.job_id AND status <> 'closed';
    END IF;

    chiusi := chiusi + 1;
  END LOOP;

  RETURN chiusi;
END;
$$;

-- Solo il server la chiama (pg_cron gira come proprietario del database).
REVOKE EXECUTE ON FUNCTION public.chiudi_lavori_scaduti() FROM anon, authenticated, PUBLIC;


-- ---------------------------------------------------------------------
-- 4. I CUORI DI UN WORKER, PUBBLICI — senza aprire i cartellini a tutti
--
--    Il cuore è pubblico (lo vedono anche gli altri employer nel profilo del
--    worker), ma il cartellino contiene anche la paga e gli accordi, che
--    restano privati tra employer e worker. Le policy RLS sono per riga, non
--    per colonna: aprire le righe col cuore avrebbe mostrato anche la paga.
--    Quindi una funzione che restituisce SOLO le candidature col cuore.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cuori_del_worker(p_worker UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.application_id
    FROM public.cartellini c
   WHERE c.worker_id = p_worker
     AND c.cuore IS TRUE;
$$;

REVOKE EXECUTE ON FUNCTION public.cuori_del_worker(UUID) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.cuori_del_worker(UUID) TO authenticated;
