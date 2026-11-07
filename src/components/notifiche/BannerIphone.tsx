import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Share } from "lucide-react";
import { XIcon } from "@/components/icons/uiIcons";
import { useAuth } from "@/hooks/useAuth";
import { installata, suIos } from "@/lib/notifiche/canale";
import { TAB_ROUTES } from "@/lib/schede";

const CHIUSO = "politask:banner-iphone-chiuso";

/**
 * «AGGIUNGI A SCHERMATA HOME» — solo su iPhone, finché l'app non è
 * installata. Su iPhone il push del web c'è SOLO per le app aggiunte alla
 * schermata Home: in Safari normale non arriva nessuna notifica, e
 * l'installazione lì non ha un bottone, si fa dal menu Condividi.
 *
 * Sopra la barra in basso, solo nelle pagine con la barra (nei moduli
 * coprirebbe i bottoni). La X lo nasconde fino alla prossima apertura
 * dell'app: ricompare finché non è installata, come chiesto.
 * ⚠️ L'icona Condividi è di lucide: è il simbolo di iOS, ridisegnarlo
 * lo renderebbe irriconoscibile (come i marchi Google e Apple, §8).
 */
export function BannerIphone() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [chiuso, setChiuso] = useState(() => {
    try {
      return sessionStorage.getItem(CHIUSO) === "1";
    } catch {
      return false;
    }
  });
  if (!user || chiuso || !suIos() || installata() || !TAB_ROUTES.includes(pathname)) return null;

  const chiudi = () => {
    setChiuso(true);
    try {
      sessionStorage.setItem(CHIUSO, "1");
    } catch {
      /* niente */
    }
  };

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50">
      <div className="material-card flex items-center gap-3 py-3 pl-4 pr-2">
        <img src="/icons/icona-192-v1.png" alt="" className="h-10 w-10 shrink-0 rounded-[10px]" />
        <p className="min-w-0 flex-1 text-sm leading-snug text-ink">
          <span className="font-semibold">Installa Politask</span> per ricevere le notifiche: tocca{" "}
          <Share className="inline h-4 w-4 -translate-y-0.5" aria-label="Condividi" /> e poi «Aggiungi a schermata Home».
        </p>
        <button
          type="button"
          onClick={chiudi}
          aria-label="Chiudi"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition-transform active:scale-95"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
