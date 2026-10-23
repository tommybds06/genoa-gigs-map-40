import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Loader2, Check } from "lucide-react";
import { MappaIcon, OrologioIcon, InfoIcon } from "@/components/icons/uiIcons";
import { annuncioScaduto } from "@/lib/scadenzaAnnunci";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getTagClasses } from "@/lib/tagColors";
import { LocationMiniMap } from "./LocationMiniMap";

interface JobProfile {
  full_name: string | null;
  avatar_url: string | null;
  address_text: string | null;
  photos?: string[] | null;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  category: string | null;
  schedule?: string | null;
  tags?: string[] | null;
  neighborhood?: string | null;
  lat: number;
  lng: number;
  owner_id?: string;
  status?: string;
  created_at?: string | null;
  scade_il?: string | null;
  profiles?: JobProfile | null;
}

/**
 * I bottoni che dicono uno STATO e non si premono (verifica, già candidato,
 * scaduto). Fondo incavo, che non sembra premibile; testo in inchiostro PIENO:
 * l'opacità 50% del `disabled` portava il grigio su incavo a ~2:1, e qui il
 * testo è un'informazione, non un comando spento.
 */
const STATO_SPENTO = "w-full bg-paper-sunken text-ink disabled:opacity-100";

interface JobDetailsSheetProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  showMiniMap?: boolean;
  /** Aperta dalla chat, che sta a z-[60]: la scheda deve stare sopra. */
  sopraChat?: boolean;
}

/**
 * ALTEZZA DI RIPOSO della scheda — quanto se ne vede appena tocchi un pin.
 *
 * Esattamente il blocco di testa, bottone «Candidati» e il suo spazio sotto
 * compresi — e NIENTE di quello che segue: Tommaso, 21 ottobre: «nell'anteprima
 * non si deve intravedere l'employer». Lo spazio sotto il bottone sta quindi
 * DENTRO la testa (`pb-` del blocco azione, safe area compresa), non è un
 * margine aggiunto qui. Si MISURA, non si stima: la testa cambia con il
 * titolo (una o due righe), la paga, l'orario e i tag.
 *
 * ⚠️ Era fissa a 320px, contata sul caso peggiore — e il bottone toccava il
 * bordo anche col titolo su UNA riga. Perché vaul trasla la scheda di
 * `finestra − aggancio`, ma la scheda è alta 92vh, non 100: quindi se ne vede
 * `aggancio − 8vh`, cioè 320 − 68 = 252px su un 844. Il conto va fatto
 * aggiungendo quegli 8vh, ed è `altezzaAggancio` qui sotto.
 */
const ALTEZZA_SCHEDA = 0.92;
const RISERVA_PRIMA_DELLA_MISURA = 300;

/**
 * L'AGGANCIO ALTO è 1, non 0,92. Stesso conto dell'aggancio basso: vaul
 * trasla la scheda di `finestra × (1 − aggancio)`. Con 0,92 la spostava giù
 * dell'8% della finestra, ma la scheda è già alta 92vh: il suo fondo finiva
 * 68 px SOTTO lo schermo (misurato: scheda da 776 px, fondo a 912 su 844), e
 * con lui la fine dell'area che scorre. Negli annunci corti il contenuto
 * entrava giusto nell'area, quindi non c'era niente da scorrere, ma l'ultima
 * parte era fuori schermo (Tommaso, 22 ottobre: «tagliate e non si può
 * scorrere»). Con 1 la traslazione è zero: la scheda sta tutta a schermo,
 * con la cima all'8% e il fondo sul bordo.
 */
const AGGANCIO_ALTO = 1;

/*
 * …ma solo se il contenuto la riempie. Un annuncio corto, tirato su, lasciava
 * mezza scheda di carta vuota sotto il «Dove» (Tommaso, 22 ottobre: «troppo
 * spazio bianco sotto»). Ora anche l'aggancio alto si MISURA: si ferma dove
 * finisce il contenuto (`fondoContenuto`); se il contenuto è più alto della
 * scheda resta 1, tutta aperta, e scorre. È lo stesso conto dell'aggancio
 * basso (`altezzaAggancio`), con la stessa correzione degli 8vh.
 */

