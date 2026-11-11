-- =====================================================================
-- LE NOTIFICHE: L'ESITO DEL PUSH, LA PROVA, LA SCADENZA SENZA DOMANDA
-- 11 novembre 2026
--
-- Tommaso: «non arrivano le notifiche, né Android né iOS». Nel centro
-- notifiche ci sono (il database le crea), sul telefono no. Fra le due cose
-- ci sono cinque anelli — il segreto in `impostazioni_server`, pg_net, la
-- funzione `invia-notifiche` con le chiavi VAPID, il servizio push di
-- Google/Apple, il dispositivo iscritto — e oggi un errore in uno qualunque
-- non lascia traccia: la funzione segna la notifica «inviata» comunque e
-- scrive l'errore solo nei suoi log.
--
-- 1. `notifiche.push_esito`: cosa è successo, scritto dalla funzione.
--    «google: 201», «apple: 403 BadJwtToken», «nessun dispositivo»,
--    «configurazione: …». Si legge da SQL e dall'app (Impostazioni → prova).
-- 2. `notifica_di_prova()`: dall'app (Impostazioni), una notifica all'utente
--    stesso, che fa tutto il giro vero. Il telefono la mostra SEMPRE, anche
--    con l'app aperta (public/sw.js), e l'app legge l'esito.
-- 3. La notifica «Il tuo annuncio è scaduto. Vuoi ripubblicarlo?» faceva una
--    domanda a cui l'app non sa rispondere: ripubblicare non si può
--    (§19). Decisione di Tommaso (11 novembre): niente ripubblica, la
--    notifica dice solo com'è andata e porta alle candidature.
--
-- Rieseguibile: ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE, UPDATE idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. L'ESITO
-- ---------------------------------------------------------------------
ALTER TABLE public.notifiche ADD COLUMN IF NOT EXISTS push_esito text;


