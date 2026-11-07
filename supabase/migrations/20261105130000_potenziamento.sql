-- =====================================================================
-- GLI EFFETTI DEL POTENZIAMENTO — fase di prova (5 novembre 2026)
--
-- Il principio (Tommaso): il potenziamento non mostra MAI a uno studente
-- annunci che non ha cercato. Fa solo passare avanti l'annuncio tra quelli
-- già pertinenti per lui (l'ordine lo fa l'app, lib/potenziamento.ts) e lo
-- segnala a chi cerca quel lavoro vicino (la notifica sta nel sistema delle
-- notifiche, 20261105140000_notifiche.sql).
--
-- 1. i centri dei quartieri (la «zona» del profilo, non il GPS), che usano
--    anche le notifiche;
-- 2. i dati del test: viste nella lista e aperture.
--
-- Rieseguibile. Va applicata DOPO 20261105120000_opzioni_annuncio.sql, PRIMA
-- di 20261105140000_notifiche.sql e del push del codice.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. I CENTRI DEI QUARTIERI — da OpenStreetMap (Nominatim, `suburb`).
--    ⚠️ Gli stessi numeri sono in src/constants/quartieri.ts (l'ordine per
--    distanza della Lista): vanno cambiati insieme.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quartieri (
  nome text PRIMARY KEY,
  lat double precision NOT NULL,
  lng double precision NOT NULL
);
ALTER TABLE public.quartieri ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chiunque legge i quartieri" ON public.quartieri;
CREATE POLICY "Chiunque legge i quartieri" ON public.quartieri FOR SELECT USING (true);
GRANT SELECT ON public.quartieri TO anon, authenticated;

INSERT INTO public.quartieri (nome, lat, lng) VALUES
  ('Albaro', 44.3972, 8.9636),
  ('Apparizione', 44.4043, 8.9948),
  ('Bavari', 44.4328, 9.0193),
  ('Bolzaneto', 44.4587, 8.9015),
  ('Borgoratti', 44.4081, 8.9885),
  ('Borzoli', 44.4344, 8.8675),
  ('Carignano', 44.4017, 8.9371),
  ('Castelletto', 44.4155, 8.9404),
  ('Centro Storico', 44.4097, 8.9316),
  ('Cornigliano', 44.4161, 8.8718),
  ('Foce', 44.3994, 8.949),
  ('Lagaccio', 44.4207, 8.9177),
  ('Maddalena', 44.4104, 8.932),
  ('Marassi', 44.417, 8.9563),
  ('Molassana', 44.4535, 8.9809),
  ('Molo', 44.4064, 8.9304),
  ('Nervi', 44.3833, 9.0391),
  ('Oregina', 44.423, 8.9252),
  ('Pegli', 44.4272, 8.8149),
  ('Pontedecimo', 44.4978, 8.9035),
  ('Portoria', 44.407, 8.9363),
  ('Prà', 44.4282, 8.7832),
  ('Prè', 44.4136, 8.9268),
  ('Quarto dei Mille', 44.3928, 8.998),
  ('Quezzi', 44.4212, 8.9715),
  ('Quinto al Mare', 44.3859, 9.0164),
  ('Rivarolo', 44.438, 8.893),
  ('Sampierdarena', 44.4127, 8.8929),
  ('San Fruttuoso', 44.408, 8.9611),
  ('San Martino', 44.406, 8.9749),
  ('San Quirico', 44.4826, 8.9011),
  ('San Teodoro', 44.4183, 8.9106),
  ('San Vincenzo', 44.4053, 8.9425),
  ('Sant''Eusebio', 44.442, 8.986),
  ('Sant''Ilario', 44.3849, 9.051),
  ('Sestri Ponente', 44.4249, 8.8499),
  ('Staglieno', 44.4313, 8.9506),
  ('Struppa', 44.451, 9.0097),
  ('Voltri', 44.4286, 8.7542)
ON CONFLICT (nome) DO UPDATE SET lat = EXCLUDED.lat, lng = EXCLUDED.lng;

-- Distanza in metri (haversine): basta e avanza per una città.
CREATE OR REPLACE FUNCTION public.distanza_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ))
$$;


-- ---------------------------------------------------------------------
-- 2. I DATI DEL TEST: quante volte un annuncio è stato visto nella lista e
--    aperto. Le candidature si contano da `applications`.
--    - una «vista» = la card è comparsa sullo schermo, una volta per
--      sessione dell'app (l'app non la ripete scorrendo su e giù);
--    - un'«apertura» = la scheda dell'annuncio si è aperta;
--    - chi l'ha pubblicato non conta.
--    Si scrivono solo con le due funzioni; la tabella non la legge nessuno
--    dall'app (RLS senza policy). Si guarda con la vista
--    `statistiche_annunci_test`, dal pannello SQL.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.statistiche_annunci (
  job_id uuid PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE,
  viste integer NOT NULL DEFAULT 0,
  aperture integer NOT NULL DEFAULT 0,
  aggiornate_il timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.statistiche_annunci ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.registra_viste(annunci uuid[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.statistiche_annunci AS s (job_id, viste)
  SELECT j.id, 1 FROM public.jobs j
   WHERE j.id IN (SELECT DISTINCT unnest(annunci))
     AND auth.uid() IS NOT NULL AND j.owner_id <> auth.uid()
  ON CONFLICT (job_id) DO UPDATE SET viste = s.viste + 1, aggiornate_il = now();
$$;

CREATE OR REPLACE FUNCTION public.registra_apertura(annuncio uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.statistiche_annunci AS s (job_id, aperture)
  SELECT j.id, 1 FROM public.jobs j
   WHERE j.id = annuncio AND auth.uid() IS NOT NULL AND j.owner_id <> auth.uid()
  ON CONFLICT (job_id) DO UPDATE SET aperture = s.aperture + 1, aggiornate_il = now();
$$;

REVOKE EXECUTE ON FUNCTION public.registra_viste(uuid[]) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.registra_apertura(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.registra_viste(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registra_apertura(uuid) TO authenticated;

-- Per l'analisi: un annuncio per riga, con opzione, prezzi e i tre numeri.
-- ⚠️ Niente accesso dall'app: la vista legge coi permessi di chi l'ha creata
-- e mostrerebbe tutto a tutti.
CREATE OR REPLACE VIEW public.statistiche_annunci_test AS
SELECT j.id, j.title, j.created_at, j.scade_il, j.opzione,
       j.prezzo_potenziamento, j.prezzo_allungamento, j.prezzo_pacchetto,
       coalesce(s.viste, 0) AS viste,
       coalesce(s.aperture, 0) AS aperture,
       (SELECT count(*) FROM public.applications a WHERE a.job_id = j.id) AS candidature
  FROM public.jobs j
  LEFT JOIN public.statistiche_annunci s ON s.job_id = j.id;
REVOKE ALL ON public.statistiche_annunci_test FROM anon, authenticated, PUBLIC;
