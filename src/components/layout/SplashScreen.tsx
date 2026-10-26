import { PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { consumaSaltoSplash, splashDaSaltare } from "@/lib/splash";
import type { AnimationItem } from "lottie-web";

/**
 * SPLASH D'APERTURA — il logo animato in Lottie, a ogni avvio a freddo.
 *
 * È uno STRATO sopra l'app, non un cancello prima: l'app sotto è già montata
 * e intanto carica sessione, profilo e mappa. Il componente vive una volta
 * sola per caricamento della pagina, quindi cambiare pagina o tornare
 * indietro non lo rifà comparire: solo un avvio a freddo (in Despia, una
 * riapertura dell'app che non era più in memoria).
 *
 * Il file: `src/assets/politask-logo-animato.json`, 1080×1920, 16 fps,
 * 64 fotogrammi = 4 s. Parte da carta vuota, quindi il passaggio dalla
 * schermata nativa (stesso #F3EFE3, senza logo) non fa salti.
 *
 * Si chiude: a fine animazione + 0,5 s di logo fermo · al tocco · con il logo
 * statico per 1 s se il Lottie non si carica · comunque dopo 7 s. L'ultima è
 * la rete di sicurezza: qualunque cosa vada storta, non si resta bloccati qui.
 */

const SFONDO = "#F3EFE3";
const PAUSA_FINALE_MS = 500;
const DISSOLVENZA_MS = 300;
/** Logo fermo: «riduci movimento», o ripiego se il Lottie non c'è. */
const FERMO_MS = 1000;
/** Se entro questo tempo libreria e file non sono arrivati, si va sul logo statico. */
const CARICAMENTO_MAX_MS = 2500;
const SICUREZZA_MS = 7000;

function movimentoRidotto(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Il punto d'ingresso: dopo un ricaricamento DENTRO la registrazione lo
 * splash non parte (`lib/splash.ts`). ⚠️ La lettura sta nell'inizializzatore
 * (solo lettura: StrictMode lo chiama due volte, §12), la cancellazione in un
 * effetto.
 */
export function SplashScreen() {
  const [salta] = useState(splashDaSaltare);
  useEffect(() => {
    if (salta) consumaSaltoSplash();
  }, [salta]);
  if (salta) return null;
  return <SplashAnimato />;
}

function SplashAnimato() {
  const [aperto, setAperto] = useState(true);
  const [inUscita, setInUscita] = useState(false);
  const [statico, setStatico] = useState(false);
  const contenitore = useRef<HTMLDivElement>(null);
  const chiuso = useRef(false);
  const timerUscita = useRef<number>();

  const esci = useCallback(() => {
    if (chiuso.current) return;
    chiuso.current = true;
    window.clearTimeout(timerUscita.current);
    setInUscita(true);
    window.setTimeout(() => setAperto(false), DISSOLVENZA_MS);
  }, []);

  const esciTra = useCallback(
    (ms: number) => {
      window.clearTimeout(timerUscita.current);
      timerUscita.current = window.setTimeout(esci, ms);
    },
    [esci]
  );

  // Rete di sicurezza.
  useEffect(() => {
    const t = window.setTimeout(esci, SICUREZZA_MS);
    return () => window.clearTimeout(t);
  }, [esci]);

  useEffect(() => {
    // `annullato`: in sviluppo StrictMode esegue l'effetto due volte; il primo
    // giro, se arriva dopo, non deve creare una seconda animazione.
    let annullato = false;
    let animazione: AnimationItem | null = null;

    const ripiego = () => {
      if (annullato || chiuso.current) return;
      animazione?.destroy();
      animazione = null;
      setStatico(true);
      esciTra(FERMO_MS);
    };
    const limite = window.setTimeout(ripiego, CARICAMENTO_MAX_MS);

    // Libreria e file in import dinamico: finiscono in pezzi a parte del
    // bundle e non pesano sull'avvio dell'app. `lottie_light` è lottie-web
    // col solo renderer SVG e senza motore delle espressioni — il file non
    // ne usa — a circa metà del peso.
    Promise.all([
      import("lottie-web/build/player/lottie_light"),
      import("@/assets/politask-logo-animato.json"),
    ])
      .then(([{ default: lottie }, { default: dati }]) => {
        if (annullato || chiuso.current || !contenitore.current) return;
        const ridotto = movimentoRidotto();

        animazione = lottie.loadAnimation({
          container: contenitore.current,
          renderer: "svg",
          loop: false,
          autoplay: !ridotto,
          animationData: dati,
          rendererSettings: {
            // "meet" = contain: sui telefoni (più alti di 9:16) occupa tutta
            // la larghezza e resta centrato in verticale, senza tagli.
            preserveAspectRatio: "xMidYMid meet",
          },
        });
        window.clearTimeout(limite);

        if (ridotto) {
          // Direttamente l'ultimo fotogramma: il logo completo, fermo.
          animazione.goToAndStop(animazione.totalFrames - 1, true);
          esciTra(FERMO_MS);
        } else {
          animazione.addEventListener("complete", () => esciTra(PAUSA_FINALE_MS));
        }
      })
      .catch((e) => {
        console.error("Splash: Lottie non caricato, uso il logo statico", e);
        ripiego();
      });

    return () => {
      annullato = true;
      window.clearTimeout(limite);
      animazione?.destroy();
    };
  }, [esciTra]);

  /* ⚠️ Lo stop alla propagazione serve: all'avvio possono aprirsi SOTTO lo
     splash il promemoria recensioni e l'avviso di fine lavoro (Dialog di
     Radix). Radix ascolta i pointerdown sul document per chiuderli «al clic
     fuori»: senza questo, il tocco che salta lo splash li chiuderebbe. */
  const tocco = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    esci();
  };

  if (!aperto) return null;

  return (
    <div
      role="presentation"
      onPointerDown={tocco}
      className="fixed inset-0 z-[9999]"
      style={{
        backgroundColor: SFONDO,
        opacity: inUscita ? 0 : 1,
        transition: `opacity ${DISSOLVENZA_MS}ms ease-out`,
        // Esplicito: un Dialog aperto sotto mette `pointer-events: none` sul
        // body, e lo splash lo erediterebbe — il tocco non arriverebbe.
        pointerEvents: "auto",
      }}
    >
      {statico ? (
        <div className="flex h-full w-full items-center justify-center">
          {/* Il logo che c'è già in tutta l'app, alla stessa larghezza del
              logo nell'ultimo fotogramma del Lottie — misurata: 852 su 1080,
              il 79%, centrato a metà altezza — così il ripiego non sembra
              un'altra schermata. Su schermi più larghi di 9:16 il Lottie
              smette di occupare tutta la larghezza; il tetto in vh tiene
              il ripiego alla stessa misura. */}
          <img
            src="/images/logo-worker-v2.svg"
            alt="Politask"
            style={{ width: "min(79vw, calc(79vh * 9 / 16))" }}
          />
        </div>
      ) : (
        <div ref={contenitore} role="img" aria-label="Politask" className="h-full w-full" />
      )}
    </div>
  );
}
