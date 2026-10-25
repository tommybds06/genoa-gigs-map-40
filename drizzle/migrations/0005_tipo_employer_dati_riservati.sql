-- =====================================================================
-- CHI OFFRE LAVORO: ATTIVITÀ O PRIVATO — più l'età dei worker e le verifiche
-- =====================================================================
--
-- Deciso da Tommaso il 24 ottobre 2026:
--   • chi offre lavoro è un'ATTIVITÀ (indirizzo e pin precisi, come prima) o
--     un PRIVATO (nessun indirizzo: un'AREA di ~300 m);
--   • del privato si salvano solo centro e raggio dell'area, mai una
--     posizione precisa; e a chi guarda si mostra il centro SPOSTATO a caso
--     fino a 100 m, sempre lo stesso per quel profilo, così anche un cerchio
--     centrato su casa non dice dov'è la casa;
--   • gli annunci dei privati usano l'area e sulla mappa sono cerchi;
--   • verifiche facoltative: partita IVA (controllata col servizio europeo
--     VIES da un'edge function) → «Attività verificata»; identità del
--     privato: per ora solo lo stato, il servizio lo si sceglie più avanti;
--   • i worker dichiarano la data di nascita: sotto i 18 anni non si entra.
--
-- ⚠️ PERCHÉ UNA TABELLA A PARTE. Le policy di `profiles` fanno leggere TUTTE
-- le colonne a qualunque utente autenticato (le RLS sono per riga, non per
-- colonna). Data di nascita, partita IVA e centro vero dell'area stanno
-- quindi in `profili_riservati`, che legge solo il proprietario. In
-- `profiles` va solo quello che è pubblico: il tipo, i badge, e per il
-- privato il centro GIÀ SPOSTATO (in `lat`/`lng`) e il raggio.
--
-- ⚠️ ORDINE DI DEPLOY: prima questa migration, poi il push del codice
-- (CLAUDE.md §13): il codice legge le colonne nuove. Rieseguibile.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. LE COLONNE PUBBLICHE
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tipo_employer          TEXT,
  ADD COLUMN IF NOT EXISTS area_raggio            INTEGER,
  ADD COLUMN IF NOT EXISTS piva_verificata        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS piva_verificata_il     TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS identita_verificata    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS identita_verificata_il TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tipo_employer_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tipo_employer_check
  CHECK (tipo_employer IS NULL OR tipo_employer IN ('attivita', 'privato'));

-- Gli employer di prima sono tutti attività: avevano indirizzo e pin.
-- Nessun altro dato cambia.
UPDATE public.profiles
   SET tipo_employer = 'attivita'
 WHERE role = 'employer' AND tipo_employer IS NULL;

-- Gli annunci di un privato: il raggio dell'area (NULL = annuncio con pin).
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS area_raggio INTEGER;


-- ---------------------------------------------------------------------
-- 2. I DATI RISERVATI — li legge e li scrive solo il proprietario
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profili_riservati (
  id                         UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  data_nascita               DATE,
  maggiorenne_confermato_il  TIMESTAMP WITH TIME ZONE,
  partita_iva                TEXT,
  piva_nome_vies             TEXT,      -- il nome registrato su VIES, per i controlli
  area_lat                   DOUBLE PRECISION,  -- il centro VERO scelto dal privato
  area_lng                   DOUBLE PRECISION,
  area_raggio                INTEGER,
  spostamento_nord_m         DOUBLE PRECISION,  -- fissi, generati una volta sola
  spostamento_est_m          DOUBLE PRECISION,
  created_at                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profili_riservati TO authenticated;
GRANT ALL ON public.profili_riservati TO service_role;

ALTER TABLE public.profili_riservati ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Il proprietario legge i suoi dati riservati" ON public.profili_riservati;
CREATE POLICY "Il proprietario legge i suoi dati riservati"
  ON public.profili_riservati FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Il proprietario crea i suoi dati riservati" ON public.profili_riservati;
CREATE POLICY "Il proprietario crea i suoi dati riservati"
  ON public.profili_riservati FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Il proprietario aggiorna i suoi dati riservati" ON public.profili_riservati;
CREATE POLICY "Il proprietario aggiorna i suoi dati riservati"
  ON public.profili_riservati FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- ---------------------------------------------------------------------
-- 3. PRIMA DI SALVARE I DATI RISERVATI
--    • sotto i 18 anni si rifiuta (il controllo vero, non solo quello
--      dell'app);
--    • raggio fra 200 e 1000 m, 300 di serie;
--    • lo SPOSTAMENTO si genera una volta, uniforme in un cerchio di 100 m,
--      e poi non cambia più: né spostando l'area, né se l'utente provasse a
--      scriverlo lui (resta quello di prima).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prepara_riservati()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  distanza DOUBLE PRECISION;
  angolo   DOUBLE PRECISION;
BEGIN
  IF NEW.data_nascita IS NOT NULL
     AND NEW.data_nascita > (current_date - INTERVAL '18 years')::date THEN
    RAISE EXCEPTION 'minorenne' USING ERRCODE = 'P0001';
  END IF;

  IF NEW.area_lat IS NOT NULL THEN
    NEW.area_raggio := LEAST(1000, GREATEST(200, COALESCE(NEW.area_raggio, 300)));
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.spostamento_nord_m IS NOT NULL THEN
    NEW.spostamento_nord_m := OLD.spostamento_nord_m;
    NEW.spostamento_est_m  := OLD.spostamento_est_m;
  ELSIF NEW.area_lat IS NOT NULL THEN
    -- sqrt(random()): uniforme sull'AREA del cerchio, non addensato al centro.
    distanza := 100 * sqrt(random());
    angolo   := 2 * pi() * random();
    NEW.spostamento_nord_m := distanza * cos(angolo);
    NEW.spostamento_est_m  := distanza * sin(angolo);
  ELSE
    NEW.spostamento_nord_m := NULL;
    NEW.spostamento_est_m  := NULL;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prepara_riservati ON public.profili_riservati;
CREATE TRIGGER prepara_riservati
  BEFORE INSERT OR UPDATE ON public.profili_riservati
  FOR EACH ROW EXECUTE FUNCTION public.prepara_riservati();


-- ---------------------------------------------------------------------
-- 4. DOPO: si pubblica l'area SPOSTATA (profilo e annunci del privato), e
--    se l'utente cambia la partita IVA il badge si spegne.
--    `politask.server` dice ai trigger di protezione qui sotto che a
--    scrivere è il database, non l'utente.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pubblica_riservati()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pub_lat DOUBLE PRECISION;
  pub_lng DOUBLE PRECISION;
BEGIN
  PERFORM set_config('politask.server', 'on', true);

  IF NEW.area_lat IS NOT NULL AND NEW.area_lng IS NOT NULL THEN
    pub_lat := NEW.area_lat + NEW.spostamento_nord_m / 111320.0;
    pub_lng := NEW.area_lng + NEW.spostamento_est_m / (111320.0 * cos(radians(NEW.area_lat)));

    UPDATE public.profiles
       SET lat = pub_lat, lng = pub_lng, area_raggio = NEW.area_raggio
     WHERE id = NEW.id AND tipo_employer = 'privato';

    UPDATE public.jobs
       SET lat = pub_lat, lng = pub_lng, area_raggio = NEW.area_raggio
     WHERE owner_id = NEW.id
       AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.id AND p.tipo_employer = 'privato');
  END IF;

  -- La partita IVA la scrive l'edge function (auth.uid() NULL). Se la cambia
  -- l'utente, quella verificata non è più questa.
  IF TG_OP = 'UPDATE' AND auth.uid() IS NOT NULL
     AND NEW.partita_iva IS DISTINCT FROM OLD.partita_iva THEN
    UPDATE public.profiles
       SET piva_verificata = false, piva_verificata_il = NULL
     WHERE id = NEW.id;
  END IF;

  PERFORM set_config('politask.server', '', true);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.pubblica_riservati() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS pubblica_riservati ON public.profili_riservati;
CREATE TRIGGER pubblica_riservati
  AFTER INSERT OR UPDATE ON public.profili_riservati
  FOR EACH ROW EXECUTE FUNCTION public.pubblica_riservati();


-- ---------------------------------------------------------------------
-- 5. PROTEZIONE DEL PROFILO — quello che l'utente NON può scriversi da solo
--    • i badge (solo il server: l'edge function, o una verifica futura);
--    • il tipo, una volta scelto (attività ↔ privato cambierebbe le regole
--      sulla posizione);
--    • per un privato, posizione e raggio: arrivano SOLO spostati, dal
--      trigger qui sopra. Così l'app non può mettere in `profiles` una
--      posizione precisa nemmeno per sbaglio.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.proteggi_profilo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR current_setting('politask.server', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.piva_verificata := false;
    NEW.piva_verificata_il := NULL;
    NEW.identita_verificata := false;
    NEW.identita_verificata_il := NULL;
    IF NEW.tipo_employer = 'privato' THEN
      NEW.lat := NULL;
      NEW.lng := NULL;
      NEW.area_raggio := NULL;
    END IF;
    RETURN NEW;
  END IF;

  NEW.piva_verificata        := OLD.piva_verificata;
  NEW.piva_verificata_il     := OLD.piva_verificata_il;
  NEW.identita_verificata    := OLD.identita_verificata;
  NEW.identita_verificata_il := OLD.identita_verificata_il;

  IF OLD.tipo_employer IS NOT NULL THEN
    NEW.tipo_employer := OLD.tipo_employer;
  END IF;

  IF NEW.tipo_employer = 'privato' THEN
    NEW.lat := OLD.lat;
    NEW.lng := OLD.lng;
    NEW.area_raggio := OLD.area_raggio;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proteggi_profilo ON public.profiles;
CREATE TRIGGER proteggi_profilo
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.proteggi_profilo();


-- ---------------------------------------------------------------------
-- 6. GLI ANNUNCI DI UN PRIVATO prendono l'area pubblica del profilo,
--    qualunque posizione mandi l'app. Quelli delle attività non hanno raggio.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.posizione_annuncio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
BEGIN
  SELECT tipo_employer, lat, lng, area_raggio INTO p
    FROM public.profiles WHERE id = NEW.owner_id;

  IF p.tipo_employer = 'privato' THEN
    NEW.lat := p.lat;
    NEW.lng := p.lng;
    NEW.area_raggio := COALESCE(p.area_raggio, 300);
  ELSE
    NEW.area_raggio := NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.posizione_annuncio() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS posizione_annuncio ON public.jobs;
CREATE TRIGGER posizione_annuncio
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.posizione_annuncio();