-- =====================================================================
-- IL TITOLO DELL'ANNUNCIO NELLE CHAT, ANCHE QUANDO L'ANNUNCIO È CHIUSO
-- =====================================================================
--
-- Il difetto: nella lista dei messaggi il worker vede la riga del titolo
-- VUOTA per tutte le chat di lavori conclusi. Ed è proprio la riga che
-- distingue due chat con la stessa attività (CLAUDE.md §18).
--
-- La causa: la vista `chat_overview` prende il titolo da `jobs`, ed è
-- `security_invoker`, cioè legge con i permessi di chi guarda. Un worker
-- legge solo gli annunci APERTI («Anyone can view open jobs»): la policy
-- «Workers can view jobs they applied to» è stata tolta il 3 aprile perché
-- creava una ricorsione RLS fra `jobs` e `applications`. Chiuso
-- l'annuncio, per lui il JOIN su `jobs` è vuoto e il titolo NULL.
--
-- La correzione: il titolo salvato nella candidatura alla sua nascita
-- (`applications.job_title`, lo snapshot del 10 luglio, fatto apposta
-- perché lo storico sopravviva all'annuncio). La candidatura il worker la
-- legge sempre: è la sua. Nessuna policy nuova, nessun rischio di
-- ricorsione.
--
-- Il resto della vista è IDENTICO a 20260808092301: stesse colonne, stesso
-- ordine, stessi tipi, quindi CREATE OR REPLACE basta. Rieseguibile.
-- =====================================================================

CREATE OR REPLACE VIEW public.chat_overview WITH (security_invoker = true) AS
SELECT
  c.id,
  c.job_id,
  c.worker_id,
  c.employer_id,
  c.created_at,
  c.updated_at,
  -- ⚠️ L'unica riga cambiata: se l'annuncio non si può leggere (chiuso, e
  -- chi guarda è il worker), il titolo salvato nella candidatura.
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