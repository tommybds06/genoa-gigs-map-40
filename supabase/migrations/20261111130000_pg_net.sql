-- =====================================================================
-- PG_NET, E NIENTE PIÙ GUASTI MUTI NELL'INVIO DEI PUSH
-- 11 novembre 2026
--
-- La diagnosi (supabase/diagnosi-notifiche.sql, eseguita da Lovable): sul
-- database pg_net NON era installato. `chiama_invio_notifiche()` (migration
-- 20261105140000) intercettava l'errore e non faceva niente, per non
-- rompere chi crea le notifiche: quindi la funzione `invia-notifiche` non è
-- MAI stata chiamata, né subito né dal giro di ogni minuto, e nessun push è
-- mai partito. Tommaso: «non arrivano proprio mai, né Android né iOS».
--
-- 1. pg_net.
-- 2. Le notifiche rimaste in coda intanto NON partono tutte adesso: al
--    primo giro con pg_net arriverebbe sul telefono una raffica di messaggi
--    e candidature vecchi di ore. Si segnano «non mandate». ⚠️ Solo quelle
--    che dovevano partire più di 10 minuti fa: con pg_net al suo posto il
--    giro di ogni minuto non ne lascia indietro, quindi rieseguendo questa
--    migration non si tocca niente di buono (le rimandate dalla notte hanno
--    `mostra_dal` alle 7 e restano).
-- 3. Se l'invio non può partire (manca pg_net, manca il segreto), il motivo
--    finisce in `push_esito` delle notifiche in coda: la prova in
--    Impostazioni lo dice subito, invece di aspettare a vuoto.
--
-- Rieseguibile: IF NOT EXISTS, CREATE OR REPLACE, UPDATE con condizioni.
-- =====================================================================

-- 1. pg_net (crea lo schema `net`, con `net.http_post`).
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. La coda vecchia non parte.
UPDATE public.notifiche
   SET push_inviata_il = now(),
       push_esito = 'non mandata: pg_net mancava'
 WHERE push_inviata_il IS NULL
   AND 'push' = ANY (canali)
   AND mostra_dal < now() - INTERVAL '10 minutes';

-- 3. Il motivo, quando l'invio non può partire.
CREATE OR REPLACE FUNCTION public.segna_invio_impossibile(p_motivo text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE notifiche
     SET push_esito = p_motivo
   WHERE push_inviata_il IS NULL
     AND 'push' = ANY (canali)
     AND aggiornata_il > now() - INTERVAL '1 day'
     AND push_esito IS DISTINCT FROM p_motivo;
$$;
REVOKE EXECUTE ON FUNCTION public.segna_invio_impossibile(text) FROM anon, authenticated, PUBLIC;

-- Identica alla 20261105140000 tranne i due punti in cui prima si usciva in
-- silenzio. ⚠️ L'aggiornamento di `push_esito` non riaccende `invio_subito`
-- (scatta solo su INSERT e su UPDATE di `conteggio`).
CREATE OR REPLACE FUNCTION public.chiama_invio_notifiche()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text := (SELECT valore FROM impostazioni_server WHERE chiave = 'url_invio');
  v_segreto text := (SELECT valore FROM impostazioni_server WHERE chiave = 'segreto_invio');
BEGIN
  IF v_url IS NULL OR v_segreto IS NULL THEN
    PERFORM public.segna_invio_impossibile('server: manca il segreto o l''indirizzo per chiamare la funzione (impostazioni_server)');
    RETURN;
  END IF;
  EXECUTE 'SELECT net.http_post(url := $1, headers := $2, body := $3)'
    USING v_url,
          jsonb_build_object('Content-Type', 'application/json', 'x-politask-chiave', v_segreto),
          '{}'::jsonb;
EXCEPTION WHEN undefined_function OR invalid_schema_name THEN
  PERFORM public.segna_invio_impossibile('server: pg_net non installato, il database non può chiamare la funzione');
END;
$$;
REVOKE EXECUTE ON FUNCTION public.chiama_invio_notifiche() FROM anon, authenticated, PUBLIC;