-- ---------------------------------------------------------------------
-- 2. LA PROVA — un tipo in più in `crea_notifica`, e chi la chiede.
--    `crea_notifica` è identica alla 20261105140000 tranne la riga 'prova'.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crea_notifica(
  p_utente uuid, p_tipo text, p_titolo text, p_testo text,
  p_azione text DEFAULT NULL, p_riferimento uuid DEFAULT NULL,
  p_chiave text DEFAULT NULL, p_modo text DEFAULT NULL, p_testo_gruppo text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_categoria text;
  v_canali text[];
  v_silenzio boolean := false;
  v_email text; -- 'dopo_2_ore' | 'subito' | NULL
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
    -- La prova da Impostazioni: solo push (nel centro notifiche non si vede),
    -- categoria 'account', che non si spegne.
    WHEN 'prova'               THEN v_categoria := 'account';     v_canali := '{push}';
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
             push_inviata_il = NULL -- il push si rimanda aggiornato
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

-- Dall'app: «Mandami una notifica di prova». Una ogni 15 secondi al massimo.
-- Restituisce l'id: l'app ne legge `push_esito` finché non arriva.
CREATE OR REPLACE FUNCTION public.notifica_di_prova()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_utente uuid := auth.uid();
BEGIN
  IF v_utente IS NULL THEN RAISE EXCEPTION 'non_autenticato'; END IF;
  IF EXISTS (SELECT 1 FROM notifiche WHERE utente_id = v_utente AND tipo = 'prova'
                AND creata_il > now() - INTERVAL '15 seconds') THEN
    RAISE EXCEPTION 'troppo_presto';
  END IF;
  RETURN public.crea_notifica(v_utente, 'prova', 'Notifica di prova',
    'Se la vedi, le notifiche su questo telefono funzionano.');
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notifica_di_prova() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.notifica_di_prova() TO authenticated;


-- ---------------------------------------------------------------------
-- 3. LA SCADENZA, SENZA DOMANDA
--    `notifiche_a_orario` è identica alla 20261107120000 tranne il blocco
--    «Scaduto»: il titolo non chiede più niente, il testo dice quante
--    candidature aspettano una risposta. Porta all'annuncio in Annunci,
--    dove ci sono le candidature.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notifiche_a_orario()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_oggi date := date(now() AT TIME ZONE 'Europe/Rome');
BEGIN
  -- Annuncio in scadenza tra 6 ore (app).
  FOR r IN SELECT id, owner_id, title FROM jobs
            WHERE status = 'open' AND scade_il > now() AND scade_il <= now() + INTERVAL '6 hours'
  LOOP
    PERFORM crea_notifica(r.owner_id, 'in_scadenza', 'Il tuo annuncio scade tra poche ore', r.title,
      'annunci', r.id, 'in_scadenza:' || r.id, 'unico');
  END LOOP;

  -- Scaduto senza nessuno scelto (in prova, assunto o concluso): com'è
  -- andata, e quante candidature aspettano ancora una risposta.
  FOR r IN SELECT j.id, j.owner_id, j.title,
                  (SELECT count(*) FROM applications a
                    WHERE a.job_id = j.id AND a.status = 'pending') AS in_attesa
             FROM jobs j
            WHERE j.status = 'open' AND j.scade_il <= now() AND j.scade_il > now() - INTERVAL '1 day'
              AND NOT EXISTS (SELECT 1 FROM applications a
                               WHERE a.job_id = j.id AND a.status IN ('accepted', 'hired', 'completed'))
  LOOP
    PERFORM crea_notifica(r.owner_id, 'scaduto', 'Il tuo annuncio è scaduto',
      r.title || ' · ' || CASE r.in_attesa
        WHEN 0 THEN 'nessuna candidatura in attesa'
        WHEN 1 THEN '1 candidatura in attesa'
        ELSE r.in_attesa || ' candidature in attesa'
      END,
      'annunci', r.id, 'scaduto:' || r.id, 'unico');
  END LOOP;

  -- I giorni previsti sono passati: il lavoro è finito? (a chi l'ha offerto)
  FOR r IN SELECT c.id, c.employer_id, c.worker_id FROM cartellini c
             JOIN applications a ON a.id = c.application_id
            WHERE c.data_fine IS NOT NULL AND c.data_fine < v_oggi AND a.status IN ('accepted', 'hired')
  LOOP
    PERFORM crea_notifica(r.employer_id, 'lavoro_finito',
      'Il lavoro con ' || nome_di(r.worker_id) || ' è finito?', 'Segnalo come concluso',
      'bacheca', r.id, 'finito:' || r.id, 'unico');
  END LOOP;

  -- Promemoria del primo giorno di lavoro, dal CARTELLINO (20261107120000).
  IF extract(hour FROM now() AT TIME ZONE 'Europe/Rome') >= 18 THEN
    FOR r IN SELECT c.id, c.employer_id, c.worker_id, c.data_inizio,
                    c.data_fine = c.data_inizio AS un_giorno,
                    nullif(btrim(c.orari), '') AS orari
               FROM cartellini c
               JOIN applications a ON a.id = c.application_id AND a.status IN ('accepted', 'hired')
              WHERE c.data_inizio = v_oggi + 1
    LOOP
      PERFORM crea_notifica(r.worker_id, 'promemoria',
        CASE WHEN r.un_giorno THEN 'Domani lavori da ' ELSE 'Domani inizi a lavorare da ' END || nome_di(r.employer_id),
        coalesce(r.orari, 'Promemoria'),
        'bacheca', r.id, 'promemoria:' || r.id || ':' || r.data_inizio, 'unico');
    END LOOP;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notifiche_a_orario() FROM anon, authenticated, PUBLIC;

-- Le notifiche di scadenza già arrivate: via la domanda anche da quelle.
UPDATE public.notifiche
   SET titolo = 'Il tuo annuncio è scaduto'
 WHERE tipo = 'scaduto' AND titolo LIKE '%ripubblicarlo%';
