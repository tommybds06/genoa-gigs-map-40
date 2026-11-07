import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Le categorie delle preferenze (tabella `preferenze_notifiche`). */
export type CategoriaNotifiche = "candidature" | "messaggi" | "vicini" | "scadenze" | "promemoria";
export type PreferenzeNotifiche = Record<CategoriaNotifiche, boolean>;

/** Di serie: tutto acceso tranne i promemoria (uguale al database: una riga
 *  che manca vale questi valori). */
export const PREFERENZE_DI_SERIE: PreferenzeNotifiche = {
  candidature: true,
  messaggi: true,
  vicini: true,
  scadenze: true,
  promemoria: false,
};

export function usePreferenzeNotifiche() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const chiave = ["preferenze-notifiche", user?.id];

  const q = useQuery({
    queryKey: chiave,
    enabled: !!user,
    queryFn: async (): Promise<PreferenzeNotifiche> => {
      const { data, error } = await supabase
        .from("preferenze_notifiche")
        .select("candidature, messaggi, vicini, scadenze, promemoria")
        .eq("utente_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return { ...PREFERENZE_DI_SERIE, ...(data ?? {}) };
    },
  });

  const preferenze = q.data ?? PREFERENZE_DI_SERIE;

  /** Subito a schermo; se il salvataggio fallisce si torna indietro. */
  const cambia = async (categoria: CategoriaNotifiche, acceso: boolean) => {
    if (!user) return;
    const prima = preferenze;
    const dopo = { ...prima, [categoria]: acceso };
    qc.setQueryData(chiave, dopo);
    const { error } = await supabase
      .from("preferenze_notifiche")
      .upsert({ utente_id: user.id, ...dopo, aggiornate_il: new Date().toISOString() }, { onConflict: "utente_id" });
    if (error) {
      qc.setQueryData(chiave, prima);
      toast.error("Non sono riuscito a salvare la scelta", { duration: 1900 });
    }
  };

  return { preferenze, caricate: q.isFetched, cambia };
}
