import { memo, useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { OrologioIcon } from "@/components/icons/uiIcons";
import { useLocation, useNavigate } from "react-router-dom";
import Map, { Layer, Marker, MapRef, Source } from "react-map-gl";
import { cerchioGeo, coloreToken } from "@/lib/area";
import { JobDetailsSheet } from "./JobDetailsSheet";
import { PinMappa } from "./PinMappa";
import { EmployerGroupMarker } from "./EmployerGroupMarker";
import { ZonaMarker } from "./ZonaMarker";
import { ZonaAnnunciDrawer } from "./ZonaAnnunciDrawer";
import { IngressoPin, type Ingresso } from "./IngressoPin";
import { PinUscente } from "./PinUscente";
import { creaIndiceZone, elementiMappa, separaSovrapposti, DURATA_PIN, type ElementoMappa } from "@/lib/zoneMappa";
import { EmployerJobsDrawer } from "./EmployerJobsDrawer";
import { UserLocationMarker } from "./UserLocationMarker";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useUser } from "@/contexts/UserContext";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { groupJobsByEmployer, EmployerGroup } from "@/lib/groupJobsByEmployer";
import { Job } from "@/hooks/useJobs";
import { cn } from "@/lib/utils";
import "mapbox-gl/dist/mapbox-gl.css";

interface InteractiveMapProps {
  jobs?: Job[];
  allJobs?: Job[];
  isSearchActive?: boolean;
  filteredJobIds?: Set<string>;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  userLocation?: { lat: number; lng: number } | null;
}

// Memoized single job marker component
const SingleJobMarker = memo(function SingleJobMarker({ 
  job, 
  isHighlighted, 
  isDimmed, 
  isEmployer,
  isSearchActive,
  ingresso,
  onMarkerClick 
}: { 
  job: Job; 
  isHighlighted: boolean;
  isDimmed: boolean;
  isEmployer: boolean;
  isSearchActive: boolean;
  ingresso?: Ingresso;
  onMarkerClick: (job: Job) => void;
}) {
  const Icon = getJobIconFromTags(job.tags);
  
  return (
    <Marker
      key={job.id}
      longitude={job.lng!}
      latitude={job.lat!}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onMarkerClick(job);
      }}
    >
      <IngressoPin da={ingresso}>
      <button 
        className={cn(
          "group flex flex-col items-center cursor-pointer transition-all duration-300 ease-out touch-feedback",
          isHighlighted && "scale-125 z-10",
          isDimmed && "opacity-30 scale-90",
          !isSearchActive && "hover:scale-110"
        )}
      >
        {/* La forma è il disegno di Tommaso (lib/formaPin.ts); i colori sono
            quelli del cerchio + triangolo di prima, stato per stato.
            ⚠️ `text-primary-foreground` e' l'INK: giusto sull'arancio (6,45),
            nero su nero sul blu scuro. Stesso inciampo dell'icona mail in
            Impostazioni: il fondo seguiva il ruolo, il testo no.
            ⚠️ Lo stato EVIDENZIATO aveva lo stesso difetto al contrario: un
            tratto da 3px e un'icona in `primary` — l'arancio pastello — su
            `bg-card`, cioe' 1,9:1, e per giunta arancione anche in un'app
            blu. Sui fondi chiari vanno gli inchiostri. */}
        <PinMappa
          icona={Icon}
          classeFondo={isHighlighted ? "fill-card" : isEmployer ? "fill-employer-700" : "fill-primary"}
          classeContorno={isHighlighted ? (isEmployer ? "stroke-employer-800" : "stroke-primary-strong") : undefined}
          classeIcona={
            isHighlighted
              ? (isEmployer ? "text-employer-800" : "text-primary-strong")
              : isEmployer
                ? "text-employer-foreground"
                : "text-primary-foreground"
          }
        />
      </button>
      </IngressoPin>
    </Marker>
  );
});

