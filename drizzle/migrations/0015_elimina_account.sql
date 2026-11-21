-- ELIMINARE L'ACCOUNT DALL'APP (21 novembre 2026): profilo come lapide, chat e recensioni restano anonime.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS eliminato_il timestamptz;

DO $$
DECLARE
  v_nome text;
BEGIN
  FOR v_nome IN
    SELECT c.conname
      FROM pg_constraint c
     WHERE c.conrelid = 'public.profiles'::regclass
       AND c.contype = 'f'
       AND c.confrelid = 'auth.users'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', v_nome);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.elimina_dati_account(p_utente uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('politask.server', 'on', true);

  DELETE FROM public.jobs j
   WHERE j.owner_id = p_utente
     AND NOT EXISTS (SELECT 1 FROM public.applications a WHERE a.job_id = j.id);

  UPDATE public.jobs
     SET status = 'closed',
         scade_il = LEAST(scade_il, now()),
         scadenza_vista = true
   WHERE owner_id = p_utente
     AND status <> 'closed';

  DELETE FROM public.applications a
   WHERE a.applicant_id = p_utente
     AND a.status IN ('pending', 'rejected')
     AND NOT EXISTS (SELECT 1 FROM public.cartellini c WHERE c.application_id = a.id);

  DELETE FROM public.profili_riservati    WHERE id = p_utente;
  DELETE FROM public.iscrizioni_push      WHERE utente_id = p_utente;
  DELETE FROM public.notifiche            WHERE utente_id = p_utente;
  DELETE FROM public.preferenze_notifiche WHERE utente_id = p_utente;
  DELETE FROM public.chat_utente          WHERE user_id = p_utente;

  UPDATE public.profiles
     SET full_name              = 'Account eliminato',
         username               = NULL,
         avatar_url             = NULL,
         bio                    = NULL,
         experience             = NULL,
         looking_for            = NULL,
         photos                 = '{}',
         social_links           = NULL,
         tags                   = '{}',
         address_text           = NULL,
         neighborhood           = NULL,
         lat                    = NULL,
         lng                    = NULL,
         area_raggio            = NULL,
         piva_verificata        = false,
         piva_verificata_il     = NULL,
         identita_verificata    = false,
         identita_verificata_il = NULL,
         eliminato_il           = COALESCE(eliminato_il, now())
   WHERE id = p_utente;

  PERFORM set_config('politask.server', '', true);
END;
$$;

REVOKE ALL ON FUNCTION public.elimina_dati_account(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.elimina_dati_account(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.elimina_dati_account(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.messaggio_ad_account_eliminato()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
    SELECT 1
      FROM public.chats c
      JOIN public.profiles p
        ON p.id = CASE WHEN c.worker_id = NEW.sender_id THEN c.employer_id ELSE c.worker_id END
     WHERE c.id = NEW.chat_id
       AND p.eliminato_il IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'account_eliminato' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messaggio_ad_account_eliminato ON public.messages;
CREATE TRIGGER messaggio_ad_account_eliminato
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.messaggio_ad_account_eliminato();

CREATE OR REPLACE FUNCTION public.salta_notifiche_eliminati()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.utente_id AND eliminato_il IS NOT NULL) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS salta_notifiche_eliminati ON public.notifiche;
CREATE TRIGGER salta_notifiche_eliminati
  BEFORE INSERT ON public.notifiche
  FOR EACH ROW EXECUTE FUNCTION public.salta_notifiche_eliminati();