function altezzaAggancio(visibile: number) {
  // Per difetto: un pixel in meno di spazio vuoto, mai un pixel di divisoria.
  return `${Math.floor(visibile + window.innerHeight * (1 - ALTEZZA_SCHEDA))}px`;
}

/**
 * SCHEDA ANNUNCIO — la gerarchia.
 *
 * L'ordine segue le domande che uno studente si fa, nell'ordine in cui se le
 * fa: *che lavoro e'* → *quanto paga* → *quando* → *chi lo offre* → *i
 * dettagli* → *dove esattamente*. Prima il profilo dell'employer stava in
 * cima con un avatar da 56px, cioe' l'elemento piu' grande della schermata era
 * la risposta alla domanda che si fa per ultima.
 *
 * ⚠️ La paga NON e' un badge pieno. Lo era, con `theme.btnFilled`: cioe' lo
 * stesso riempimento del bottone "Candidati", su una schermata che ha gia' quel
 * bottone. Sembrava premibile. Ora e' un numero grande nell'inchiostro del
 * ruolo — massimo peso visivo, zero affordance di tocco — e avendo la riga
 * tutta per se' regge anche i formati liberi tipo "150/settimana", che accanto
 * al titolo mandavano a capo tutto (era la causa delle "scritte che volano").
 *
 * ⚠️ I separatori sono `.linea-divisoria-sopra`, non `border-t`: quattro fili
 * CSS da 1px erano la cosa piu' "fatta col CSS" di una schermata in cui ogni
 * altro margine e' tagliato a mano.
 *
 * ⚠️ DUE ALTEZZE, non una. Prima era `h-[90vh]` fissa con il footer in
 * `absolute`: un annuncio da tre righe occupava comunque il 90% dello schermo,
 * con ~350px di vuoto in fondo. Ora si apre bassa (vedi `altezzaAggancio`) e si
 * trascina in su — così ha anche preso il posto della nuvoletta sulla mappa,
 * che mostrava un sottoinsieme di queste stesse cose a un tocco di distanza.
 */
