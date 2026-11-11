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