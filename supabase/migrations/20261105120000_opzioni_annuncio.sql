-- =====================================================================
-- LE OPZIONI A PAGAMENTO DEGLI ANNUNCI — fase di prova (5 novembre 2026)
--
-- Tra il form e la pubblicazione c'è ora una pagina con tre opzioni
-- (potenziamento, allungamento, pacchetto), ognuna col suo prezzo calcolato
-- dal valore dell'annuncio (lib/prezzi.ts, numeri in config/prezzi.ts).
-- Durante la PROVA nessuno paga: l'opzione scelta si applica gratis, e si
-- salvano la scelta e i tre prezzi mostrati, per capire dopo il test cosa
-- avrebbero comprato.
--
-- Rieseguibile: IF NOT EXISTS, CREATE OR REPLACE, DROP … IF EXISTS.
-- ⚠️ Va applicata PRIMA del push del codice: il form scrive queste colonne.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. I DATI DEL CALCOLO, sull'annuncio
--
--    La paga adesso è strutturata (prima solo il testo libero `price`, che
--    resta: lo scrive l'app da questi campi, ed è quello che mostrano card e
--    scheda). Le ore servono a stimare il valore del lavoro: quali si
--    compilano dipende dalla durata (tag), vedi ORE_PER_DURATA in prezzi.ts.
--    Tutto facoltativo per il database: gli annunci di prima non li hanno.
-- ---------------------------------------------------------------------
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS paga_tipo text CHECK (paga_tipo IN ('oraria', 'forfait')),
  ADD COLUMN IF NOT EXISTS paga_importo numeric(10, 2) CHECK (paga_importo >= 0),
  ADD COLUMN IF NOT EXISTS paga_lorda boolean,
  ADD COLUMN IF NOT EXISTS ore_totali numeric(6, 1) CHECK (ore_totali > 0),
  ADD COLUMN IF NOT EXISTS ore_giorno numeric(4, 1) CHECK (ore_giorno > 0),
  ADD COLUMN IF NOT EXISTS giorni integer CHECK (giorni > 0),
  ADD COLUMN IF NOT EXISTS ore_settimana numeric(5, 1) CHECK (ore_settimana > 0),
  ADD COLUMN IF NOT EXISTS settimane integer CHECK (settimane > 0);


-- ---------------------------------------------------------------------
-- 2. L'OPZIONE SCELTA E I PREZZI MOSTRATI
--
--    I prezzi sono quelli VISTI sulla pagina al momento della pubblicazione,
--    non ricalcolati: se cambiano i numeri della configurazione, i dati del
--    test restano confrontabili con quello che la persona aveva davanti.
-- ---------------------------------------------------------------------
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS opzione text NOT NULL DEFAULT 'nessuna'
    CHECK (opzione IN ('nessuna', 'potenziamento', 'allungamento', 'pacchetto')),
  ADD COLUMN IF NOT EXISTS prezzo_potenziamento numeric(6, 2),
  ADD COLUMN IF NOT EXISTS prezzo_allungamento numeric(6, 2),
  ADD COLUMN IF NOT EXISTS prezzo_pacchetto numeric(6, 2);


-- ---------------------------------------------------------------------
-- 3. LA FASE DI PROVA, decisa qui
--
--    true = le opzioni si applicano senza pagare. Quando arrivano i
--    pagamenti diventa false (CREATE OR REPLACE … SELECT false), e
--    l'allungamento lo concederà solo chi registra il pagamento.
--    ⚠️ Lato app lo stesso interruttore è `pagamentiAttivi` in
--    config/prezzi.ts: vanno cambiati insieme.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prova_gratuita()
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$ SELECT true $$;


-- ---------------------------------------------------------------------
-- 4. LA SCADENZA (sostituisce la funzione del 23 ottobre)
--
--    Come prima, la decide il DATABASE e non il client: alla creazione da
--    utente 48 ore, qualunque `scade_il` mandi l'app. In più: in prova, con
--    allungamento o pacchetto, 7 giorni.
--    In modifica da utente non cambiano né la scadenza né l'opzione né i
--    prezzi: senza, si potrebbe scegliere l'allungamento DOPO, o riscrivere
--    i prezzi del test. Il server (auth.uid() NULL) resta libero.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.proteggi_scadenza_annuncio()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      IF NEW.opzione IN ('allungamento', 'pacchetto') AND public.prova_gratuita() THEN
        NEW.scade_il := now() + INTERVAL '7 days';
      ELSE
        NEW.scade_il := now() + INTERVAL '48 hours';
      END IF;
    END IF;
    NEW.scadenza_vista := false;
  ELSIF auth.uid() IS NOT NULL THEN
    NEW.scade_il := OLD.scade_il;
    NEW.opzione := OLD.opzione;
    NEW.prezzo_potenziamento := OLD.prezzo_potenziamento;
    NEW.prezzo_allungamento := OLD.prezzo_allungamento;
    NEW.prezzo_pacchetto := OLD.prezzo_pacchetto;
  END IF;
  RETURN NEW;
END;
$$;

-- Il trigger c'è già (20261023120000_scadenza_annunci.sql): si ricrea uguale
-- per sicurezza.
DROP TRIGGER IF EXISTS proteggi_scadenza_annuncio ON public.jobs;
CREATE TRIGGER proteggi_scadenza_annuncio
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.proteggi_scadenza_annuncio();
