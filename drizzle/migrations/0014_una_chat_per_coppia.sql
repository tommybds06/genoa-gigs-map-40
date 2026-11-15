-- 1. Le colonne ---------------------------------------------------------------
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS unita_in uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS lavoro_corrente uuid REFERENCES public.jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS chats_unita_in_idx ON public.chats (unita_in);

-- 4. L'annuncio eliminato non porta via la chat --------------------------------
ALTER TABLE public.chats ALTER COLUMN job_id DROP NOT NULL;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT con.conname
      FROM pg_constraint con
      JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
     WHERE con.conrelid = 'public.chats'::regclass
       AND con.contype = 'f'
       AND att.attname = 'job_id'
       AND con.confdeltype <> 'n'   -- 'n' = SET NULL: già a posto
  LOOP
    EXECUTE format('ALTER TABLE public.chats DROP CONSTRAINT %I', r.conname);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public.chats'::regclass AND conname = 'chats_job_id_fkey'
  ) THEN
    ALTER TABLE public.chats
      ADD CONSTRAINT chats_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Si uniscono le chat doppie ------------------------------------------------
-- I due trigger che toccano `updated_at` si spengono durante l'unione: se no
-- ogni chat unita salirebbe in cima alla lista con la data di oggi.
ALTER TABLE public.chats DISABLE TRIGGER update_chats_updated_at;
ALTER TABLE public.messages DISABLE TRIGGER touch_chat_updated_at;

DO $$
DECLARE
  coppia record;
  ch record;
  v_principale uuid;
  v_corrente uuid;
