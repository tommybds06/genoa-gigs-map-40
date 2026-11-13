-- ============================================================================
-- CHAT FISSATE E NASCOSTE — 13 novembre 2026
--
-- Tommaso: «non si può nemmeno eliminare o fissare una chat se tieni premuto».
-- Decisione sua: «elimina» = NASCONDI PER ME. La chat sparisce dalla lista di
-- chi la nasconde, i messaggi restano (sono la traccia degli accordi di
-- un'assunzione), e ricompare da sola se arriva un messaggio nuovo.
--
-- Una riga per UTENTE e CHAT: ognuno fissa e nasconde per conto suo, l'altro
-- non ne sa niente.
--   fissata_il   NULL = non fissata; se no, da quando.
--   nascosta_il  NULL = in lista; se no, da quando. La chat è nascosta finché
--                il suo ultimo messaggio è PIÙ VECCHIO di questa data: il
--                confronto lo fa l'app, non serve un trigger sui messaggi.
--
-- ⚠️ Le due date le scrive il DATABASE (trigger `prepara_chat_utente`):
-- l'app manda «una data qualunque» o NULL. L'ora del telefono può essere
-- sbagliata, e una chat nascosta «nel futuro» non ricomparirebbe più.
--
-- Rieseguibile.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_utente (
  chat_id     uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fissata_il  timestamptz,
  nascosta_il timestamptz,
  PRIMARY KEY (chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS chat_utente_user_idx ON public.chat_utente (user_id);

ALTER TABLE public.chat_utente ENABLE ROW LEVEL SECURITY;

-- Ognuno vede e tocca solo le SUE righe, e solo per chat di cui fa parte.
DROP POLICY IF EXISTS "chat_utente: leggo le mie" ON public.chat_utente;
CREATE POLICY "chat_utente: leggo le mie" ON public.chat_utente
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "chat_utente: scrivo le mie" ON public.chat_utente;
CREATE POLICY "chat_utente: scrivo le mie" ON public.chat_utente
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id AND auth.uid() IN (c.worker_id, c.employer_id)
    )
  );

DROP POLICY IF EXISTS "chat_utente: cambio le mie" ON public.chat_utente;
CREATE POLICY "chat_utente: cambio le mie" ON public.chat_utente
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "chat_utente: tolgo le mie" ON public.chat_utente;
CREATE POLICY "chat_utente: tolgo le mie" ON public.chat_utente
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_utente TO authenticated;
GRANT ALL ON public.chat_utente TO service_role;

-- Le date le decide il database: una data nuova (prima era NULL, o è cambiata)
-- diventa «adesso»; una data già scritta e rimandata uguale resta com'era.
CREATE OR REPLACE FUNCTION public.prepara_chat_utente()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.fissata_il IS NOT NULL THEN
    IF TG_OP = 'UPDATE' AND OLD.fissata_il IS NOT NULL THEN
      NEW.fissata_il := OLD.fissata_il;
    ELSE
      NEW.fissata_il := now();
    END IF;
  END IF;

  IF NEW.nascosta_il IS NOT NULL THEN
    IF TG_OP = 'UPDATE' AND NEW.nascosta_il IS NOT DISTINCT FROM OLD.nascosta_il THEN
      NULL; -- la stessa di prima: non si tocca
    ELSE
      NEW.nascosta_il := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prepara_chat_utente ON public.chat_utente;
CREATE TRIGGER prepara_chat_utente
  BEFORE INSERT OR UPDATE ON public.chat_utente
  FOR EACH ROW EXECUTE FUNCTION public.prepara_chat_utente();
