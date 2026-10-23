import { memo } from "react";
import { Marker } from "react-map-gl";
import { cn } from "@/lib/utils";
import { GenericoIcon } from "@/components/icons/roleIcons";
import { PinMappa } from "./PinMappa";
import { NumeroPin } from "./NumeroPin";
import { IngressoPin, type Ingresso } from "./IngressoPin";

interface ZonaMarkerProps {
  chiave: string;
  lat: number;
  lng: number;
  n: number;
  isEmployer: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isSearchActive?: boolean;
  ingresso?: Ingresso;
  onMarkerClick: (chiave: string) => void;
}

/**
 * IL PIN DI UNA ZONA — più annunci vicini, a questo zoom, in un pin solo.
 * Icona: la VALIGETTA (`GenericoIcon`), perché dentro ci sono mestieri
 * diversi e sceglierne uno direbbe una cosa falsa. Sopra, quanti annunci.
 * Stessi colori e stati dei pin singoli. Toccandolo si apre la lista.
 */
export const ZonaMarker = memo(function ZonaMarker({
  chiave,
  lat,
  lng,
  n,
  isEmployer,
  isHighlighted = false,
  isDimmed = false,
  isSearchActive = false,
  ingresso,
  onMarkerClick,
}: ZonaMarkerProps) {
  return (
    <Marker
      longitude={lng}
      latitude={lat}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onMarkerClick(chiave);
      }}
    >
      <IngressoPin da={ingresso}>
        <button
          aria-label={`${n} annunci in questa zona`}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center transition-all duration-300 ease-out touch-feedback",
            isHighlighted && "z-10 scale-125",
            isDimmed && "scale-90 opacity-30",
            !isSearchActive && "hover:scale-110"
          )}
        >
          <NumeroPin n={n} isEmployer={isEmployer} />
          <PinMappa
            icona={GenericoIcon}
            classeFondo={isHighlighted ? "fill-card" : isEmployer ? "fill-employer-700" : "fill-primary"}
            classeContorno={isHighlighted ? (isEmployer ? "stroke-employer-800" : "stroke-primary-strong") : undefined}
            classeIcona={
              isHighlighted
                ? isEmployer
                  ? "text-employer-800"
                  : "text-primary-strong"
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
