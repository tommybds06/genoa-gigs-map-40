import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CAMPI_NOTIFICA, chiaveNotifiche, segnaLette, type Notifica } from "@/lib/notifiche/notifiche";

/**
 * IL CENTRO NOTIFICHE — le ultime 100, lette e non lette, e quante non lette
 * (la campanella). Una lettura sola per campanella ed elenco.
 *
 * Si aggiorna da sé: il tempo reale lo tiene `GestoreNotifiche` (scrive in
 * questa cache), e ogni 5 minuti si rilegge — le notifiche rimandate dalla
 * fascia di silenzio diventano leggibili alle 7 (RLS: `mostra_dal <= now()`)
 * senza che il tempo reale lo dica a nessuno.
 */
export function useNotifiche() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const chiave = chiaveNotifiche(user?.id);

  const q = useQuery({
    queryKey: chiave,
    enabled: !!user,
    refetchInterval: 5 * 60_000,
    queryFn: async (): Promise<Notifica[]> => {
      const { data, error } = await supabase
        .from("notifiche")
        .select(CAMPI_NOTIFICA)
        .eq("utente_id", user!.id)
        // La prova da Impostazioni è solo un push: nel centro non c'è.
        .neq("tipo", "prova")
        .order("aggiornata_il", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Notifica[];
    },
  });

  const notifiche = q.data ?? [];
  const nonLette = notifiche.filter((n) => !n.letta_il).length;

  /** Segnate subito nella cache (la campanella si spegne al tocco), poi nel
   *  database; se fallisce, alla prossima lettura tornano com'erano. */
  const segna = (ids: string[]) => {
    if (ids.length === 0) return;
    const adesso = new Date().toISOString();
    qc.setQueryData<Notifica[]>(chiave, (v) => v?.map((n) => (ids.includes(n.id) && !n.letta_il ? { ...n, letta_il: adesso } : n)));
    segnaLette(ids);
  };

  return {
    notifiche,
    nonLette,
    caricate: q.isFetched,
    segnaLetta: (id: string) => segna([id]),
    segnaTutteLette: () => segna(notifiche.filter((n) => !n.letta_il).map((n) => n.id)),
  };
}
