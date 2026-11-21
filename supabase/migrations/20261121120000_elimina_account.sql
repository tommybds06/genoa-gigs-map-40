-- =====================================================================
-- ELIMINARE L'ACCOUNT DALL'APP (21 novembre 2026)
--
-- Prima «Elimina account» in Impostazioni diceva solo «Contatta il
-- supporto». Serve per il GDPR (art. 17) e lo chiedono gli store per l'app
-- nativa.
--
-- LA DECISIONE (Tommaso, 21 novembre): chat e recensioni RESTANO, anonime,
-- come su WhatsApp. La chat è la traccia degli accordi per l'ALTRA persona,
-- e una recensione vera non deve sparire perché chi l'ha scritta se ne va.
--
-- Come funziona:
--   • Il profilo NON si cancella: diventa una LAPIDE («Account eliminato»,
--     niente foto, bio, link, posizione, tag, badge; `eliminato_il`). Così
--     messaggi, recensioni, cartellini e chat che puntano a lui restano
--     validi. Per questo si toglie il legame profiles → auth.users, che
--     altrimenti cancellerebbe il profilo (e tutto il resto a cascata)
--     quando l'utente vero viene cancellato.
--   • Si cancella invece tutto ciò che è solo suo: i dati riservati (data di
--     nascita, partita IVA, area vera del privato), i telefoni iscritti alle
--     notifiche, le notifiche, le preferenze, le chat fissate/nascoste.
--   • Annunci: quelli senza candidature si cancellano; gli altri si
--     CHIUDONO (le candidature e le chat che li citano restano leggibili).
--   • Candidature di uno studente: quelle in attesa o rifiutate si
--     cancellano (chi ha pubblicato non deve valutare chi non c'è più); le
--     altre (accettate, assunte, concluse) restano: reggono bacheca e storico.
--   • Dopo, nessuno può più scrivergli (trigger sui messaggi) e nessuna
--     notifica gli viene creata (trigger sulle notifiche).
--
-- L'ordine lo fa l'edge function `elimina-account`, con la chiave di
-- servizio: 1) questa funzione, 2) le foto del profilo dallo Storage (dalle
-- API, il database non può), 3) l'utente di auth. Rieseguibile: se il terzo
-- passo fallisce, l'app riprova e qui non cambia niente.
--
-- Rieseguibile. Da applicare in Lovable PRIMA del push del codice (il
-- codice nuovo legge `eliminato_il`; senza la colonna la lettura del
-- profilo pubblico non si rompe, perché è `select *`, ma il bottone fallisce).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. La colonna della lapide
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS eliminato_il timestamptz;


-- ---------------------------------------------------------------------
-- 2. Il profilo sopravvive all'utente di auth
--    Il vincolo è `profiles.id REFERENCES auth.users(id) ON DELETE CASCADE`
--    (migration del 20 gennaio). Il nome si cerca, non si indovina.
-- ---------------------------------------------------------------------
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


-- ---------------------------------------------------------------------
-- 3. La funzione che svuota l'account. Solo il server (chiave di servizio).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.elimina_dati_account(p_utente uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- I trigger di protezione (profilo, scadenza degli annunci) lasciano fare
  -- al server.
  PERFORM set_config('politask.server', 'on', true);

  -- Annunci: senza candidature via; con candidature, chiusi.
  DELETE FROM public.jobs j
   WHERE j.owner_id = p_utente
     AND NOT EXISTS (SELECT 1 FROM public.applications a WHERE a.job_id = j.id);

  UPDATE public.jobs
     SET status = 'closed',
         scade_il = LEAST(scade_il, now()),
         scadenza_vista = true
   WHERE owner_id = p_utente
     AND status <> 'closed';

  -- Candidature di uno studente che non hanno portato a niente.
  DELETE FROM public.applications a
   WHERE a.applicant_id = p_utente
     AND a.status IN ('pending', 'rejected')
     AND NOT EXISTS (SELECT 1 FROM public.cartellini c WHERE c.application_id = a.id);

  -- Ciò che è solo suo.
  DELETE FROM public.profili_riservati    WHERE id = p_utente;
  DELETE FROM public.iscrizioni_push      WHERE utente_id = p_utente;
  DELETE FROM public.notifiche            WHERE utente_id = p_utente;
  DELETE FROM public.preferenze_notifiche WHERE utente_id = p_utente;
  DELETE FROM public.chat_utente          WHERE user_id = p_utente;

  -- La lapide. Il ruolo resta: dice il colore delle sue bolle e recensioni.
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


-- ---------------------------------------------------------------------
-- 4. A un account eliminato non si scrive più
--    BEFORE INSERT, e prima di `reindirizza_messaggio` (i trigger BEFORE
--    partono in ordine alfabetico): la coppia della chat è la stessa anche
--    su una riga agganciata. Solo i messaggi degli UTENTI: quelli del
--    database (timbri, chiusure automatiche) non hanno auth.uid().
-- ---------------------------------------------------------------------
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


-- ---------------------------------------------------------------------
-- 5. Nessuna notifica per un account eliminato
--    Più semplice che toccare `crea_notifica`: la riga semplicemente non
--    nasce (un BEFORE INSERT che restituisce NULL la salta).
-- ---------------------------------------------------------------------
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
