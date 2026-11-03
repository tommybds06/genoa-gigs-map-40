import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { UNSAFE_LocationContext, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { CHIAVE_CANDIDATI, CHIAVE_CARTELLINI } from "@/hooks/useCartellini";
import { CHIAVE_LAVORI_WORKER } from "@/hooks/useLavoriWorker";
import { CHIAVE_RECENSIONI } from "@/hooks/useRecensioni";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/contexts/UserContext";
import { SchedaContext } from "@/hooks/useScheda";
import { cn } from "@/lib/utils";
import { TAB_ROUTES } from "@/lib/schede";
import Index from "@/pages/Index";
import Lista from "@/pages/Lista";
import Annunci from "@/pages/Annunci";
import Messaggi from "@/pages/Messaggi";
import Profilo from "@/pages/Profilo";


const ORDINE_WORKER = ["/", "/lista", "/messaggi", "/profilo"];
const ORDINE_EMPLOYER = ["/", "/annunci", "/messaggi", "/profilo"];

const PAGINE: Record<string, ComponentType> = {
  "/": Index,
  "/lista": Lista,
  "/annunci": Annunci,
  "/messaggi": Messaggi,
  "/profilo": Profilo,
};

/** I dati di ogni scheda, da rileggere (se scaduti) quando ci si arriva.
 *  Annunci non c'è: rilegge da sé a ogni ritorno (`useAllaRiattivazione`). */
const DATI_DELLA_SCHEDA: Record<string, QueryKey[]> = {
  "/": [["jobs", "map"]],
  "/lista": [["jobs", "open"], ["jobs", "employer"], ["applications", "user"]],
  "/messaggi": [["chats"], [CHIAVE_CARTELLINI], [CHIAVE_CANDIDATI], CHIAVE_LAVORI_WORKER],
  "/profilo": [[CHIAVE_RECENSIONI], [CHIAVE_CARTELLINI, "cuori"], ["worker-job-history"]],
};

/** Dove un trascinamento orizzontale NON cambia scheda: la mappa (si sposta
 *  lei) e chi ha un gesto suo (il carosello delle foto, la chat aperta). */
const SENZA_SWIPE = "[data-senza-swipe-tab], .mapboxgl-canvas-container";

/** Curva del rilascio: parte veloce come il dito e rallenta. */
const CURVA = "cubic-bezier(0.2, 0.9, 0.3, 1)";
/** Pendenza iniziale di CURVA (y1 / x1): serve a farla partire alla velocità
 *  del dito. */
const PENDENZA = 0.9 / 0.2;

type ValoreLocation = React.ContextType<typeof UNSAFE_LocationContext>;

interface Gesto {
  x0: number;
  y0: number;
  fase: "indeciso" | "orizzontale" | "no";
  /** dx al momento in cui si è capito che era orizzontale: da lì si parte,
   *  così la pagina non salta dei 10 px della soglia. */
  aggancio: number;
  da: string;
  vicina: string | null;
  spostamento: number;
  campioni: [number, number][];
}

/**
 * LE SCHEDE MONTATE UNA VOLTA SOLA (3 novembre).
 *
 * ⚠️ Prima ogni cambio di scheda smontava la pagina e montava la nuova
 * (PageTransition sotto AnimatePresence): mappa, liste, query, tutto da capo
 * a ogni tocco. E lo swipe partiva solo a dito staccato, con un'animazione
 * framer sul thread principale proprio mentre React montava la pagina nuova:
 * misurato a 4× più lento, fino a 450 ms fermi.
 *
 * Ora:
 * - ogni pagina si monta la prima volta che serve e poi RESTA, con il suo
 *   scorrimento, la mappa dov'era e le query in cache. Le vicine di quella in
 *   vista si preparano in anticipo, a app ferma;
 * - una pagina non attiva vede l'indirizzo CONGELATO di quando lo era, quindi
 *   non si ridisegna a ogni navigazione, e le sue schede dal basso e finestre
 *   si chiudono (hooks/useScheda.ts);
 * - LO SWIPE SEGUE IL DITO: le due pagine si spostano con `transform` a ogni
 *   movimento (il thread principale durante lo swipe ora è libero: niente da
 *   montare), e al rilascio vanno avanti o tornano con un'animazione WAAPI,
 *   che gira sul compositor anche se React sta lavorando.
 *
 * ⚠️ Provato prima con lo scorrimento nativo e l'aggancio (`scroll-snap`):
 * a fine gesto Chrome aggancia SEMPRE nella direzione del dito, per quanto
 * corto — 25 px lenti portavano alla scheda dopo — e la correzione dopo il
 * rilascio veniva sovrascritta dal suo aggancio, due volte. Qui la decisione
 * è nostra, come nelle app native: avanti oltre un terzo della larghezza, o
 * con un colpo veloce nello stesso verso.
 *
 * ⚠️ A riposo nessuna pagina ha una trasformazione: dentro un antenato
 * trasformato un `fixed` (la chat aperta in Messaggi) si misurerebbe su di
 * lui invece che sullo schermo.
 *
 * Il tocco sulla barra in basso cambia scheda SENZA animazione, come prima
 * (§12: la scheda è un posto, non un percorso).
 */
export function Schede() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isEmployer } = useUser();
  const ordine = isEmployer ? ORDINE_EMPLOYER : ORDINE_WORKER;

  const percorso = location.pathname;
  const suScheda = TAB_ROUTES.includes(percorso);

  // L'ultima scheda vista: resta sotto le pagine di dettaglio, e lì si torna.
  const ultima = useRef<string | null>(null);
  if (suScheda) ultima.current = percorso;
  if (!user && !suScheda) ultima.current = null;
  const mostrata = suScheda ? percorso : ultima.current;

  // Le pagine montate: quelle viste, più le vicine preparate in anticipo.
  // Senza utente si azzera tutto (all'uscita le pagine non devono restare).
  const viste = useRef(new Set<string>());
  if (!user) viste.current.clear();
  if (mostrata) viste.current.add(mostrata);
  const [preparate, setPreparate] = useState<string[]>([]);
  useEffect(() => {
    if (!user) setPreparate([]);
  }, [user]);
  const montata = (p: string) => p === mostrata || (!!user && (viste.current.has(p) || preparate.includes(p)));

  const prepara = useCallback((p: string | null | undefined) => {
    if (p) setPreparate((prima) => (prima.includes(p) ? prima : [...prima, p]));
  }, []);

  const contenitore = useRef<HTMLDivElement>(null);
  const posti = useRef(new Map<string, HTMLDivElement>());
  const rifPosto = useMemo(() => {
    const cache = new Map<string, (el: HTMLDivElement | null) => void>();
    return (p: string) => {
      let f = cache.get(p);
      if (!f) {
        f = (el) => (el ? posti.current.set(p, el) : posti.current.delete(p));
        cache.set(p, f);
      }
      return f;
    };
  }, []);

  // Per i gestori dei tocchi, iscritti una volta sola.
  const ora = useRef({ ordine, mostrata, suScheda, navigate, prepara });
  ora.current = { ordine, mostrata, suScheda, navigate, prepara };

  useEffect(() => {
    const el = contenitore.current;
    if (!el) return;
    let g: Gesto | null = null;
    let finisci: (() => void) | null = null;

    const sposta = (p: string, x: number) => {
      const n = posti.current.get(p);
      if (!n) return;
      n.style.visibility = "visible";
      n.style.transform = `translate3d(${x}px,0,0)`;
    };
    const riposo = (p: string | null) => {
      const n = p && posti.current.get(p);
      if (!n) return;
      n.style.visibility = "";
      n.style.transform = "";
    };

    const giu = (e: TouchEvent) => {
      finisci?.();
      g = null;
      const { suScheda, mostrata } = ora.current;
      if (!suScheda || !mostrata || e.touches.length !== 1) return;
      if (e.target instanceof Element && e.target.closest(SENZA_SWIPE)) return;
      const t = e.touches[0];
      g = { x0: t.clientX, y0: t.clientY, fase: "indeciso", aggancio: 0, da: mostrata, vicina: null, spostamento: 0, campioni: [] };
    };

    const muove = (e: TouchEvent) => {
      if (!g || g.fase === "no") return;
      if (e.touches.length !== 1) return rilascia();
      const t = e.touches[0];
      const dx = t.clientX - g.x0;
      const dy = t.clientY - g.y0;
      if (g.fase === "indeciso") {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if (Math.abs(dx) <= Math.abs(dy) * 1.2) {
          g.fase = "no"; // è uno scorrimento verticale: lo fa il browser
          return;
        }
        g.fase = "orizzontale";
        g.aggancio = dx;
      }
      const { ordine, prepara } = ora.current;
      const larghezza = el.clientWidth;
      let x = dx - g.aggancio;
      const verso = x < 0 ? 1 : -1;
      const vicina = ordine[ordine.indexOf(g.da) + verso] ?? null;
      // Al bordo (prima o ultima scheda) la pagina resiste, come un elastico.
      if (!vicina) x *= 0.3;
      if (vicina !== g.vicina) {
        riposo(g.vicina);
        g.vicina = vicina;
        prepara(vicina);
      }
      g.spostamento = x;
      g.campioni = [...g.campioni.slice(-5), [performance.now(), x]];
      sposta(g.da, x);
      if (vicina) sposta(vicina, x + verso * larghezza);
    };

    const rilascia = () => {
      const gesto = g;
      g = null;
      if (!gesto || gesto.fase !== "orizzontale") return;
      const larghezza = el.clientWidth;
      const x = gesto.spostamento;
      const verso = x < 0 ? 1 : -1;
      // Velocità degli ultimi ~100 ms, in px/ms.
      const adesso = performance.now();
      const recenti = gesto.campioni.filter(([t]) => adesso - t < 100);
      const [t0, x0] = recenti[0] ?? [adesso, x];
      const velocita = adesso - t0 > 8 ? (x - x0) / (adesso - t0) : 0;
      const avanti =
        !!gesto.vicina &&
        (Math.abs(x) > larghezza / 3 || (Math.sign(velocita) === Math.sign(x) && Math.abs(velocita) > 0.35));
      const arrivo = avanti ? -verso * larghezza : 0;
      const resto = Math.abs(arrivo - x);
      const ridotto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const durata = ridotto
        ? 0
        : Math.min(320, Math.max(200, Math.abs(velocita) > 0.3 ? (PENDENZA * resto) / Math.abs(velocita) : 280));

      const anima = (p: string, da: number, a: number) =>
        posti.current.get(p)?.animate(
          [{ transform: `translate3d(${da}px,0,0)` }, { transform: `translate3d(${a}px,0,0)` }],
          { duration: durata, easing: CURVA, fill: "forwards" }
        );
      const animazioni = [anima(gesto.da, x, arrivo)];
      if (gesto.vicina) animazioni.push(anima(gesto.vicina, x + verso * larghezza, arrivo + verso * larghezza));

      // A fine corsa (o al tocco successivo) tutto torna a riposo: la pagina
      // lasciata si nasconde, quella arrivata resta a zero senza trasformazione.
      const chiudi = () => {
        finisci = null;
        animazioni.forEach((a) => a?.cancel());
        riposo(gesto.da);
        riposo(gesto.vicina);
      };
      finisci = chiudi;
      animazioni[0]?.finished.then(() => finisci === chiudi && chiudi(), () => {});
      // L'indirizzo cambia SUBITO, al rilascio: la barra in basso risponde
      // senza aspettare, e il lavoro di React non tocca l'animazione.
      if (avanti && gesto.vicina) ora.current.navigate(gesto.vicina);
    };

    el.addEventListener("touchstart", giu, { passive: true });
    el.addEventListener("touchmove", muove, { passive: true });
    el.addEventListener("touchend", rilascia, { passive: true });
    el.addEventListener("touchcancel", rilascia, { passive: true });
    return () => {
      finisci?.();
      el.removeEventListener("touchstart", giu);
      el.removeEventListener("touchmove", muove);
      el.removeEventListener("touchend", rilascia);
      el.removeEventListener("touchcancel", rilascia);
    };
  }, []);

  /* Le vicine, a app ferma: dopo che la scheda in vista si è disegnata e il
     resto si è calmato. */
  const indiceMostrata = mostrata ? ordine.indexOf(mostrata) : -1;
  useEffect(() => {
    if (!user || indiceMostrata < 0) return;
    const vicine = [ordine[indiceMostrata - 1], ordine[indiceMostrata + 1]];
    const fai = () => vicine.forEach(prepara);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(fai, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(fai, 1200);
    return () => window.clearTimeout(t);
  }, [user, indiceMostrata, ordine, prepara]);

  /* Prima, rimontando, la pagina che arrivava rileggeva i suoi dati scaduti.
     Ora resta montata: a ogni arrivo su una scheda si rileggono quelli
     scaduti (staleTime) di QUELLA scheda (`DATI_DELLA_SCHEDA`).
     ⚠️ Non «tutte le query in uso»: sono quelle di tutte le pagine montate,
     e a ogni cambio partivano una decina di letture e all'arrivo React
     ridisegnava anche le pagine nascoste, proprio mentre si scorreva quella
     nuova. */
  const primo = useRef(true);
  useEffect(() => {
    if (primo.current) {
      primo.current = false;
      return;
    }
    if (!suScheda) return;
    for (const queryKey of DATI_DELLA_SCHEDA[percorso] ?? []) {
      queryClient.refetchQueries({ queryKey, type: "active", stale: true });
    }
  }, [percorso, suScheda, queryClient]);

  return (
    <div ref={contenitore} className="absolute inset-0 overflow-hidden">
      {ordine.map((p) => (
        <div key={p} ref={rifPosto(p)} className={cn("absolute inset-0", p !== mostrata && "invisible scheda-nascosta")}>
          {montata(p) && <Pannello percorso={p} attiva={p === percorso} visibile={p === mostrata} />}
        </div>
      ))}
    </div>
  );
}

