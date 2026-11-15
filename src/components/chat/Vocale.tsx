import { useCallback, useEffect, useRef, useState, type PointerEvent as EventoPuntatore } from "react";
import { ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BidoneIcon, LucchettoIcon, MicrofonoIcon, PausaSimbolo, PlaySimbolo } from "@/components/icons/uiIcons";
import { useCerchioImperfetto } from "@/hooks/useCerchioImperfetto";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  BARRE_VOCALE,
  MAX_SECONDI_VOCALE,
  MIN_SECONDI_VOCALE,
  durataVocale,
  estensioneVocale,
  leggiVocale,
  riduciPicchi,
} from "@/lib/allegati";
import { cn } from "@/lib/utils";

/**
 * I VOCALI — 15 novembre 2026 (Fase 4 della chat, §18).
 *
 * IL GESTO è quello di WhatsApp e Telegram: a campo vuoto il tasto d'invio
 * diventa il MICROFONO.
 * - TOCCA → registra già BLOCCATO, a mani libere: in basso il cestino e
 *   l'invio. (Tommaso, 15 novembre: «le app più funzionanti ti fanno
 *   registrare semplicemente toccando». Prima un tocco dava solo il toast
 *   «Tieni premuto…».) Tocco = lasciato prima di `SOGLIA_TOCCO`.
 * - TIENI PREMUTO → registra; LASCI → parte.
 * - SCORRI A SINISTRA (oltre `SOGLIA_ANNULLA`) → annullato.
 * - SCORRI IN SU (oltre `SOGLIA_BLOCCO`) → bloccato, come col tocco.
 * - Sotto `MIN_SECONDI_VOCALE` non parte niente: «Vocale troppo breve».
 * - Al massimo `MAX_SECONDI_VOCALE` (3 minuti): poi parte da solo.
 *
 * IL FORMATO. Android (Chrome) e iPhone (Safari) registrano in formati
 * diversi, e un vocale deve potersi ascoltare dall'altra parte. Si sceglie il
 * primo che il telefono sa fare fra MP4/AAC (lo leggono tutti: Chrome dalla
 * 126 lo registra se il sistema ha l'encoder, Safari sempre) e WebM/Opus
 * (Safari lo legge solo dalle versioni recenti). Se un telefono non riesce ad
 * ascoltarlo, la bolla lo dice invece di restare muta.
 *
 * IL PERMESSO. Il microfono si chiede al primo tocco. Mentre il telefono
 * chiede, il dito di solito si alza: allora, appena il permesso arriva, si
 * registra BLOCCATO, come dopo un tocco.
 *
 * Durata e forma d'onda vanno nel NOME del file (`lib/allegati.ts`): niente
 * colonne nuove, e la bolla si disegna senza scaricare l'audio.
 */

const TIPI = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
const SOGLIA_ANNULLA = 110; // px verso sinistra
const SOGLIA_BLOCCO = 70; // px verso l'alto
const SOGLIA_TOCCO = 350; // ms: lasciato prima, è un tocco (→ bloccato)
const OGNI = 100; // ms fra due misure del livello

export const registrazioneDisponibile = () =>
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

const scegliTipo = () => TIPI.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";

export interface Registrazione {
  file: File;
  secondi: number;
  picchi: number[];
  estensione: string;
}

export type StatoVocale = "fermo" | "avvio" | "tieni" | "bloccato";

/* ------------------------------------------------------------------ */
/* Il registratore e il gesto                                          */
/* ------------------------------------------------------------------ */

