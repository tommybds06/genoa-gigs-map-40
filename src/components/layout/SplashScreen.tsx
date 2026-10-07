import { PointerEvent, useCallback, useEffect, useRef, useState } from "react";

/**
 * SPLASH D'APERTURA — il video del logo, una volta al giorno.
 *
 * È uno STRATO sopra l'app, non un cancello prima: l'app sotto è già montata
 * e intanto carica sessione, profilo e mappa. Quando lo splash sparisce il
 * lavoro è già fatto, invece di cominciare in quel momento.
 *
 * Si chiude: a fine video · al primo tocco · dopo 1 s d'immagine se il video
 * non parte · comunque dopo 7 s. L'ultima è la rete di sicurezza: qualunque
 * cosa vada storta, l'app non resta mai bloccata qui.
 *
 * Il fondo `#F3EFE3` è quello dei fotogrammi (letto dai PNG). La carta
 * dell'app è `#F4EEE2`: una unità per canale, nella dissolvenza non si vede.
 */

const CHIAVE = "politask-splash-visto";
const SFONDO = "#F3EFE3";
const DISSOLVENZA_MS = 300;
const IMMAGINE_MS = 1000;
/** Se entro questo tempo il video non è partito, si passa all'immagine. */
const AVVIO_MAX_MS = 2500;
const SICUREZZA_MS = 7000;

type Modo = "video" | "immagine";

function oggi(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Decide se mostrarlo e come. Solo LETTURA: la data si scrive in un effetto,
 * perché in sviluppo StrictMode chiama due volte l'inizializzatore di
 * `useState` — se scrivesse qui, la seconda chiamata leggerebbe «già visto
 * oggi» e lo splash non comparirebbe mai in locale.
 *
 * `?splash` nell'indirizzo lo forza, per le prove.
 */
function decidi(): Modo | null {
  let forzato = false;
  try {
    forzato = new URLSearchParams(window.location.search).has("splash");
  } catch {
    /* niente: senza URL leggibile si segue la regola normale */
  }

  if (!forzato) {
    try {
      if (window.localStorage.getItem(CHIAVE) === oggi()) return null;
    } catch {
      /* localStorage bloccato (navigazione privata, permessi): lo si mostra */
    }
  }

  const movimentoRidotto =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return movimentoRidotto ? "immagine" : "video";
}

export function SplashScreen() {
  const [modo, setModo] = useState<Modo | null>(decidi);
  const [inUscita, setInUscita] = useState(false);
  const [finito, setFinito] = useState(modo === null);
  const chiuso = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const chiudi = useCallback(() => {
    if (chiuso.current) return;
    chiuso.current = true;
    setInUscita(true);
    window.setTimeout(() => setFinito(true), DISSOLVENZA_MS);
  }, []);

  // Visto oggi: si segna appena compare, non quando si chiude. Chi ricarica
  // la pagina a metà video non se lo rivede.
  useEffect(() => {
    if (finito) return;
    try {
      window.localStorage.setItem(CHIAVE, oggi());
    } catch {
      /* se non si può salvare, domani come oggi: lo si rivede, pazienza */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rete di sicurezza.
  useEffect(() => {
    if (finito) return;
    const t = window.setTimeout(chiudi, SICUREZZA_MS);
    return () => window.clearTimeout(t);
  }, [finito, chiudi]);

  // Immagine finale (movimento ridotto, o video che non parte): 1 s e via.
  useEffect(() => {
    if (modo !== "immagine") return;
    const t = window.setTimeout(chiudi, IMMAGINE_MS);
    return () => window.clearTimeout(t);
  }, [modo, chiudi]);

  // Avvio del video, controllato. `autoPlay` da solo non basta: su iOS in
  // risparmio energetico l'autoplay viene negato senza nessun evento, e lo
  // splash resterebbe sul primo fotogramma fino alla rete di sicurezza.
  useEffect(() => {
    if (modo !== "video") return;
    const v = videoRef.current;
    if (!v) return;

    let partito = false;
    // `annullato`: una promessa di play() di un avvio precedente (StrictMode
    // in sviluppo esegue l'effetto due volte) non deve cambiare lo stato dopo.
    let annullato = false;
    const ripiego = () => {
      if (!annullato && !partito && !chiuso.current) setModo("immagine");
    };
    const segnaPartito = () => {
      partito = true;
    };

    // Safari vuole `muted` come proprietà già prima di play(), non solo
    // come attributo JSX.
    v.muted = true;
    v.defaultMuted = true;
    v.addEventListener("playing", segnaPartito);
    const tentativo = v.play();
    if (tentativo) tentativo.catch(ripiego);
    const t = window.setTimeout(ripiego, AVVIO_MAX_MS);

    return () => {
      annullato = true;
      v.removeEventListener("playing", segnaPartito);
      window.clearTimeout(t);
    };
  }, [modo]);

  /* ⚠️ Lo stop alla propagazione serve: all'avvio possono aprirsi SOTTO lo
     splash il promemoria recensioni e l'avviso di fine lavoro (Dialog di
     Radix). Radix ascolta i pointerdown sul document per chiuderli «al clic
     fuori»: senza questo, il tocco che salta lo splash li chiuderebbe. */
  const tocco = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    chiudi();
  };

  if (finito || modo === null) return null;

  return (
    <div
      role="presentation"
      onPointerDown={tocco}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: SFONDO,
        opacity: inUscita ? 0 : 1,
        transition: `opacity ${DISSOLVENZA_MS}ms ease-out`,
        // Esplicito: un Dialog aperto sotto mette `pointer-events: none` sul
        // body, e lo splash lo erediterebbe — il tocco non arriverebbe.
        pointerEvents: "auto",
      }}
    >
      {modo === "video" ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster="/splash/politask-splash-inizio.png"
          onEnded={chiudi}
          onError={() => !chiuso.current && setModo("immagine")}
          aria-hidden="true"
          className="h-full w-full"
          style={{ objectFit: "contain" }}
        >
          <source src="/splash/politask-splash.webm" type="video/webm" />
          {/* L'errore sull'ULTIMA sorgente vuol dire che nessuna è andata. */}
          <source
            src="/splash/politask-splash.mp4"
            type="video/mp4"
            onError={() => !chiuso.current && setModo("immagine")}
          />
        </video>
      ) : (
        <img
          src="/splash/politask-splash-finale.png"
          alt="Politask"
          className="h-full w-full"
          style={{ objectFit: "contain" }}
        />
      )}
    </div>
  );
}