export function JobDetailsSheet({ job, isOpen, onClose, showMiniMap = false, sopraChat = false }: JobDetailsSheetProps) {
  const { isEmployer } = useUser();
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [hasApplied, setHasApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  /* ⚠️ Il punto di aggancio va CONTROLLATO, non lasciato a vaul. Il suo stato
     interno vive nella Root, che qui non si smonta mai: chi aprisse la scheda,
     la trascinasse in alto e la chiudesse, la ritroverebbe gia' aperta tutta
     al giro dopo. Lo rimettiamo basso a ogni chiusura. */
  const [alta, setAlta] = useState(false);
  const eraAperta = useRef(false);
  useEffect(() => {
    if (!isOpen && eraAperta.current) setAlta(false);
    eraAperta.current = isOpen;
  }, [isOpen]);

  /* La testa vive nel portal del drawer, che esiste solo a scheda aperta:
     per questo un ref a callback e non `useMisure` (che misura al montaggio
     del componente, quando qui il nodo non c'è ancora). `offsetTop` è
     relativo a DrawerContent (fixed) e, come `offsetHeight`, ignora la
     traslazione di vaul. */
  const [fondoTesta, setFondoTesta] = useState<number | null>(null);
  const osservatoreTesta = useRef<ResizeObserver | null>(null);
  const refTesta = useCallback((el: HTMLDivElement | null) => {
    osservatoreTesta.current?.disconnect();
    osservatoreTesta.current = null;
    if (!el) return;
    const leggi = () => setFondoTesta(el.offsetTop + el.offsetHeight);
    leggi();
    osservatoreTesta.current = new ResizeObserver(leggi);
    osservatoreTesta.current.observe(el);
  }, []);
  /* Dove finisce il CONTENUTO della scheda (dalla sua cima): stesso metodo
     della testa — ref a callback, ResizeObserver (la minimappa arriva dopo e
     allunga il contenuto), `offsetTop` relativo a DrawerContent. */
  const [fondoContenuto, setFondoContenuto] = useState<number | null>(null);
  const osservatoreContenuto = useRef<ResizeObserver | null>(null);
  const refContenuto = useCallback((el: HTMLDivElement | null) => {
    osservatoreContenuto.current?.disconnect();
    osservatoreContenuto.current = null;
    if (!el) return;
    const leggi = () => setFondoContenuto(el.offsetTop + el.offsetHeight);
    leggi();
    osservatoreContenuto.current = new ResizeObserver(leggi);
    osservatoreContenuto.current.observe(el);
  }, []);

  const bassa = fondoTesta ?? RISERVA_PRIMA_DELLA_MISURA;
  const altezzaScheda = typeof window === "undefined" ? 0 : window.innerHeight * ALTEZZA_SCHEDA;
  const contenutoCorto = fondoContenuto != null && fondoContenuto < altezzaScheda && fondoContenuto > bassa;
  const agganci = [
    altezzaAggancio(bassa),
    contenutoCorto ? altezzaAggancio(fondoContenuto) : AGGANCIO_ALTO,
  ];

  // Check if worker has already applied when drawer opens
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!job || !user || isEmployer) return;

      setCheckingStatus(true);
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', job.id)
          .eq('applicant_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setHasApplied(true);
        } else {
          setHasApplied(false);
        }
      } catch (error) {
        console.error('Error checking application status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (isOpen && job) {
      checkApplicationStatus();
    }
  }, [isOpen, job, user, isEmployer]);

  if (!job) return null;

  /* Inchiostro del ruolo. ⚠️ NON `theme.primaryText`: per il worker quello e'
     `text-primary`, cioe' l'arancio pastello, che su carta fa 1,9:1 — era il
     colore delle intestazioni DESCRIZIONE e POSIZIONE, illeggibili. Le
     varianti `-ink` esistono per questo (4,66 e 5,86). */
  const inchiostroRuolo = isEmployer ? "text-employer-800" : "text-primary-strong";

  const employerName = job.profiles?.full_name || "Employer";
  const employerPhotos = job.profiles?.photos;
  const employerAvatar = employerPhotos && employerPhotos.length > 0
    ? employerPhotos[0]
    : job.profiles?.avatar_url || null;
  const employerAddress = job.profiles?.address_text || null;
  const employerInitials = employerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const tagVisibili = (job.tags || []).filter(tag => tag.toLowerCase() !== 'altro');
  const haMiniMappa = showMiniMap && !!job.lat && !!job.lng && job.lat !== 0 && job.lng !== 0;

  const handleEmployerClick = () => {
    if (job.owner_id) {
      // Stamp the job onto the CURRENT history entry so pressing back restores it
      navigate(location.pathname + location.search, {
        replace: true,
        state: { ...(location.state as object | null), returnJob: job },
      });
      navigate(`/profile/${job.owner_id}`);
      onClose();
    }
  };

  const scaduto = annuncioScaduto(job);

  const handleApply = async () => {
    if (!user || !job || hasApplied || isApplying) return;

    setIsApplying(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          applicant_id: user.id,
          // Snapshot: preserva titolo ed employer anche se l'annuncio verrà cancellato
          job_title: job.title,
          employer_name: job.profiles?.full_name ?? null,
        });

      if (error) {
        if (error.code === '23505') {
          // Duplicate - already applied
          setHasApplied(true);
          toast.info('Hai già inviato la candidatura per questo lavoro', { duration: 2000 });
        } else if (error.message?.includes('annuncio_non_attivo')) {
          // Il database rifiuta le candidature agli annunci scaduti o chiusi
          // (migration 20261023120000): capita se scade mentre lo si guarda.
          toast.error('Questo annuncio non accetta più candidature', { duration: 2500 });
        } else {
          throw error;
        }
      } else {
        setHasApplied(true);
        // Invalidate applications cache for instant UI refresh
        await queryClient.invalidateQueries({ queryKey: ['applications'] });
        toast.success('Candidatura inviata!', { duration: 2000 });
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      toast.error('Errore nell\'invio della candidatura', { duration: 2000 });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      /* ⚠️ Gli agganci li calcola vaul sull'altezza della FINESTRA, non su
         quella della scheda (alta 92vh, per lasciare in cima un po' di mappa):
         vedi `altezzaAggancio` per il basso, `AGGANCIO_ALTO` e
         `fondoContenuto` per l'alto. */
      snapPoints={agganci}
      activeSnapPoint={alta ? agganci[1] : agganci[0]}
      // ⚠️ Confronto col valore DI QUESTO giro: l'aggancio alto ora cambia
      // con la misura (px o 1), non è più una costante.
      setActiveSnapPoint={(p) => setAlta(p === agganci[1])}
    >
      <DrawerContent className={cn("h-[92vh]", sopraChat && "z-[70]")} overlayClassName={sopraChat ? "z-[70]" : undefined}>
        <div className="flex flex-col h-full min-h-0">
          {/* ---- TESTA: quello che si vede senza trascinare ----
                 Non scorre. Il titolo resta agganciato in alto anche a scheda
                 aperta tutta, che è il comportamento di Apple Maps. */}
          <div ref={refTesta} className="shrink-0 px-4 pt-1">
            {/* ⚠️ `p-0` perché DrawerHeader porta `p-4` suo e qui l'inset lo
                   mette il contenitore: sommandoli si finiva a 40px da
                   sinistra, fuori dalla griglia a 16 del resto dell'app. */}
            <DrawerHeader className="text-left p-0 gap-0">
              {/* ⚠️ Le misure sono ripetute come utility di proposito:
                  DrawerTitle porta di suo `text-lg leading-none font-semibold`,
                  e le utility di Tailwind battono `@layer components` — la sola
                  classe `.titolo-sezione` sarebbe rimasta a 18px. */}
              <DrawerTitle className="titolo-sezione text-2xl leading-[1.9375rem] font-normal tracking-[-0.05em]">
                {job.title}
              </DrawerTitle>

              {job.price && (
                /* Shinjo a 28px: e' un uso da DISPLAY, non un'etichetta di
                   campo — sopra i 18px l'irregolarita' del tratto legge come
                   carattere, non come rumore. `break-words` perche' il campo
                   della paga e' libero. */
                <p
                  className={cn(
                    "mt-1.5 font-[Shinjo,Outfit,sans-serif] [font-synthesis:none] tracking-[-0.045em] text-[28px] leading-[1.15] break-words",
                    inchiostroRuolo
                  )}
                >
                  {job.price}
                </p>
              )}

              {job.schedule && (
                <div className="mt-2.5 flex items-center gap-2">
                  <OrologioIcon className={cn("w-[18px] h-[18px] shrink-0", inchiostroRuolo)} />
                  <span className="text-[15px] text-foreground">{job.schedule}</span>
                </div>
              )}

              {tagVisibili.length > 0 && (
                /* ⚠️ `sagoma-chip`: erano gli unici `rounded-full` dell'app
                   senza il margine tagliato. L'altezza deve restare sopra i
                   30px (py-2 + text-sm = 33,5) o la maschera si schiaccia. */
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {tagVisibili.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "px-4 py-2 sagoma-chip rounded-full text-sm font-medium",
                        getTagClasses(tag)
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </DrawerHeader>

            {/* ---- AZIONE — dentro la testa, non in fondo ----
                Con i punti di aggancio il fondo della scheda sta sotto la
                piega: un footer là sotto sarebbe invisibile finché non
                trascini. L'azione principale non si merita un trascinamento,
                quindi sale qui — che è poi dove la mettono Apple Maps e Google
                Maps nella loro scheda bassa.
                `size="lg"` invece di `h-14 rounded-xl shadow-material-md`
                scritto a mano: è la size che accende la sagoma disegnata (vedi
                compoundVariants in ui/button.tsx). */}
            <div className="pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              {isEmployer ? (
                <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground">
                  <InfoIcon className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-[13px]">
                    {scaduto ? "Questo annuncio è scaduto: non è più sulla mappa" : "Stai vedendo l'anteprima del tuo annuncio"}
                  </span>
                </div>
              ) : checkingStatus ? (
                <Button size="lg" className={STATO_SPENTO} disabled>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifica...
                </Button>
              ) : hasApplied ? (
                <Button size="lg" className={STATO_SPENTO} disabled>
                  <Check className="w-5 h-5" />
                  Candidatura inviata
                </Button>
              ) : scaduto ? (
                /* Scaduto (lib/scadenzaAnnunci.ts): si arriva qui solo da un
                   link diretto, una chat o un profilo — dalla mappa è sparito.
                   Il bottone dice perché non si può, invece di sparire. */
                <Button size="lg" className={STATO_SPENTO} disabled>
                  <OrologioIcon className="w-5 h-5" />
                  Annuncio scaduto
                </Button>
              ) : (
                /* ⚠️ `theme.btnFilled` nel className: `variant="default"` è
                   arancione anche per l'employer, perché `--primary` non è
                   ribaltato sotto `[data-ruolo]`. Così il fondo segue il ruolo
                   e la sagoma resta. */
                <Button
                  size="lg"
                  className={cn("w-full text-base", theme.btnFilled, theme.btnFilledHover)}
                  onClick={handleApply}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Invio...
                    </>
                  ) : (
                    'Candidati'
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* ---- IL RESTO: scorre ---- */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4">
            {/* Un contenitore solo, per misurare dove finisce il contenuto
                (vedi `fondoContenuto`). Il fondo ha l'aria e la safe area,
                così l'ultima riga non tocca il bordo. */}
            <div ref={refContenuto} className="pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {/* 2. CHI LO OFFRE — una riga, non un blocco.
                   Nessuna superficie sotto: le divisorie sopra e sotto la
                   delimitano gia', e una campitura in piu' su una schermata di
                   sole campiture tagliate sarebbe rumore. L'indirizzo non e'
                   qui: sta sotto la mappa, dove serve. */}
            <button
              onClick={handleEmployerClick}
              className="linea-divisoria-sopra w-full flex items-center gap-3 py-3 text-left transition-colors active:bg-accent/40"
            >
              <Avatar seme={job.owner_id || employerName} className="w-11 h-11 shrink-0">
                <AvatarImage src={employerAvatar || undefined} alt={employerName} />
                <AvatarFallback className={cn(theme.accentBg, theme.accentText, "text-base")}>
                  {employerInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {/* In Shinjo: e' un nome proprio in posizione di intestazione,
                    ed era l'unico titolo della scheda rimasto in Outfit. */}
                <p className="titolo-mini truncate">{employerName}</p>
                <p className="text-[13px] text-muted-foreground">Vedi profilo</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </button>

            {/* 3. I DETTAGLI */}
            {job.description && (
              <div className="linea-divisoria-sopra pt-4 pb-1">
                <h3 className="titolo-mini mb-1.5">Descrizione</h3>
                <p className="text-[15px] leading-[1.6] text-foreground whitespace-pre-line">
                  {job.description}
                </p>
              </div>
            )}

            {/* 4. DOVE — mappa senza didascalia centrata: l'indirizzo lo
                   stampiamo qui sotto, allineato a sinistra come tutto il
                   resto. Passare `neighborhood`/`address` alla minimappa
                   accendeva il suo blocco di testo CENTRATO. */}
            <div className="linea-divisoria-sopra mt-4 pt-4 pb-5">
              <h3 className="titolo-mini mb-2.5">Dove</h3>
              {haMiniMappa ? (
                <>
                  <LocationMiniMap lat={job.lat} lng={job.lng} tags={job.tags} />
                  <div className="mt-2.5 flex items-start gap-2">
                    <MappaIcon className={cn("w-4 h-4 mt-[3px] shrink-0", inchiostroRuolo)} />
                    <p className="text-[15px] text-foreground">
                      {job.neighborhood || "Zona non specificata"}
                      {employerAddress && (
                        <span className="text-muted-foreground"> · {employerAddress}</span>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                /* Ripiego senza coordinate. ⚠️ Il quadrato con l'icona era
                   `theme.primary` + `text-primary-foreground`: per l'employer
                   fa inchiostro su blu scuro — il bug ricorrente numero uno.
                   Qui il fondo e' tenue e l'icona sta nell'inchiostro. */
                <div className={cn("flex items-center gap-3 px-4 py-3.5 sagoma-quartiere rounded-[19px]", theme.accentBg)}>
                  <MappaIcon className={cn("w-6 h-6 shrink-0", inchiostroRuolo)} />
                  <div className="min-w-0">
                    <p className="titolo-mini">{job.neighborhood || "Zona non specificata"}</p>
                    {employerAddress && (
                      <p className="text-[13px] text-muted-foreground truncate">{employerAddress}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