export function useVocale({ attivo, onPronto }: { attivo: boolean; onPronto: (r: Registrazione) => void }) {
  const [stato, setStatoVero] = useState<StatoVocale>("fermo");
  const statoRif = useRef<StatoVocale>("fermo");
  // ⚠️ Il dito che si alza dal tocco genera un `click`, e nel punto dove
  // c'era il microfono compare l'INVIO: quel clic manderebbe subito un
  // vocale vuoto. Per un attimo dopo il blocco l'invio non ascolta.
  const bloccatoIl = useRef(0);
  const setStato = (s: StatoVocale) => {
    statoRif.current = s;
    if (s === "bloccato") bloccatoIl.current = performance.now();
    setStatoVero(s);
  };
  const [secondi, setSecondi] = useState(0);
  const [livelli, setLivelli] = useState<number[]>([]);
  const [spinta, setSpinta] = useState({ dx: 0, dy: 0 });

  const premuto = useRef(false);
  const partenza = useRef({ x: 0, y: 0, t: 0 });
  // Lasciato mentre si aspettava il microfono: si registra bloccato.
  const bloccaAllAvvio = useRef(false);
  const r = useRef<{
    stream?: MediaStream;
    rec?: MediaRecorder;
    pezzi: Blob[];
    ctx?: AudioContext;
    timer?: number;
    inizio: number;
    tutti: number[];
  }>({ pezzi: [], inizio: 0, tutti: [] });
  const ultimoPronto = useRef(onPronto);
  ultimoPronto.current = onPronto;

  const pulisci = useCallback(() => {
    const x = r.current;
    if (x.timer) window.clearInterval(x.timer);
    x.stream?.getTracks().forEach((t) => t.stop());
    void x.ctx?.close().catch(() => {});
    r.current = { pezzi: [], inizio: 0, tutti: [] };
    setSecondi(0);
    setLivelli([]);
    setSpinta({ dx: 0, dy: 0 });
  }, []);

  /** Ferma la registrazione: con `invia` la consegna, se no la butta. */
  const concludi = useCallback(
    async (invia: boolean) => {
      const x = r.current;
      const rec = x.rec;
      if (!rec) {
        pulisci();
        setStato("fermo");
        return;
      }
      x.rec = undefined; // una volta sola anche se arrivano due eventi
      const durata = (performance.now() - x.inizio) / 1000;
      const finito = new Promise<void>((ok) => {
        rec.onstop = () => ok();
      });
      if (rec.state !== "inactive") rec.stop();
      await finito;
      const tipo = (rec.mimeType || scegliTipo() || "audio/webm").split(";")[0];
      const blob = new Blob(x.pezzi, { type: tipo });
      const tutti = x.tutti.slice();
      pulisci();
      setStato("fermo");
      if (!invia) {
        navigator.vibrate?.([10, 40, 10]);
        return;
      }
      if (durata < MIN_SECONDI_VOCALE || blob.size === 0) {
        toast("Vocale troppo breve", { duration: 1500 });
        return;
      }
      const estensione = estensioneVocale(tipo);
      ultimoPronto.current({
        file: new File([blob], `vocale.${estensione}`, { type: tipo }),
        secondi: Math.min(durata, MAX_SECONDI_VOCALE),
        picchi: riduciPicchi(tutti),
        estensione,
      });
    },
    [pulisci]
  );

  const avvia = useCallback(async () => {
    setStato("avvio");
    // L'AudioContext nasce DENTRO il tocco: su iPhone, fuori da un gesto,
    // resterebbe sospeso e la forma d'onda piatta.
    let ctx: AudioContext | undefined;
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      void ctx.resume();
    } catch {
      ctx = undefined;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      void ctx?.close().catch(() => {});
      setStato("fermo");
      const nome = (e as DOMException)?.name;
      console.error("[Politask] microfono", e);
      toast.error(
        nome === "NotAllowedError"
          ? "Il microfono è bloccato: consentilo nelle impostazioni del browser"
          : "Non riesco a usare il microfono",
        { duration: 3000 }
      );
      return;
    }
    // Il gesto è stato interrotto dal telefono mentre si aspettava il
    // microfono (`pointercancel`): niente registrazione.
    if (!premuto.current && !bloccaAllAvvio.current) {
      stream.getTracks().forEach((t) => t.stop());
      void ctx?.close().catch(() => {});
      setStato("fermo");
      return;
    }

    try {
      const tipo = scegliTipo();
      const rec = new MediaRecorder(stream, { ...(tipo ? { mimeType: tipo } : {}), audioBitsPerSecond: 32000 });
      const x = r.current;
      x.stream = stream;
      x.rec = rec;
      x.ctx = ctx;
      x.pezzi = [];
      x.tutti = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) x.pezzi.push(e.data);
      };
      rec.start(1000);

      // Il livello, per la forma d'onda: l'energia del segnale ogni 100 ms.
      let leggi: (() => number) | null = null;
      if (ctx) {
        const analizzatore = ctx.createAnalyser();
        analizzatore.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(analizzatore);
        const campioni = new Float32Array(analizzatore.fftSize);
        leggi = () => {
          analizzatore.getFloatTimeDomainData(campioni);
          let somma = 0;
          for (const v of campioni) somma += v * v;
          return Math.min(1, Math.sqrt(somma / campioni.length) * 4);
        };
      }
      x.inizio = performance.now();
      x.timer = window.setInterval(() => {
        const livello = leggi ? leggi() : 0.3;
        x.tutti.push(livello);
        setLivelli((l) => [...l.slice(-(BARRE_VOCALE - 1)), livello]);
        const s = (performance.now() - x.inizio) / 1000;
        setSecondi(s);
        if (s >= MAX_SECONDI_VOCALE) void concludi(true);
      }, OGNI);
      navigator.vibrate?.(10);
      // Toccato (o lasciato mentre il telefono chiedeva il permesso): bloccato.
      setStato(bloccaAllAvvio.current || !premuto.current ? "bloccato" : "tieni");
      if (bloccaAllAvvio.current) premuto.current = false;
      bloccaAllAvvio.current = false;
    } catch (e) {
      console.error("[Politask] registrazione", e);
      stream.getTracks().forEach((t) => t.stop());
      void ctx?.close().catch(() => {});
      setStato("fermo");
      toast.error("Su questo telefono non riesco a registrare", { duration: 3000 });
    }
  }, [concludi]);

  // Chat chiusa, pagina lasciata: la registrazione si butta.
  useEffect(() => {
    if (!attivo && statoRif.current !== "fermo") void concludi(false);
  }, [attivo, concludi]);
  useEffect(() => {
    const x = r;
    return () => {
      if (x.current.rec?.state === "recording") x.current.rec.stop();
      x.current.stream?.getTracks().forEach((t) => t.stop());
      if (x.current.timer) window.clearInterval(x.current.timer);
    };
  }, []);

  const gestori = {
    onPointerDown: (e: EventoPuntatore<HTMLButtonElement>) => {
      if (statoRif.current !== "fermo") return;
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      premuto.current = true;
      bloccaAllAvvio.current = false;
      partenza.current = { x: e.clientX, y: e.clientY, t: performance.now() };
      setSpinta({ dx: 0, dy: 0 });
      void avvia();
    },
    onPointerMove: (e: EventoPuntatore<HTMLButtonElement>) => {
      if (!premuto.current) return;
      const dx = Math.min(0, e.clientX - partenza.current.x);
      const dy = Math.min(0, e.clientY - partenza.current.y);
      setSpinta({ dx, dy });
      if (statoRif.current !== "tieni") return;
      if (dx < -SOGLIA_ANNULLA) {
        premuto.current = false;
        void concludi(false);
      } else if (dy < -SOGLIA_BLOCCO) {
        premuto.current = false;
        navigator.vibrate?.(10);
        setSpinta({ dx: 0, dy: 0 });
        setStato("bloccato");
      }
    },
    onPointerUp: () => {
      if (!premuto.current) return;
      premuto.current = false;
      const tocco = performance.now() - partenza.current.t < SOGLIA_TOCCO;
      if (statoRif.current === "avvio") {
        // Il microfono non ha ancora risposto: appena risponde, bloccato.
        bloccaAllAvvio.current = true;
      } else if (statoRif.current === "tieni") {
        if (tocco) {
          setSpinta({ dx: 0, dy: 0 });
          setStato("bloccato");
        } else void concludi(true);
      }
    },
    onPointerCancel: () => {
      if (!premuto.current) return;
      premuto.current = false;
      bloccaAllAvvio.current = false;
      if (statoRif.current === "tieni") void concludi(false);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };

  return {
    stato,
    secondi,
    livelli,
    spinta,
    gestori,
    annulla: () => void concludi(false),
    invia: () => {
      if (performance.now() - bloccatoIl.current < 450) return;
      void concludi(true);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Il tasto e la barra                                                 */
/* ------------------------------------------------------------------ */

/**
 * Il microfono: la stessa tessera dell'invio (pieno del ruolo, icona in
 * inchiostro). Tenuto premuto si ingrandisce e segue il dito verso
 * sinistra; sopra compare il lucchetto da raggiungere scorrendo in su.
 * ⚠️ È un `button` suo e non `Tessera`: servono gli eventi del puntatore,
 * e `touch-action: none`, se no il telefono prende il gesto per uno
 * scorrimento e lo interrompe.
 */
export function TastoMicrofono({
  stato,
  spinta,
  gestori,
}: {
  stato: StatoVocale;
  spinta: { dx: number; dy: number };
  gestori: ReturnType<typeof useVocale>["gestori"];
}) {
  const { isEmployer } = useAppTheme();
  const tiene = stato === "tieni";
  return (
    <div className="relative shrink-0">
      {tiene && (
        <div
          aria-hidden="true"
          className="sagoma-chip pointer-events-none absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 flex-col items-center gap-0.5 rounded-full bg-paper-sheet px-2 py-2 text-ink-soft"
          style={{ transform: `translate(-50%, ${Math.max(spinta.dy, -SOGLIA_BLOCCO) * 0.6}px)` }}
        >
          <LucchettoIcon className="h-4 w-4" />
          <ChevronUp className="h-4 w-4 animate-bounce" />
        </div>
      )}
      <button
        type="button"
        aria-label="Registra un vocale"
        title="Tocca o tieni premuto per registrare"
        {...gestori}
        className="flex h-12 w-12 select-none items-center justify-center [-webkit-touch-callout:none] [touch-action:none]"
      >
        <span
          className={cn(
            "sagoma-tessera flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-150",
            isEmployer ? "bg-employer" : "bg-primary",
            "text-[hsl(var(--su-ruolo))]"
          )}
          style={{ transform: tiene ? `translateX(${Math.max(spinta.dx, -SOGLIA_ANNULLA)}px) scale(1.25)` : undefined }}
        >
          {stato === "avvio" ? <Loader2 className="h-6 w-6 animate-spin" /> : <MicrofonoIcon className="h-6 w-6" />}
        </span>
      </button>
    </div>
  );
}

/** Le barre della forma d'onda: alte da 3 a 22 px. */
function Onda({ picchi, fatto = 1, classe }: { picchi: number[]; fatto?: number; classe?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex h-6 items-center gap-[2px]", classe)}>
      {picchi.map((p, i) => (
        <span
          key={i}
          className="w-[2.5px] shrink-0 rounded-full bg-current"
          style={{ height: 3 + (p / 9) * 19, opacity: i / picchi.length < fatto ? 1 : 0.35 }}
        />
      ))}
    </span>
  );
}

/**
 * Al posto di allega + campo mentre si registra. Tenendo premuto: il
 * puntino rosso, il tempo e «‹ Scorri per annullare», che segue il dito e
 * sfuma. Bloccato: il cestino, il tempo e la forma d'onda dal vivo (l'invio
 * è la tessera a destra).
 */
export function BarraRegistrazione({
  stato,
  secondi,
  livelli,
  spinta,
  onAnnulla,
}: {
  stato: StatoVocale;
  secondi: number;
  livelli: number[];
  spinta: { dx: number; dy: number };
  onAnnulla: () => void;
}) {
  const tempo = (
    <span className="flex shrink-0 items-center gap-2 text-[15px] tabular-nums text-ink">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" aria-hidden="true" />
      {durataVocale(secondi)}
    </span>
  );
  if (stato === "bloccato") {
    const picchi = livelli.map((l) => Math.round(l * 9));
    return (
      <div className="flex h-12 min-w-0 flex-1 items-center gap-3" aria-live="polite">
        <button
          type="button"
          onClick={onAnnulla}
          aria-label="Butta il vocale"
          className="flex h-12 w-12 shrink-0 items-center justify-center text-ink-soft transition-transform active:scale-90"
        >
          <BidoneIcon className="h-6 w-6" />
        </button>
        {tempo}
        <Onda picchi={picchi} classe="min-w-0 flex-1 justify-end overflow-hidden text-ink-soft" />
      </div>
    );
  }
  const sfuma = 1 - Math.min(1, Math.abs(spinta.dx) / SOGLIA_ANNULLA);
  return (
    <div className="flex h-12 min-w-0 flex-1 items-center gap-3 pl-2" aria-live="polite">
      {tempo}
      <span
        className="min-w-0 flex-1 truncate text-center text-[14px] text-ink-soft"
        style={{ transform: `translateX(${spinta.dx * 0.5}px)`, opacity: 0.35 + 0.65 * sfuma }}
      >
        ‹ Scorri per annullare
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Nella bolla                                                         */
/* ------------------------------------------------------------------ */

/** Un vocale alla volta: chi parte ferma quello che stava suonando. */
let inRiproduzione: HTMLAudioElement | null = null;

/**
 * Il vocale in una bolla: play/pausa, la forma d'onda (che si colora man
 * mano che si ascolta, e si tocca per saltare a un punto) e il tempo.
 * Il bottone è il colore del testo della bolla, con l'icona nel colore della
 * bolla: si legge su tutte e tre (worker, employer, l'altro).
 * Il bottone è un CERCHIO IMPERFETTO (quello degli avatar, §6) col simbolo
 * di play o pausa disegnato da Tommaso dentro (`PlaySimbolo`,
 * `PausaSimbolo`: i buchi dei suoi disegni, nella stessa tavola, quindi
 * restano al loro posto e alla loro misura).
 */
export function VocaleInBolla({
  percorso,
  url,
  inInvio,
  colori,
}: {
  percorso: string;
  url: string | null;
  inInvio: boolean;
  /** Fondo e icona del bottone, per la bolla in cui sta. */
  colori: string;
}) {
  const { secondi, picchi } = leggiVocale(percorso);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [suona, setSuona] = useState(false);
  const [fatto, setFatto] = useState(0);
  const [adesso, setAdesso] = useState(0);
  const [errore, setErrore] = useState(false);
  const giro = useRef(0);
  const cerchio = useCerchioImperfetto<HTMLButtonElement>(percorso);

  const durata = () => {
    const d = audio.current?.duration;
    return d && Number.isFinite(d) ? d : secondi || 1;
  };

  const segui = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    setAdesso(a.currentTime);
    setFatto(Math.min(1, a.currentTime / durata()));
    giro.current = requestAnimationFrame(segui);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prepara = () => {
    if (audio.current || !url) return audio.current;
    const a = new Audio(url);
    a.preload = "auto";
    a.onplay = () => {
      setSuona(true);
      cancelAnimationFrame(giro.current);
      giro.current = requestAnimationFrame(segui);
    };
    a.onpause = () => {
      setSuona(false);
      cancelAnimationFrame(giro.current);
    };
    a.onended = () => {
      setSuona(false);
      setFatto(0);
      setAdesso(0);
      cancelAnimationFrame(giro.current);
    };
    a.onerror = () => {
      console.error("[Politask] vocale non riproducibile", a.error);
      setErrore(true);
      setSuona(false);
    };
    audio.current = a;
    return a;
  };

  const premiPlay = () => {
    const a = prepara();
    if (!a) return;
    if (!a.paused) {
      a.pause();
      return;
    }
    if (inRiproduzione && inRiproduzione !== a) inRiproduzione.pause();
    inRiproduzione = a;
    a.play().catch((e) => {
      console.error("[Politask] play vocale", e);
      if ((e as DOMException)?.name !== "AbortError") setErrore(true);
    });
  };

  const salta = (e: React.MouseEvent<HTMLButtonElement>) => {
    const a = prepara();
    if (!a) return;
    const box = e.currentTarget.getBoundingClientRect();
    const frazione = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    const vai = () => {
      a.currentTime = frazione * durata();
      setFatto(frazione);
      setAdesso(a.currentTime);
    };
    if (a.readyState >= 1) vai();
    else a.addEventListener("loadedmetadata", vai, { once: true });
    if (a.paused) premiPlay();
  };

  // Uscendo dalla chat il vocale si ferma.
  useEffect(
    () => () => {
      cancelAnimationFrame(giro.current);
      audio.current?.pause();
    },
    []
  );

  return (
    <div className="-mx-1 mb-0.5 mt-0.5 flex w-[228px] max-w-full items-center gap-2.5">
      <button
        ref={cerchio.ref}
        style={cerchio.style}
        type="button"
        onClick={premiPlay}
        disabled={!url || errore}
        aria-label={suona ? "Pausa" : "Ascolta il vocale"}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 disabled:opacity-60",
          colori
        )}
      >
        {inInvio || (!url && !errore) ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : suona ? (
          <PausaSimbolo className="h-10 w-10" />
        ) : (
          <PlaySimbolo className="h-10 w-10" />
        )}
      </button>
      <span className="min-w-0 flex-1">
        <button
          type="button"
          onClick={salta}
          disabled={!url || errore}
          aria-label="Vai a un punto del vocale"
          className="block w-full py-1"
        >
          <Onda picchi={picchi} fatto={suona || fatto > 0 ? fatto : 1} />
        </button>
        <span className="block text-[11px] tabular-nums opacity-80">
          {errore
            ? "Non si riesce ad ascoltare su questo telefono"
            : suona || fatto > 0
              ? durataVocale(adesso)
              : durataVocale(secondi)}
        </span>
      </span>
    </div>
  );
}
