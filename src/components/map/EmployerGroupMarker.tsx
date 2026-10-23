import { memo, useMemo } from "react";
import { Marker } from "react-map-gl";
import { cn } from "@/lib/utils";
import { iconaComune } from "@/lib/jobIcons";
import { Job } from "@/hooks/useJobs";
import { PinMappa } from "./PinMappa";
import { NumeroPin } from "./NumeroPin";
import { IngressoPin, type Ingresso } from "./IngressoPin";

interface EmployerGroupMarkerProps {
  employerId: string;
  jobs: Job[];
  lat: number;
  lng: number;
  isEmployer: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isSearchActive?: boolean;
  /** Da dove arriva quando compare cambiando zoom (vedi IngressoPin). */
  ingresso?: Ingresso;
  onMarkerClick: (employerId: string, jobs: Job[]) => void;
}

export const EmployerGroupMarker = memo(function EmployerGroupMarker({
  employerId,
  jobs,
  lat,
  lng,
  isEmployer,
  isHighlighted = false,
  isDimmed = false,
  isSearchActive = false,
  ingresso,
  onMarkerClick,
}: EmployerGroupMarkerProps) {
  const count = jobs.length;

  /**
   * ⚠️ Qui c'era la `Briefcase` di lucide — l'ultima icona di libreria rimasta
   * sulla mappa, accanto ai marker singoli che usano già il set nostro. Un
   * simbolo che cambia disegno a seconda di quanti annunci ha il locale non è
   * più un simbolo.
   *
   * Se i lavori del gruppo sono tutti dello stesso mestiere si mostra quella
   * icona (due turni da cameriere restano «cameriere»); se sono mischiati si
   * usa il generico, perché sceglierne una a caso direbbe una cosa falsa.
   */
  const Icona = useMemo(() => iconaComune(jobs), [jobs]);

  return (
    <Marker
      longitude={lng}
      latitude={lat}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onMarkerClick(employerId, jobs);
      }}
    >
      <IngressoPin da={ingresso}>
      <button 
        className={cn(
          "group flex flex-col items-center cursor-pointer transition-all duration-300 ease-out touch-feedback relative",
          isHighlighted && "scale-125 z-10",
          isDimmed && "opacity-30 scale-90",
          !isSearchActive && "hover:scale-110"
        )}
      >
        {/* Il numero in Shinjo, lo stesso delle zone: un numero sopra un pin
            vuol dire sempre «N annunci». */}
        <NumeroPin n={count} isEmployer={isEmployer} />

        {/* Stesso pin disegnato dei marker singoli (lib/formaPin.ts), stessi colori. */}
        <PinMappa
          icona={Icona}
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
