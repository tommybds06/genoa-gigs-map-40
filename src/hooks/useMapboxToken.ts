import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * IL TOKEN MAPBOX, CHIESTO UNA VOLTA SOLA PER SESSIONE.
 *
 * ⚠️ Prima lo chiedevano `InteractiveMap` e `LocationMiniMap`, ognuno per conto
 * suo, dentro un `useEffect` senza cache. Siccome `PageTransition` smonta e
 * rimonta la pagina a ogni cambio di tab, ogni ritorno sulla home faceva
 * ripartire da zero l'invocazione della edge function `get-mapbox-token`: una
 * chiamata di rete **prima** che la mappa potesse cominciare a disegnarsi.
 * Da lì il quadrato grigio con «Caricamento mappa...» che compariva ogni volta
 * anche se la mappa l'avevi appena vista.
 *
 * Con react-query il token sta in cache: la prima volta si paga il giro di
 * rete, dalla seconda in poi la mappa parte nello stesso fotogramma.
 *
 * `staleTime: Infinity` perché il token non cambia durante una sessione, e
 * `retry: false` perché se la edge function non risponde vogliamo cadere
 * subito sul ripiego invece di far aspettare l'utente tre tentativi.
 */
export function useMapboxToken() {
  const { data, isLoading } = useQuery({
    queryKey: ["mapbox-token"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-mapbox-token");
      if (error) throw error;
      return (data?.token as string) || "";
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  /* Si mantiene il contratto che avevano i due componenti:
     null = sto ancora aspettando · "" = niente token, si va di ripiego. */
  return isLoading ? null : data ?? "";
}
