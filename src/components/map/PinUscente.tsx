import { memo, useLayoutEffect, useRef } from "react";
import { Marker } from "react-map-gl";
import { GenericoIcon } from "@/components/icons/roleIcons";
import { getJobIconFromTags, iconaComune } from "@/lib/jobIcons";
import { CURVA_PIN, DURATA_PIN, type ElementoMappa } from "@/lib/zoneMappa";
import { PinMappa } from "./PinMappa";
import { NumeroPin } from "./NumeroPin";

interface PinUscenteProps {
  el: ElementoMappa;
  /** Dove va, in px rispetto a dove sta: la zona in cui si unisce. 0,0 = svanisce sul posto. */
  verso: { x: number; y: number };
  isEmployer: boolean;
}

/**
 * L'ALTRA METÀ DELL'ANIMAZIONE — il pin che ESCE di scena cambiando zoom.
 *
 * Prima i pin vecchi sparivano di colpo e animavano solo i nuovi: zoom
 * indietro, i pin svanivano e la zona si gonfiava dal nulla; zoom avanti, la
 * zona svaniva e i pin uscivano da un punto che non c'era più. Tommaso:
 * «scattosa». Ora il pin vecchio resta per la durata dell'animazione:
 * - se si UNISCE a una zona, ci scivola dentro sfumando;
 * - se si DIVIDE, sfuma sul posto mentre i pin nuovi ne escono.
 * Le due metà si incrociano: niente fotogrammi vuoti, niente salti.
 *
 * È solo un disegno (niente tocco), con i colori a riposo del pin che era.
 */
export const PinUscente = memo(function PinUscente({ el, verso, isEmployer }: PinUscenteProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    const dentro = verso.x !== 0 || verso.y !== 0;
    nodo.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: `translate(${verso.x}px, ${verso.y}px) scale(${dentro ? 0.8 : 0.9})`, opacity: 0 },
      ],
      { duration: DURATA_PIN, easing: CURVA_PIN, fill: "forwards" }
    );
  }, [verso.x, verso.y]);

  const jobs = el.tipo === "zona" ? el.annunci : el.gruppo.jobs;
  const icona =
    el.tipo === "zona" ? GenericoIcon : jobs.length === 1 ? getJobIconFromTags(jobs[0].tags) : iconaComune(jobs);
  const conNumero = jobs.length > 1;

  return (
    <Marker longitude={el.lng} latitude={el.lat} anchor="bottom" style={{ pointerEvents: "none" }}>
      <div ref={ref} aria-hidden="true" className="relative" style={{ transformOrigin: "50% 100%" }}>
        {conNumero && <NumeroPin n={jobs.length} isEmployer={isEmployer} />}
        <PinMappa
          icona={icona}
          classeFondo={isEmployer ? "fill-employer-700" : "fill-primary"}
          classeIcona={isEmployer ? "text-employer-foreground" : "text-primary-foreground"}
        />
      </div>
    </Marker>
  );
});
