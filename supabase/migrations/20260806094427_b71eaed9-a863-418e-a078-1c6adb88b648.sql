-- 1. Applications: remove public exposure of completed applications
DROP POLICY IF EXISTS "Anyone can view completed applications" ON public.applications;

-- 2. Profiles: restrict to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.jobs FROM anon;
REVOKE ALL ON public.applications FROM anon;

-- 3. Replace get_user_role() usage in policies with inline subqueries, then lock the function down
DROP POLICY IF EXISTS "Employers can create jobs" ON public.jobs;
CREATE POLICY "Employers can create jobs"
ON public.jobs FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = owner_id
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'employer'::user_role
);

DROP POLICY IF EXISTS "Workers can apply to jobs" ON public.applications;
CREATE POLICY "Workers can apply to jobs"
ON public.applications FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = applicant_id
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'worker'::user_role
);

REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;

-- 4. Storage: profile-photos public bucket should not allow listing
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;

-- 5. Storage: chat attachments restricted to chat participants (path = <chat_id>/<user_id>/<file>)
DROP POLICY IF EXISTS "Anyone can view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own chat attachments" ON storage.objects;

CREATE POLICY "Chat participants can view chat attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.worker_id = auth.uid() OR c.employer_id = auth.uid())
  )
);

CREATE POLICY "Chat participants can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.worker_id = auth.uid() OR c.employer_id = auth.uid())
  )
);

CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);