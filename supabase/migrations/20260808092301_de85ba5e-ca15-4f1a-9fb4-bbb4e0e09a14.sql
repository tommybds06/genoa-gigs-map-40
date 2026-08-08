-- ============================================================
-- 20260806120000_chat_updated_at_is_system_e_vista_chat.sql
-- Tre miglioramenti alle chat: is_system su messages, trigger
-- su chats.updated_at, e vista chat_overview (N+1 di useChats).
-- ============================================================

-- 1. Colonna is_system su messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

-- Backfill: marca come di sistema i messaggi automatici già scritti.
UPDATE public.messages
SET is_system = true
WHERE content = '🎉 Complimenti! Sei stato assunto per questo incarico.'
  AND is_system = false;

-- 2. Trigger che aggiorna chats.updated_at all'inserimento di un messaggio.
-- SECURITY DEFINER perché la policy su chats nega UPDATE agli utenti.
CREATE OR REPLACE FUNCTION public.touch_chat_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chats
  SET updated_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_chat_updated_at ON public.messages;
CREATE TRIGGER touch_chat_updated_at
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_chat_updated_at();

-- Riallinea le chat esistenti: updated_at = data ultimo messaggio.
-- Disabilita temporaneamente il trigger update_chats_updated_at
-- (BEFORE UPDATE) che altrimenti sovrascriverebbe con now().
ALTER TABLE public.chats DISABLE TRIGGER update_chats_updated_at;

UPDATE public.chats c
SET updated_at = COALESCE(
  (SELECT max(m.created_at)
   FROM public.messages m
   WHERE m.chat_id = c.id),
  c.updated_at
);

ALTER TABLE public.chats ENABLE TRIGGER update_chats_updated_at;

-- 3. Vista chat_overview: elimina le 4 query per conversazione in useChats.
-- security_invoker = true: eredita le RLS delle tabelle sottostanti,
-- quindi un utente vede solo le chat di cui è partecipante.
CREATE OR REPLACE VIEW public.chat_overview WITH (security_invoker = true) AS
SELECT
  c.id,
  c.job_id,
  c.worker_id,
  c.employer_id,
  c.created_at,
  c.updated_at,
  j.title AS job_title,
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
LEFT JOIN public.jobs j ON j.id = c.job_id
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
  ON a.job_id = c.job_id AND a.applicant_id = c.worker_id;

GRANT SELECT ON public.chat_overview TO authenticated;
GRANT SELECT ON public.chat_overview TO service_role;