BEGIN
  FOR coppia IN
    SELECT employer_id, worker_id
      FROM public.chats
     WHERE unita_in IS NULL
     GROUP BY employer_id, worker_id
    HAVING count(*) > 1
  LOOP
    SELECT id INTO v_principale
      FROM public.chats
     WHERE employer_id = coppia.employer_id AND worker_id = coppia.worker_id AND unita_in IS NULL
     ORDER BY created_at, id
     LIMIT 1;

    SELECT job_id INTO v_corrente
      FROM public.chats
     WHERE employer_id = coppia.employer_id AND worker_id = coppia.worker_id AND unita_in IS NULL
       AND job_id IS NOT NULL
     ORDER BY created_at DESC, id DESC
     LIMIT 1;

    FOR ch IN
      SELECT c.id, c.created_at, j.title
        FROM public.chats c
        LEFT JOIN public.jobs j ON j.id = c.job_id
       WHERE c.employer_id = coppia.employer_id AND c.worker_id = coppia.worker_id
         AND c.unita_in IS NULL AND c.id <> v_principale
       ORDER BY c.created_at, c.id
    LOOP
      UPDATE public.messages SET chat_id = v_principale WHERE chat_id = ch.id;

      -- Il timbro, al momento in cui quella chat era nata (l'accettazione).
      INSERT INTO public.messages (chat_id, sender_id, content, is_system, is_read, created_at)
      VALUES (v_principale, coppia.employer_id,
              'Nuovo lavoro: ' || coalesce(ch.title, 'un altro annuncio'), true, true, ch.created_at);

      UPDATE public.notifiche
         SET riferimento = v_principale,
             chiave = replace(chiave, ch.id::text, v_principale::text)
       WHERE azione = 'chat' AND riferimento = ch.id;

      -- «Fissata in alto» segue; «nascosta» no (la principale ha messaggi
      -- più recenti di quando era stata nascosta l'altra).
      INSERT INTO public.chat_utente (chat_id, user_id, fissata_il)
      SELECT v_principale, cu.user_id, cu.fissata_il
        FROM public.chat_utente cu
       WHERE cu.chat_id = ch.id AND cu.fissata_il IS NOT NULL
      ON CONFLICT (chat_id, user_id) DO NOTHING;
      DELETE FROM public.chat_utente WHERE chat_id = ch.id;

      UPDATE public.chats SET unita_in = v_principale WHERE id = ch.id;
    END LOOP;

    UPDATE public.chats c
       SET lavoro_corrente = v_corrente,
           updated_at = greatest(
             c.updated_at,
             coalesce((SELECT max(m.created_at) FROM public.messages m WHERE m.chat_id = v_principale), c.updated_at),
             coalesce((SELECT max(a.updated_at) FROM public.chats a WHERE a.unita_in = v_principale), c.updated_at)
           )
     WHERE c.id = v_principale;
  END LOOP;
END $$;

ALTER TABLE public.messages ENABLE TRIGGER touch_chat_updated_at;
ALTER TABLE public.chats ENABLE TRIGGER update_chats_updated_at;

-- Da qui in poi: una sola chat principale per coppia.
CREATE UNIQUE INDEX IF NOT EXISTS chats_una_per_coppia
  ON public.chats (employer_id, worker_id) WHERE unita_in IS NULL;

-- 2. Il lavoro corrente cambia: si aggiorna e lo dice un timbro ----------------
-- Solo per il database (non chiamabile dall'app).
CREATE OR REPLACE FUNCTION public.cambia_lavoro_chat(p_chat uuid, p_job uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c record;
  v_titolo text;
BEGIN
  IF p_job IS NULL THEN RETURN; END IF;
  SELECT id, employer_id, job_id, lavoro_corrente INTO c FROM chats WHERE id = p_chat;
  IF NOT FOUND OR coalesce(c.lavoro_corrente, c.job_id) IS NOT DISTINCT FROM p_job THEN RETURN; END IF;
  SELECT title INTO v_titolo FROM jobs WHERE id = p_job;
  UPDATE chats SET lavoro_corrente = p_job WHERE id = p_chat;
  INSERT INTO messages (chat_id, sender_id, content, is_system)
  VALUES (p_chat, c.employer_id, 'Nuovo lavoro: ' || coalesce(v_titolo, 'un altro annuncio'), true);
END;
$$;
REVOKE ALL ON FUNCTION public.cambia_lavoro_chat(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- 3. I deviatori -------------------------------------------------------------
-- Una chat nuova per una coppia che ne ha già una diventa una riga agganciata.
CREATE OR REPLACE FUNCTION public.aggancia_chat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_principale uuid;
BEGIN
  IF NEW.unita_in IS NULL THEN
    SELECT id INTO v_principale
      FROM chats
     WHERE employer_id = NEW.employer_id AND worker_id = NEW.worker_id AND unita_in IS NULL
     LIMIT 1;
    NEW.unita_in := v_principale;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS aggancia_chat ON public.chats;
CREATE TRIGGER aggancia_chat
  BEFORE INSERT ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.aggancia_chat();

-- …e la principale passa al suo lavoro, col timbro.
CREATE OR REPLACE FUNCTION public.dopo_chat_agganciata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.unita_in IS NOT NULL THEN
    PERFORM public.cambia_lavoro_chat(NEW.unita_in, NEW.job_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS dopo_chat_agganciata ON public.chats;
CREATE TRIGGER dopo_chat_agganciata
  AFTER INSERT ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.dopo_chat_agganciata();

-- Un messaggio scritto su una riga agganciata va nella principale. Gira PRIMA
-- dei controlli delle policy, che quindi guardano la principale.
CREATE OR REPLACE FUNCTION public.reindirizza_messaggio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_principale uuid;
BEGIN
  SELECT unita_in INTO v_principale FROM chats WHERE id = NEW.chat_id;
  IF v_principale IS NOT NULL THEN
    NEW.chat_id := v_principale;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS reindirizza_messaggio ON public.messages;
CREATE TRIGGER reindirizza_messaggio
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.reindirizza_messaggio();

-- Una notifica che porta a una riga agganciata porta alla principale.
CREATE OR REPLACE FUNCTION public.reindirizza_notifica()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_principale uuid;
BEGIN
  IF NEW.azione = 'chat' AND NEW.riferimento IS NOT NULL THEN
    SELECT unita_in INTO v_principale FROM chats WHERE id = NEW.riferimento;
    IF v_principale IS NOT NULL THEN
      NEW.chiave := replace(NEW.chiave, NEW.riferimento::text, v_principale::text);
      NEW.riferimento := v_principale;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS reindirizza_notifica ON public.notifiche;
CREATE TRIGGER reindirizza_notifica
  BEFORE INSERT ON public.notifiche
  FOR EACH ROW EXECUTE FUNCTION public.reindirizza_notifica();

-- 6. apri_chat: accettando una candidatura -----------------------------------
CREATE OR REPLACE FUNCTION public.apri_chat(p_candidatura uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a record;
  v_riga record;
  v_principale uuid;
BEGIN
  SELECT ap.id, ap.applicant_id, ap.job_id, j.owner_id
    INTO a
    FROM applications ap
    JOIN jobs j ON j.id = ap.job_id
   WHERE ap.id = p_candidatura;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'candidatura_non_trovata';
  END IF;
  IF a.owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'non_autorizzato';
  END IF;

  SELECT id, unita_in INTO v_riga
    FROM chats
   WHERE job_id = a.job_id AND worker_id = a.applicant_id AND employer_id = a.owner_id
   LIMIT 1;

  IF NOT FOUND THEN
    -- `aggancia_chat` e `dopo_chat_agganciata` fanno il resto.
    INSERT INTO chats (job_id, worker_id, employer_id)
    VALUES (a.job_id, a.applicant_id, a.owner_id)
    RETURNING coalesce(unita_in, id) INTO v_principale;
  ELSE
    v_principale := coalesce(v_riga.unita_in, v_riga.id);
    PERFORM cambia_lavoro_chat(v_principale, a.job_id);
  END IF;

  RETURN v_principale;
END;
$$;
REVOKE ALL ON FUNCTION public.apri_chat(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apri_chat(uuid) TO authenticated;

-- La vista della lista: solo le principali, col lavoro CORRENTE -------------
-- Stesse colonne, stesso ordine, stessi tipi di 20261023130000: cambiano solo
-- il lavoro (`coalesce(c.lavoro_corrente, c.job_id)`) e il filtro.
CREATE OR REPLACE VIEW public.chat_overview WITH (security_invoker = true) AS
SELECT
  c.id,
  coalesce(c.lavoro_corrente, c.job_id) AS job_id,
  c.worker_id,
  c.employer_id,
  c.created_at,
  c.updated_at,
  COALESCE(j.title, a.job_title) AS job_title,
  w.full_name AS worker_full_name,
  w.avatar_url AS worker_avatar_url,
  w.photos AS worker_photos,
  e.full_name AS employer_full_name,
  e.avatar_url AS employer_avatar_url,
  e.photos AS employer_photos,
  lm.content AS last_message_content,
  lm.created_at AS last_message_created_at,
  lm.sender_id AS last_message_sender_id,
  (lm.attachment_url IS NOT NULL) AS last_message_has_attachment,
  COALESCE(unw.unread, 0) AS unread_for_worker,
  COALESCE(une.unread, 0) AS unread_for_employer,
  a.status AS application_status
FROM public.chats c
LEFT JOIN public.jobs j ON j.id = coalesce(c.lavoro_corrente, c.job_id)
LEFT JOIN public.profiles w ON w.id = c.worker_id
LEFT JOIN public.profiles e ON e.id = c.employer_id
LEFT JOIN LATERAL (
  SELECT m.content, m.created_at, m.sender_id, m.attachment_url
  FROM public.messages m
  WHERE m.chat_id = c.id
  ORDER BY m.created_at DESC
  LIMIT 1
) lm ON true
LEFT JOIN LATERAL (
  SELECT count(*)::int AS unread
  FROM public.messages m
  WHERE m.chat_id = c.id
    AND m.is_read = false
    AND m.sender_id = c.employer_id
) unw ON true
LEFT JOIN LATERAL (
  SELECT count(*)::int AS unread
  FROM public.messages m
  WHERE m.chat_id = c.id
    AND m.is_read = false
    AND m.sender_id = c.worker_id
) une ON true
LEFT JOIN public.applications a
  ON a.job_id = coalesce(c.lavoro_corrente, c.job_id) AND a.applicant_id = c.worker_id
WHERE c.unita_in IS NULL;

GRANT SELECT ON public.chat_overview TO authenticated;
GRANT SELECT ON public.chat_overview TO service_role;