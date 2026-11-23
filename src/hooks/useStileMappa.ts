import { useQuery } from "@tanstack/react-query";
import { conOutfit, type StileMappa } from "@/lib/stileMappa";

/** Lo stile di base di tutte le mappe dell'app. */
export const STILE_MAPPA_URL = "mapbox://styles/mapbox/streets-v12";
const STILE_JSON = "https://api.mapbox.com/styles/v1/mapbox/streets-v12";

/**
 * LO STILE DELLA MAPPA CON OUTFIT, UNA VOLTA PER SESSIONE (23 novembre).
 *
 * Lo stile `streets-v12` scaricato come JSON e passato a `conOutfit`
 * (lib/stileMappa.ts). In cache come il token: lo usano tutte e quattro le
 * mappe (grande, minimappa, punto dell'attività, area del privato), e dalla
 * seconda volta non costa niente. La mappa grande si monta sotto lo splash,
 * quindi la prima lettura cade lì.
 *
 * Restituisce:
 * - `null` → sta arrivando (la mappa aspetta, come per il token);
 * - lo stile con Outfit;
 * - se lo scaricamento fallisce (o non arriva in 5 s), l'indirizzo dello stile
 *   normale: la mappa si vede lo stesso, coi caratteri di Mapbox. Mai una
 *   mappa vuota per colpa dei caratteri.
 */
export function useStileMappa(token: string | null): string | StileMappa | null {
  const { data } = useQuery({
    queryKey: ["stile-mappa", token],
    queryFn: async (): Promise<string | StileMappa> => {
      try {
        const risposta = await fetch(`${STILE_JSON}?access_token=${encodeURIComponent(token!)}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!risposta.ok) throw new Error(`stile della mappa: ${risposta.status}`);
        return conOutfit((await risposta.json()) as StileMappa);
      } catch (e) {
        console.warn("[Politask] stile con Outfit non disponibile, mappa coi caratteri di Mapbox", e);
        return STILE_MAPPA_URL;
      }
    },
    enabled: !!token,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });
  if (token === "") return STILE_MAPPA_URL;
  return data ?? null;
}