/**
 * LA VISTA RICORDATA — dove stava guardando l'utente l'ultima volta.
 *
 * ⚠️ Ogni cambio di pagina smonta e rimonta la mappa (§12, Prestazioni). Prima,
 * tornando dalla scheda di un annuncio o dal profilo di chi l'ha pubblicato,
 * la mappa ripartiva dal centro di default e poi saltava sulla posizione GPS,
 * come alla prima apertura: chi stava esplorando un'altra zona si ritrovava
 * a casa sua (Tommaso, 23 ottobre: «scomodo»). Ora a ogni fine movimento si
 * salva centro e zoom, e al ritorno si riparte da lì — come Google Maps e
 * Apple Maps. Solo la PRIMA apertura della sessione si centra sul GPS.
 *
 * Variabile del modulo, non `window` né `localStorage`: vive finché l'app è
 * aperta, si azzera ricaricando, e non tocca niente fuori dalla mappa. Il
 * ruolo è dentro perché un employer e un worker partono da punti diversi.
 */
let vistaRicordata: { longitude: number; latitude: number; zoom: number; employer: boolean } | null = null;

function InteractiveMapInner({ 
  jobs: externalJobs = [], 
  allJobs: externalAllJobs = [],
  isSearchActive = false,
  filteredJobIds = new Set(),
  initialCenter = { lat: 44.4056, lng: 8.9463 },
  initialZoom = 13,
  userLocation = null
}: InteractiveMapProps) {
  const jobs = externalJobs;
  const allJobs = externalAllJobs.length > 0 ? externalAllJobs : externalJobs;
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  /* Il token arriva dalla cache condivisa: vedi hooks/useMapboxToken.ts. */
  const mapboxToken = useMapboxToken();
  const [lastSelectedJob, setLastSelectedJob] = useState<Job | null>(null);
  
  // Employer group drawer state
  const [selectedEmployerJobs, setSelectedEmployerJobs] = useState<Job[]>([]);
  const [isEmployerDrawerOpen, setIsEmployerDrawerOpen] = useState(false);

  // Lista di una ZONA (annunci vicini uniti in un pin, vedi lib/zoneMappa.ts)
  const [annunciZona, setAnnunciZona] = useState<Job[]>([]);
  const [isZonaOpen, setIsZonaOpen] = useState(false);

  
  const { isEmployer } = useUser();
  const location = useLocation();
  const mapNavigate = useNavigate();

  // Reopen sheet when returning from employer profile
  const didRestoreJob = useRef(false);
  const mappaRef = useRef<MapRef>(null);
  /* Vista da cui partire: quella ricordata se c'è (e dello stesso ruolo),
     altrimenti il centro calcolato da Index. Letta UNA volta, al montaggio:
     `initialViewState` vale solo lì (e anche quando react-map-gl riusa la
     mappa, `reuseMaps`: la riapplica, verificato nel suo sorgente). */
  const [vistaIniziale] = useState(() =>
    vistaRicordata && vistaRicordata.employer === isEmployer
      ? { longitude: vistaRicordata.longitude, latitude: vistaRicordata.latitude, zoom: vistaRicordata.zoom }
      : { longitude: initialCenter.lng, latitude: initialCenter.lat, zoom: initialZoom }
  );
  // Con una vista ricordata il GPS non deve più spostare la mappa: l'utente
  // ha già scelto dove guardare.
  const giaCentrata = useRef(vistaRicordata != null && vistaRicordata.employer === isEmployer);

  /* Lo zoom INTERO: le zone cambiano solo quando cambia lui, quindi non serve
     ricalcolarle a ogni fotogramma del pizzico. ⚠️ Nasce dalla vista da cui si
     parte (`vistaIniziale`), non da `initialZoom`: tornando con una vista
     ricordata a zoom 14, partire da 13 raggruppava i pin come a zoom 13 finché
     non si toccava la mappa — stessa posizione, zone sbagliate. */
  const [zoomIntero, setZoomIntero] = useState(() => Math.floor(vistaIniziale.zoom));

  /**
   * ⚠️ `initialViewState` vale SOLO al primo montaggio. La posizione del
   * telefono arriva dopo — il browser deve chiedere il permesso e leggere il
   * GPS, cioe' da mezzo secondo a diversi secondi — e a quel punto la mappa e'
   * gia' disegnata su Genova. Per questo spesso non eri centrato dov'eri:
   * il dato arrivava, ma nessuno spostava piu' la mappa.
   *
   * `giaCentrata` fa avvenire lo spostamento UNA VOLTA sola: se l'utente ha
   * gia' trascinato la mappa per guardare un'altra zona, un secondo
   * aggiornamento del GPS non deve riportarlo indietro sotto le dita.
   */
  const centraSuUtente = useCallback(() => {
    if (!userLocation || giaCentrata.current) return;
    const map = mappaRef.current;
    if (!map) return;
    giaCentrata.current = true;
    map.easeTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      duration: 900,
    });
  }, [userLocation]);
  /* ⚠️ Due occasioni, non una: quando arriva il GPS E quando la mappa ha
     finito di caricarsi (`onLoad`, sotto). Prima c'era solo la prima: se il GPS
     rispondeva PRIMA che la mappa esistesse (alla prima apertura, mentre
     arriva ancora il token), lo spostamento non trovava la mappa, usciva, e
     nessuno lo ritentava più — la mappa restava sul centro di default. Visto
     provando il ritorno dalla scheda (23 ottobre). */
  useEffect(() => {
    centraSuUtente();
  }, [centraSuUtente]);
  useEffect(() => {
    if (didRestoreJob.current) return;
    const returnJob = location.state?.returnJob as Job | undefined;
    if (returnJob) {
      didRestoreJob.current = true;
      setLastSelectedJob(returnJob);
      setIsDetailsOpen(true);
      mapNavigate(location.pathname, { replace: true, state: null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  /* Gli annunci dei PRIVATI sono pin come gli altri (Tommaso, 24 ottobre:
     i cerchi sempre visibili «occupano troppo spazio e rendono la mappa
     confusionaria»). Il pin sta sul centro GIÀ SPOSTATO dal database. Il
     cerchio compare solo quando se ne apre la scheda (`areaAperta`, più giù). */
  const employerGroups = useMemo(
    () => groupJobsByEmployer(isSearchActive ? allJobs : jobs),
    [jobs, allJobs, isSearchActive]
  );
  const coloriAree = useMemo(
    () => ({
      fondo: coloreToken(isEmployer ? "--employer-700" : "--primary", 0.2),
      bordo: coloreToken(isEmployer ? "--employer-800" : "--primary-strong"),
    }),
    [isEmployer]
  );

  // For search filtering, we need to know which groups have filtered jobs
  const filteredIdsString = useMemo(() => Array.from(filteredJobIds).sort().join(','), [filteredJobIds]);

  /**
   * ⚠️ NIENTE NUVOLETTA. C'era un `Popup` di Mapbox che mostrava titolo, paga,
   * orario e tag; toccandolo si apriva la scheda, che mostra le stesse cose
   * PIU' employer, descrizione e mappa. Era l'anteprima di una cosa che stava a
   * un tocco di distanza: due tocchi per lo stesso contenuto, e un elemento in
   * piu' da mantenere e da disegnare.
   *
   * Ora il pin apre direttamente la scheda, che si ferma bassa (vedi i punti di
   * aggancio in JobDetailsSheet): la mappa resta visibile sopra, il pin non
   * viene coperto, e per il resto si trascina in su. E' il comportamento di
   * Apple Maps e Google Maps.
   */
  const apriScheda = useCallback((job: Job) => {
    setLastSelectedJob(job);
    setIsDetailsOpen(true);
  }, []);

  const handleSingleJobClick = useCallback((job: Job) => {
    apriScheda(job);
  }, [apriScheda]);

  const handleGroupMarkerClick = useCallback((employerId: string, employerJobs: Job[]) => {
    if (employerJobs.length === 1) {
      apriScheda(employerJobs[0]);
    } else {
      // Multiple jobs - open employer drawer
      setSelectedEmployerJobs(employerJobs);
      setIsEmployerDrawerOpen(true);
    }
  }, [apriScheda]);

  const handleJobSelectFromDrawer = useCallback((job: Job) => {
    setLastSelectedJob(job);
    setIsDetailsOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
  }, []);

  const areaAperta = useMemo(() => {
    const j = isDetailsOpen ? lastSelectedJob : null;
    if (!j?.area_raggio || j.lat == null || j.lng == null) return null;
    return cerchioGeo(j.lat, j.lng, j.area_raggio, j.owner_id);
  }, [isDetailsOpen, lastSelectedJob]);

  const handleCloseEmployerDrawer = useCallback(() => {
    setIsEmployerDrawerOpen(false);
    setSelectedEmployerJobs([]);
  }, []);

  /* ---- LE ZONE ----
     L'indice si rifà solo quando cambiano gli annunci; gli elementi da
     disegnare quando cambia lo zoom intero. */
  const indiceZone = useMemo(() => creaIndiceZone(employerGroups), [employerGroups]);
  const elementi = useMemo(
    () => separaSovrapposti(elementiMappa(indiceZone, employerGroups, zoomIntero), zoomIntero),
    [indiceZone, employerGroups, zoomIntero]
  );

  /* Dove stava ogni annuncio al giro prima: chiave del marker che lo
     conteneva, sua posizione, quanti annunci aveva. Serve all'animazione: un
     pin che nasce da una zona più grande parte dal punto della zona.
     ⚠️ Si aggiorna in un EFFETTO, dopo il disegno, e non dentro lo useMemo:
     StrictMode calcola due volte i memo in sviluppo, e al secondo giro il
     ref sarebbe già aggiornato — niente animazione in locale (§12, la stessa
     trappola dello splash). */
  const posizioniPrima = useRef(new globalThis.Map<string, { chiave: string; lat: number; lng: number; n: number }>());
  useEffect(() => {
    const m = new globalThis.Map<string, { chiave: string; lat: number; lng: number; n: number }>();
    for (const el of elementi) {
      for (const id of el.idAnnunci) m.set(id, { chiave: el.chiave, lat: el.lat, lng: el.lng, n: el.idAnnunci.length });
    }
    posizioniPrima.current = m;
  }, [elementi]);

  /* ---- I PIN CHE ESCONO (l'altra metà dell'animazione, vedi PinUscente) ----
     Un pin la cui chiave non c'è più resta per la durata dell'animazione:
     se i suoi annunci ora stanno in un elemento più grande ci scivola dentro,
     se no sfuma sul posto. `useLayoutEffect` e non `useEffect`: lo stato
     nuovo si disegna PRIMA che il browser mostri il fotogramma, quindi il pin
     vecchio non sparisce mai, neanche per un fotogramma. */
  const elementiPrima = useRef<ElementoMappa[]>([]);
  const [uscenti, setUscenti] = useState<{ id: string; el: ElementoMappa; verso: { x: number; y: number } }[]>([]);
  useLayoutEffect(() => {
    const prima = elementiPrima.current;
    elementiPrima.current = elementi;
    const mappa = mappaRef.current;
    if (prima.length === 0 || !mappa) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const chiaviOra = new Set(elementi.map((el) => el.chiave));
    const doveOra = new globalThis.Map<string, ElementoMappa>();
    for (const el of elementi) for (const id of el.idAnnunci) doveOra.set(id, el);

    const nuovi = prima
      .filter((el) => !chiaviOra.has(el.chiave))
      .map((el) => {
        const dest = doveOra.get(el.idAnnunci[0]);
        let verso = { x: 0, y: 0 };
        if (dest && dest.idAnnunci.length > el.idAnnunci.length) {
          const p0 = mappa.project([el.lng, el.lat]);
          const p1 = mappa.project([dest.lng, dest.lat]);
          verso = { x: p1.x - p0.x, y: p1.y - p0.y };
        }
        return { id: `${el.chiave}@${performance.now()}`, el, verso };
      });
    if (nuovi.length === 0) return;

    setUscenti((u) => [...u, ...nuovi]);
    const ids = new Set(nuovi.map((n) => n.id));
    // Niente cleanup che annulli il timer: se lo zoom cambia di nuovo prima
    // della fine, questi devono uscire comunque.
    setTimeout(() => setUscenti((u) => u.filter((x) => !ids.has(x.id))), DURATA_PIN + 40);
  }, [elementi]);

  const handleZonaClick = useCallback((chiave: string) => {
    const zona = elementi.find((el) => el.chiave === chiave);
    if (zona?.tipo !== "zona") return;
    setAnnunciZona(zona.annunci);
    setIsZonaOpen(true);
  }, [elementi]);

  const handleCloseZona = useCallback(() => {
    setIsZonaOpen(false);
  }, []);

  const markers = useMemo(() => {
    const mappa = mappaRef.current;
    const prima = posizioniPrima.current;

    /* Da dove arriva un marker NUOVO (chiave mai vista al giro prima):
       - viene da una zona più grande (zoom avanti) → parte dal punto della
         zona, misurato in pixel adesso, e scivola al suo posto;
       - unisce più marker (zoom indietro) → si gonfia sul posto. */
    const ingressoDi = (chiave: string, ids: string[], lat: number, lng: number): Ingresso | undefined => {
      if (prima.size === 0 || !mappa) return undefined;
      const da = prima.get(ids[0]);
      if (!da || da.chiave === chiave) return undefined;
      if (da.n > ids.length) {
        const p0 = mappa.project([da.lng, da.lat]);
        const p1 = mappa.project([lng, lat]);
        return { x: p0.x - p1.x, y: p0.y - p1.y, scala: 0.85 };
      }
      return { x: 0, y: 0, scala: 0.8 };
    };

    return elementi.map((el) => {
      const ids = el.idAnnunci;
      const hasFilteredJobs = isSearchActive ? ids.some((id) => filteredJobIds.has(id)) : true;
      const isDimmed = isSearchActive && !hasFilteredJobs;
      const isHighlighted = isSearchActive && hasFilteredJobs;
      const ingresso = ingressoDi(el.chiave, ids, el.lat, el.lng);

      if (el.tipo === "zona") {
        return (
          <ZonaMarker
            key={el.chiave}
            chiave={el.chiave}
            lat={el.lat}
            lng={el.lng}
            n={ids.length}
            isEmployer={isEmployer}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            isSearchActive={isSearchActive}
            ingresso={ingresso}
            onMarkerClick={handleZonaClick}
          />
        );
      }

      const group = el.gruppo;
      if (group.jobs.length === 1) {
        return (
          <SingleJobMarker
            key={el.chiave}
            job={group.jobs[0]}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            isEmployer={isEmployer}
            isSearchActive={isSearchActive}
            ingresso={ingresso}
            onMarkerClick={handleSingleJobClick}
          />
        );
      }
      return (
        <EmployerGroupMarker
          key={el.chiave}
          employerId={group.employerId}
          jobs={group.jobs}
          lat={group.lat}
          lng={group.lng}
          isEmployer={isEmployer}
          isHighlighted={isHighlighted}
          isDimmed={isDimmed}
          isSearchActive={isSearchActive}
          ingresso={ingresso}
          onMarkerClick={handleGroupMarkerClick}
        />
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementi, isSearchActive, filteredIdsString, isEmployer, handleSingleJobClick, handleGroupMarkerClick, handleZonaClick]);

  const loadingBgClass = isEmployer ? "bg-employer/20" : "bg-primary/20";
  const loadingIconClass = isEmployer ? "text-employer" : "text-primary";

  if (mapboxToken === null) {
    return (
      <div className="relative w-full h-full bg-muted overflow-hidden rounded-3xl flex items-center justify-center">
        <div className="text-center p-6">
          <div className={`w-12 h-12 ${loadingBgClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <OrologioIcon className={`w-6 h-6 ${loadingIconClass} animate-pulse`} />
          </div>
          <p className="text-muted-foreground">Caricamento mappa...</p>
        </div>
      </div>
    );
  }

  if (mapboxToken === "") {
    return <MapFallback jobs={jobs} isEmployer={isEmployer} />;
  }

  return (
    <>
      <Map
        ref={mappaRef}
        initialViewState={vistaIniziale}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        reuseMaps
        // Fine di ogni movimento (trascinamento, pizzico, easeTo del GPS):
        // è la vista da cui ripartire al ritorno (vedi `vistaRicordata`).
        onMoveEnd={(e) => {
          vistaRicordata = {
            longitude: e.viewState.longitude,
            latitude: e.viewState.latitude,
            zoom: e.viewState.zoom,
            employer: isEmployer,
          };
        }}
        onZoom={(e) => {
          const z = Math.floor(e.viewState.zoom);
          setZoomIntero((prima) => (prima === z ? prima : z));
        }}
        // ⚠️ Non `e.target` (§11: i tipi di react-map-gl non sempre lo dichiarano).
        onLoad={() => {
          const z = mappaRef.current?.getZoom();
          if (z != null) setZoomIntero(Math.floor(z));
          centraSuUtente();
        }}
      >
        {/* L'area dell'annuncio APERTO, se è di un privato: dice «più o meno
            qui» mentre si legge la scheda, e sparisce quando la si chiude. */}
        {areaAperta && (
          <Source id="area-aperta" type="geojson" data={areaAperta}>
            <Layer id="area-aperta-fondo" type="fill" paint={{ "fill-color": coloriAree.fondo }} />
            <Layer
              id="area-aperta-bordo"
              type="line"
              paint={{ "line-color": coloriAree.bordo, "line-width": 2, "line-dasharray": [2, 1.5] }}
            />
          </Source>
        )}
        {/* Niente NavigationControl: su mobile lo zoom si fa con le dita, e i
            quadratini bianchi di serie di Mapbox erano l'unico elemento di UI
            in tutta l'app a non essere nostro. */}

        {/* User location marker (Worker only) */}
        {userLocation && (
          <UserLocationMarker
            latitude={userLocation.lat}
            longitude={userLocation.lng}
          />
        )}
        
        {/* Prima gli uscenti, poi i pin veri: a parità di posto, quello vero sta sopra. */}
        {uscenti.map((u) => (
          <PinUscente key={u.id} el={u.el} verso={u.verso} isEmployer={isEmployer} />
        ))}
        {markers}
      </Map>

      {/* Single Job Details Sheet */}
      <JobDetailsSheet job={lastSelectedJob} isOpen={isDetailsOpen} onClose={handleCloseDetails} />
      
      {/* Lista degli annunci di una ZONA */}
      <ZonaAnnunciDrawer
        isOpen={isZonaOpen}
        onClose={handleCloseZona}
        annunci={annunciZona}
        onJobSelect={handleJobSelectFromDrawer}
        evidenziati={isSearchActive ? filteredJobIds : undefined}
      />

      {/* Employer Jobs Selection Drawer */}
      <EmployerJobsDrawer
        isOpen={isEmployerDrawerOpen}
        onClose={handleCloseEmployerDrawer}
        jobs={selectedEmployerJobs}
        onJobSelect={handleJobSelectFromDrawer}
        evidenziati={isSearchActive ? filteredJobIds : undefined}
      />
    </>
  );
}

// Simple fallback when no token
function MapFallback({ jobs, isEmployer }: { jobs: Job[]; isEmployer: boolean }) {
  return (
    <div className="relative w-full h-full bg-muted overflow-hidden rounded-3xl flex items-center justify-center">
      <div className="text-center p-6">
        <p className="text-muted-foreground">Mappa non disponibile</p>
        <p className="text-xs text-muted-foreground mt-1">{jobs.length} impieghi disponibili</p>
      </div>
    </div>
  );
}

// Export memoized component to prevent parent re-renders from causing map re-renders
export const InteractiveMap = memo(InteractiveMapInner);