/**
 * Una scheda. ⚠️ Il contenuto è un elemento MEMORIZZATO: così, quando la
 * scheda non è attiva e il suo indirizzo è congelato, React non ridisegna la
 * pagina a ogni navigazione (si fermerebbe solo ai consumatori di un contesto
 * cambiato, e il suo non cambia).
 */
const Pannello = memo(function Pannello({
  percorso,
  attiva,
  visibile,
}: {
  percorso: string;
  attiva: boolean;
  visibile: boolean;
}) {
  const vero = useContext(UNSAFE_LocationContext);
  // Mai stata attiva (preparata in anticipo): vede il SUO indirizzo, vuoto.
  const congelato = useRef<ValoreLocation>({
    location: { pathname: percorso, search: "", hash: "", state: null, key: "preparata" },
    navigationType: vero.navigationType,
  } as ValoreLocation);
  if (attiva) congelato.current = vero;

  const Pagina = PAGINE[percorso];
  const contenuto = useMemo(
    () => (
      <ProtectedRoute>
        <Pagina />
      </ProtectedRoute>
    ),
    [Pagina]
  );
  const stato = useMemo(() => ({ attiva, visibile }), [attiva, visibile]);

  return (
    <div
      className="absolute inset-0 flex flex-col bg-background pb-16"
      aria-hidden={visibile ? undefined : true}
      // Fuori vista non si raggiunge col tab della tastiera né coi lettori.
      {...(visibile ? {} : { inert: "" })}
    >
      <UNSAFE_LocationContext.Provider value={congelato.current}>
        <SchedaContext.Provider value={stato}>{contenuto}</SchedaContext.Provider>
      </UNSAFE_LocationContext.Provider>
    </div>
  );
});
