-- lovable-cron-fallback-reviewed: deferred push/email delivery (quiet hours, 2h email delay, pg_net fallback) needs per-minute sweep as specified by the user
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS inizio_il timestamptz;

CREATE TABLE IF NOT EXISTS public.preferenze_notifiche (
  utente_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidature boolean NOT NULL DEFAULT true,
  messaggi boolean NOT NULL DEFAULT true,
  vicini boolean NOT NULL DEFAULT true,
  scadenze boolean NOT NULL DEFAULT true,
  promemoria boolean NOT NULL DEFAULT false,
  aggiornate_il timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.preferenze_notifiche TO authenticated;
ALTER TABLE public.preferenze_notifiche ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ognuno le sue preferenze" ON public.preferenze_notifiche;
CREATE POLICY "Ognuno le sue preferenze" ON public.preferenze_notifiche
  FOR ALL USING (auth.uid() = utente_id) WITH CHECK (auth.uid() = utente_id);

CREATE OR REPLACE FUNCTION public.preferenza_notifiche(p_utente uuid, p_categoria text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE p_categoria
    WHEN 'candidature' THEN coalesce((SELECT candidature FROM preferenze_notifiche WHERE utente_id = p_utente), true)
    WHEN 'messaggi'    THEN coalesce((SELECT messaggi    FROM preferenze_notifiche WHERE utente_id = p_utente), true)
    WHEN 'vicini'      THEN coalesce((SELECT vicini      FROM preferenze_notifiche WHERE utente_id = p_utente), true)
    WHEN 'scadenze'    THEN coalesce((SELECT scadenze    FROM preferenze_notifiche WHERE utente_id = p_utente), true)
    WHEN 'promemoria'  THEN coalesce((SELECT promemoria  FROM preferenze_notifiche WHERE utente_id = p_utente), false)
    ELSE true
  END
$$;

CREATE TABLE IF NOT EXISTS public.notifiche (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  categoria text NOT NULL,
  titolo text NOT NULL,
  testo text NOT NULL,
  azione text,
  riferimento uuid,
  chiave text,
  conteggio integer NOT NULL DEFAULT 1,
  canali text[] NOT NULL DEFAULT '{app}',
  creata_il timestamptz NOT NULL DEFAULT now(),
  aggiornata_il timestamptz NOT NULL DEFAULT now(),
  mostra_dal timestamptz NOT NULL DEFAULT now(),
  giorno date NOT NULL,
  letta_il timestamptz,
  push_inviata_il timestamptz,
  email_dopo timestamptz,
  email_inviata_il timestamptz
);
ALTER TABLE public.notifiche
  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'account',
  ADD COLUMN IF NOT EXISTS titolo text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS azione text,
  ADD COLUMN IF NOT EXISTS riferimento uuid,
  ADD COLUMN IF NOT EXISTS chiave text,
  ADD COLUMN IF NOT EXISTS conteggio integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS canali text[] NOT NULL DEFAULT '{app}',
  ADD COLUMN IF NOT EXISTS aggiornata_il timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS letta_il timestamptz,
  ADD COLUMN IF NOT EXISTS email_dopo timestamptz,
  ADD COLUMN IF NOT EXISTS email_inviata_il timestamptz;

CREATE INDEX IF NOT EXISTS notifiche_utente ON public.notifiche (utente_id, creata_il DESC);
CREATE INDEX IF NOT EXISTS notifiche_chiave ON public.notifiche (utente_id, chiave);
CREATE INDEX IF NOT EXISTS notifiche_da_inviare ON public.notifiche (mostra_dal) WHERE push_inviata_il IS NULL;
CREATE INDEX IF NOT EXISTS notifiche_email ON public.notifiche (email_dopo) WHERE email_inviata_il IS NULL AND email_dopo IS NOT NULL;

GRANT SELECT, UPDATE ON public.notifiche TO authenticated;
ALTER TABLE public.notifiche ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ognuno legge le sue notifiche" ON public.notifiche;
CREATE POLICY "Ognuno legge le sue notifiche" ON public.notifiche
  FOR SELECT USING (auth.uid() = utente_id AND mostra_dal <= now());
DROP POLICY IF EXISTS "Ognuno segna le sue notifiche" ON public.notifiche;
CREATE POLICY "Ognuno segna le sue notifiche" ON public.notifiche
  FOR UPDATE USING (auth.uid() = utente_id) WITH CHECK (auth.uid() = utente_id);

CREATE OR REPLACE FUNCTION public.proteggi_notifica()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    NEW := jsonb_populate_record(OLD, jsonb_build_object('letta_il', NEW.letta_il));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS proteggi_notifica ON public.notifiche;
CREATE TRIGGER proteggi_notifica BEFORE UPDATE ON public.notifiche
  FOR EACH ROW EXECUTE FUNCTION public.proteggi_notifica();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifiche') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifiche;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.iscrizioni_push (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  piattaforma text NOT NULL DEFAULT 'web' CHECK (piattaforma IN ('web', 'despia')),
  endpoint text NOT NULL UNIQUE,
  p256dh text,
  auth text,
  creata_il timestamptz NOT NULL DEFAULT now(),
  usata_il timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iscrizioni_push TO authenticated;
ALTER TABLE public.iscrizioni_push ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ognuno i suoi dispositivi" ON public.iscrizioni_push;
CREATE POLICY "Ognuno i suoi dispositivi" ON public.iscrizioni_push
  FOR ALL USING (auth.uid() = utente_id) WITH CHECK (auth.uid() = utente_id);

CREATE OR REPLACE FUNCTION public.registra_dispositivo(
  p_piattaforma text, p_endpoint text, p_p256dh text DEFAULT NULL, p_auth text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'non_autenticato'; END IF;
  INSERT INTO iscrizioni_push (utente_id, piattaforma, endpoint, p256dh, auth)
  VALUES (auth.uid(), p_piattaforma, p_endpoint, p_p256dh, p_auth)
  ON CONFLICT (endpoint) DO UPDATE
    SET utente_id = auth.uid(), piattaforma = EXCLUDED.piattaforma,
        p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, usata_il = now();
END;
$$;
REVOKE EXECUTE ON FUNCTION public.registra_dispositivo(text, text, text, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.registra_dispositivo(text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.orario_silenzio(t timestamptz)
RETURNS timestamptz LANGUAGE sql STABLE
AS $$
  SELECT CASE
    WHEN extract(hour FROM t AT TIME ZONE 'Europe/Rome') < 7
      THEN (date(t AT TIME ZONE 'Europe/Rome') + time '07:00') AT TIME ZONE 'Europe/Rome'
    ELSE t
  END
$$;

CREATE OR REPLACE FUNCTION public.crea_notifica(
  p_utente uuid, p_tipo text, p_titolo text, p_testo text,
  p_azione text DEFAULT NULL, p_riferimento uuid DEFAULT NULL,
  p_chiave text DEFAULT NULL, p_modo text DEFAULT NULL, p_testo_gruppo text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_categoria text;
  v_canali text[];
  v_silenzio boolean := false;
  v_email text;
  v_mostra timestamptz;
  v_id uuid;
  v_conteggio integer;
BEGIN
  CASE p_tipo
    WHEN 'scelto'              THEN v_categoria := 'candidature'; v_canali := '{app,push,email}'; v_email := 'dopo_2_ore';
    WHEN 'candidatura'         THEN v_categoria := 'candidature'; v_canali := '{app,push,email}'; v_email := 'dopo_2_ore';
    WHEN 'messaggio'           THEN v_categoria := 'messaggi';    v_canali := '{app,push}';
    WHEN 'recensione_da_fare'  THEN v_categoria := 'candidature'; v_canali := '{app,push}';
    WHEN 'lavoro_confermato'   THEN v_categoria := 'candidature'; v_canali := '{app}';
    WHEN 'lavoro_vicino'       THEN v_categoria := 'vicini';      v_canali := '{app,push}'; v_silenzio := true;
    WHEN 'promemoria'          THEN v_categoria := 'promemoria';  v_canali := '{app,push}'; v_silenzio := true;
    WHEN 'in_scadenza'         THEN v_categoria := 'scadenze';    v_canali := '{app}';      v_silenzio := true;
    WHEN 'scaduto'             THEN v_categoria := 'scadenze';    v_canali := '{app,push}';
    WHEN 'lavoro_finito'       THEN v_categoria := 'scadenze';    v_canali := '{app,push}'; v_silenzio := true;
    WHEN 'recensione_ricevuta' THEN v_categoria := 'account';     v_canali := '{app}';
    WHEN 'verifica_piva'       THEN v_categoria := 'account';     v_canali := '{app,email}'; v_email := 'subito';
    ELSE RAISE EXCEPTION 'tipo di notifica sconosciuto: %', p_tipo;
  END CASE;

  IF NOT public.preferenza_notifiche(p_utente, v_categoria) THEN
    RETURN NULL;
  END IF;

  IF p_modo = 'unico' AND EXISTS (
    SELECT 1 FROM notifiche WHERE utente_id = p_utente AND chiave = p_chiave
  ) THEN
    RETURN NULL;
  END IF;

  IF p_modo = 'gruppo' THEN
    SELECT id, conteggio INTO v_id, v_conteggio FROM notifiche
     WHERE utente_id = p_utente AND chiave = p_chiave AND letta_il IS NULL
       AND (p_tipo <> 'candidatura' OR creata_il > now() - INTERVAL '1 hour')
     ORDER BY creata_il DESC LIMIT 1
     FOR UPDATE;
    IF v_id IS NOT NULL THEN
      UPDATE notifiche
         SET conteggio = v_conteggio + 1,
             titolo = p_titolo,
             testo = format(p_testo_gruppo, v_conteggio + 1),
             aggiornata_il = now(),
             push_inviata_il = NULL
       WHERE id = v_id;
      RETURN v_id;
    END IF;
  END IF;

  v_mostra := CASE WHEN v_silenzio THEN public.orario_silenzio(now()) ELSE now() END;
  INSERT INTO notifiche (utente_id, tipo, categoria, titolo, testo, azione, riferimento, chiave,
                         canali, mostra_dal, giorno, email_dopo)
  VALUES (p_utente, p_tipo, v_categoria, p_titolo, p_testo, p_azione, p_riferimento, p_chiave,
          v_canali, v_mostra, date(v_mostra AT TIME ZONE 'Europe/Rome'),
          CASE v_email WHEN 'dopo_2_ore' THEN v_mostra + INTERVAL '2 hours' WHEN 'subito' THEN now() END)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.crea_notifica(uuid, text, text, text, text, uuid, text, text, text) FROM anon, authenticated, PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.crea_notifica(uuid, text, text, text, text, uuid, text, text, text) TO service_role;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.ruolo_annuncio(p_tags text[], p_titolo text)
RETURNS text LANGUAGE sql IMMUTABLE
AS $$
  SELECT coalesce(
    (SELECT t FROM unnest(p_tags) AS t
      WHERE t NOT IN ('Una tantum', 'Giorni', 'Settimane', 'Mesi', 'Continuativo',
                      'Occasionale', 'A Chiamata', 'Mensile', 'Settimanale', 'Weekend')
      LIMIT 1),
    p_titolo)
$$;

CREATE OR REPLACE FUNCTION public.nome_di(p_utente uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT coalesce((SELECT full_name FROM profiles WHERE id = p_utente), 'Qualcuno') $$;

CREATE OR REPLACE FUNCTION public.notifiche_candidature()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  j record;
  v_ruolo text;
  v_chat uuid;
BEGIN
  SELECT id, owner_id, title, tags INTO j FROM jobs WHERE id = NEW.job_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  v_ruolo := public.ruolo_annuncio(j.tags, j.title);

  IF TG_OP = 'INSERT' THEN
    PERFORM public.crea_notifica(j.owner_id, 'candidatura', 'Nuova candidatura per ' || v_ruolo,
      j.title, 'candidature', j.id, 'candidature:' || j.id, 'gruppo', '%s nuove candidature per ' || v_ruolo);
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'hired' THEN
      SELECT id INTO v_chat FROM chats WHERE job_id = j.id AND worker_id = NEW.applicant_id LIMIT 1;
      PERFORM public.crea_notifica(NEW.applicant_id, 'scelto',
        public.nome_di(j.owner_id) || ' ti ha scelto per ' || v_ruolo, j.title,
        CASE WHEN v_chat IS NULL THEN 'bacheca' ELSE 'chat' END, coalesce(v_chat, NEW.id),
        'scelto:' || NEW.id, 'unico');
    ELSIF NEW.status = 'completed' THEN
      PERFORM public.crea_notifica(NEW.applicant_id, 'recensione_da_fare',
        'Com''è andata da ' || public.nome_di(j.owner_id) || '?', 'Lascia una recensione',
        'recensione', NEW.id, 'recensione:' || NEW.id, 'unico');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS notifiche_candidature ON public.applications;
CREATE TRIGGER notifiche_candidature
  AFTER INSERT OR UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notifiche_candidature();

CREATE OR REPLACE FUNCTION public.notifiche_cartellini()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  j record;
  v_chat uuid;
BEGIN
  SELECT id, owner_id, title, tags INTO j FROM jobs WHERE id = NEW.job_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    SELECT id INTO v_chat FROM chats WHERE job_id = j.id AND worker_id = NEW.worker_id LIMIT 1;
    PERFORM public.crea_notifica(NEW.worker_id, 'scelto',
      public.nome_di(j.owner_id) || ' ti ha scelto per ' || public.ruolo_annuncio(j.tags, j.title), j.title,
      CASE WHEN v_chat IS NULL THEN 'bacheca' ELSE 'chat' END, coalesce(v_chat, NEW.id),
      'scelto:' || NEW.application_id, 'unico');
  ELSIF NEW.cuore IS TRUE AND OLD.cuore IS DISTINCT FROM true THEN
    PERFORM public.crea_notifica(NEW.worker_id, 'lavoro_confermato',
      'Lavoro confermato: ora è sul tuo profilo', public.nome_di(j.owner_id) || ' · ' || j.title,
      'profilo', NULL, 'confermato:' || NEW.id, 'unico');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS notifiche_cartellini ON public.cartellini;
CREATE TRIGGER notifiche_cartellini
  AFTER INSERT OR UPDATE OF cuore ON public.cartellini
  FOR EACH ROW EXECUTE FUNCTION public.notifiche_cartellini();

CREATE OR REPLACE FUNCTION public.notifiche_messaggi()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  c record;
  v_nome text;
  v_testo text;
BEGIN
  IF coalesce(NEW.is_system, false) THEN RETURN NEW; END IF;
  SELECT id, worker_id, employer_id INTO c FROM chats WHERE id = NEW.chat_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  v_nome := public.nome_di(NEW.sender_id);
  v_testo := CASE
    WHEN coalesce(trim(NEW.content), '') IN ('', '📷 Foto') AND NEW.attachment_url IS NOT NULL THEN 'Ti ha mandato una foto'
    WHEN length(NEW.content) > 80 THEN left(NEW.content, 79) || '…'
    ELSE NEW.content
  END;
  PERFORM public.crea_notifica(
    CASE WHEN NEW.sender_id = c.worker_id THEN c.employer_id ELSE c.worker_id END,
    'messaggio', v_nome, v_testo, 'chat', c.id, 'chat:' || c.id, 'gruppo',
    '%s nuovi messaggi da ' || v_nome);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS notifiche_messaggi ON public.messages;
CREATE TRIGGER notifiche_messaggi
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notifiche_messaggi();

CREATE OR REPLACE FUNCTION public.notifiche_recensioni()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.crea_notifica(NEW.employer_id, 'recensione_ricevuta', 'Nuova recensione',
    public.nome_di(NEW.worker_id) || ' ti ha dato ' || NEW.rating || ' stelle su 5',
    'profilo', NULL, 'recensione_ricevuta:' || NEW.id, 'unico');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS notifiche_recensioni ON public.reviews;
CREATE TRIGGER notifiche_recensioni
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notifiche_recensioni();

CREATE OR REPLACE FUNCTION public.notifiche_lavoro_vicino()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ruolo text;
  v_giorno date := date(public.orario_silenzio(now()) AT TIME ZONE 'Europe/Rome');
  p record;
BEGIN
  IF NEW.opzione NOT IN ('potenziamento', 'pacchetto') OR NEW.lat IS NULL OR NEW.lng IS NULL THEN
    RETURN NEW;
  END IF;
  v_ruolo := public.ruolo_annuncio(NEW.tags, NULL);
  IF v_ruolo IS NULL THEN RETURN NEW; END IF;

  FOR p IN
    SELECT pr.id FROM profiles pr
      JOIN quartieri q ON q.nome = pr.neighborhood
     WHERE pr.role = 'worker'
       AND pr.id <> NEW.owner_id
       AND v_ruolo = ANY (pr.tags)
       AND public.distanza_m(q.lat, q.lng, NEW.lat, NEW.lng) <= 2000
       AND (SELECT count(*) FROM notifiche n
             WHERE n.utente_id = pr.id AND n.tipo = 'lavoro_vicino' AND n.giorno = v_giorno) < 2
  LOOP
    PERFORM public.crea_notifica(p.id, 'lavoro_vicino',
      'Nuovo lavoro vicino a te: ' || v_ruolo || coalesce(', ' || NEW.neighborhood, ''), NEW.title,
      'annuncio', NEW.id, 'vicino:' || NEW.id, 'unico');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS notifica_lavoro_potenziato ON public.jobs;
DROP FUNCTION IF EXISTS public.notifica_lavoro_potenziato();
DROP TRIGGER IF EXISTS notifiche_lavoro_vicino ON public.jobs;
CREATE TRIGGER notifiche_lavoro_vicino
  AFTER INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.notifiche_lavoro_vicino();

REVOKE EXECUTE ON FUNCTION public.notifiche_candidature() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notifiche_cartellini() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notifiche_messaggi() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notifiche_recensioni() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notifiche_lavoro_vicino() FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE FUNCTION public.notifiche_a_orario()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r record;
  v_oggi date := date(now() AT TIME ZONE 'Europe/Rome');
BEGIN
  FOR r IN SELECT id, owner_id, title FROM jobs
            WHERE status = 'open' AND scade_il > now() AND scade_il <= now() + INTERVAL '6 hours'
  LOOP
    PERFORM crea_notifica(r.owner_id, 'in_scadenza', 'Il tuo annuncio scade tra poche ore', r.title,
      'annunci', r.id, 'in_scadenza:' || r.id, 'unico');
  END LOOP;

  FOR r IN SELECT j.id, j.owner_id, j.title FROM jobs j
            WHERE j.status = 'open' AND j.scade_il <= now() AND j.scade_il > now() - INTERVAL '1 day'
              AND NOT EXISTS (SELECT 1 FROM applications a
                               WHERE a.job_id = j.id AND a.status IN ('accepted', 'hired', 'completed'))
  LOOP
    PERFORM crea_notifica(r.owner_id, 'scaduto', 'Il tuo annuncio è scaduto. Vuoi ripubblicarlo?', r.title,
      'annunci', r.id, 'scaduto:' || r.id, 'unico');
  END LOOP;

  FOR r IN SELECT c.id, c.employer_id, c.worker_id FROM cartellini c
             JOIN applications a ON a.id = c.application_id
            WHERE c.data_fine IS NOT NULL AND c.data_fine < v_oggi AND a.status IN ('accepted', 'hired')
  LOOP
    PERFORM crea_notifica(r.employer_id, 'lavoro_finito',
      'Il lavoro con ' || nome_di(r.worker_id) || ' è finito?', 'Segnalo come concluso',
      'bacheca', r.id, 'finito:' || r.id, 'unico');
  END LOOP;

  FOR r IN SELECT j.id, j.owner_id, j.inizio_il, a.applicant_id, a.id AS candidatura,
                  CASE WHEN date(j.inizio_il AT TIME ZONE 'Europe/Rome') = date(orario_silenzio(now()) AT TIME ZONE 'Europe/Rome')
                       THEN 'Oggi' ELSE 'Domani' END AS quando
             FROM jobs j
             JOIN applications a ON a.job_id = j.id AND a.status IN ('accepted', 'hired')
            WHERE j.inizio_il > now() + INTERVAL '23 hours' AND j.inizio_il <= now() + INTERVAL '24 hours'
              AND (a.status = 'hired' OR EXISTS (SELECT 1 FROM cartellini c WHERE c.application_id = a.id))
  LOOP
    PERFORM crea_notifica(r.applicant_id, 'promemoria',
      r.quando || ' alle ' || to_char(r.inizio_il AT TIME ZONE 'Europe/Rome', 'HH24:MI') || ' hai il turno da ' || nome_di(r.owner_id),
      'Promemoria', 'bacheca', r.id, 'promemoria:' || r.candidatura || ':' || date(r.inizio_il), 'unico');
  END LOOP;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notifiche_a_orario() FROM anon, authenticated, PUBLIC;

CREATE TABLE IF NOT EXISTS public.impostazioni_server (
  chiave text PRIMARY KEY,
  valore text NOT NULL
);
REVOKE ALL ON public.impostazioni_server FROM anon, authenticated, PUBLIC;
ALTER TABLE public.impostazioni_server ENABLE ROW LEVEL SECURITY;
INSERT INTO public.impostazioni_server VALUES
  ('url_invio', 'https://cggwpktrbsphwvkrnrvj.supabase.co/functions/v1/invia-notifiche')
ON CONFLICT (chiave) DO NOTHING;

CREATE OR REPLACE FUNCTION public.chiama_invio_notifiche()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_url text := (SELECT valore FROM impostazioni_server WHERE chiave = 'url_invio');
  v_segreto text := (SELECT valore FROM impostazioni_server WHERE chiave = 'segreto_invio');
BEGIN
  IF v_url IS NULL OR v_segreto IS NULL THEN RETURN; END IF;
  EXECUTE 'SELECT net.http_post(url := $1, headers := $2, body := $3)'
    USING v_url,
          jsonb_build_object('Content-Type', 'application/json', 'x-politask-chiave', v_segreto),
          '{}'::jsonb;
EXCEPTION WHEN undefined_function OR invalid_schema_name THEN
  NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.chiama_invio_notifiche() FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE FUNCTION public.invio_subito()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF 'push' = ANY (NEW.canali) AND NEW.push_inviata_il IS NULL AND NEW.mostra_dal <= now() THEN
    PERFORM public.chiama_invio_notifiche();
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS invio_subito ON public.notifiche;
CREATE TRIGGER invio_subito
  AFTER INSERT OR UPDATE OF conteggio ON public.notifiche
  FOR EACH ROW EXECUTE FUNCTION public.invio_subito();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    PERFORM cron.schedule('politask-invia-notifiche', '* * * * *', 'SELECT public.chiama_invio_notifiche()');
    PERFORM cron.schedule('politask-notifiche-a-orario', '5 * * * *', 'SELECT public.notifiche_a_orario()');
  END IF;
END $$;