import { useQuery } from "@tanstack/react-query";
import { cuoriDelWorker } from "@/lib/bacheca";

/**
 * Le candidature di un worker che hanno ricevuto il CUORE dall'employer a
 * lavoro concluso. Pubblico: serve allo storico nel profilo del worker e nel
 * suo profilo pubblico. Viene dalla funzione SQL `cuori_del_worker`, che
 * restituisce solo gli id — paga e accordi del cartellino restano privati.
 */
export function useCuoriWorker(workerId: string | undefined) {
  return useQuery({
    queryKey: ["cartellini", "cuori", workerId],
    queryFn: () => cuoriDelWorker(workerId!),
    enabled: !!workerId,
    retry: false,
  });
}
