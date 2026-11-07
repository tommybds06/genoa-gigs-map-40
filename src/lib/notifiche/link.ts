import type { NavigateFunction } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { apriRecensione } from "@/lib/recensione";
import { toast } from "sonner";
import type { Job } from "@/hooks/useJobs";
import type { Notifica } from "./notifiche";

/**
 * DOVE PORTA UNA NOTIFICA — una sola funzione per il centro notifiche, i
 * toast, il tocco sul push e il link dell'email (`/?notifica=<id>`).
 *
 * `azione` e `riferimento` li scrive il database (migration notifiche):
 *   chat        → la chat (id della chat)
 *   annuncio    → la scheda dell'annuncio sulla mappa (id dell'annuncio)
 *   candidature → Annunci, le candidature di quell'annuncio (id dell'annuncio)
 *   annunci     → Annunci, quell'annuncio (in scadenza, scaduto)
 *   recensione  → la finestra della recensione (id della candidatura)
 *   bacheca     → Messaggi › Bacheca
 *   profilo     → il proprio profilo
 *   verifica    → Modifica profilo (la partita IVA)
 */
export async function apriNotifica(n: Pick<Notifica, "azione" | "riferimento">, navigate: NavigateFunction) {
  const rif = n.riferimento;
  switch (n.azione) {
    case "chat":
      return navigate(rif ? `/messaggi?chat=${rif}` : "/messaggi");
    case "candidature":
    case "annunci":
      return navigate(rif ? `/annunci?annuncio=${rif}` : "/annunci");
    case "bacheca":
      return navigate("/messaggi?vista=bacheca");
    case "profilo":
      return navigate("/profilo");
    case "verifica":
      return navigate("/settings/edit-profile");
    case "annuncio": {
      if (!rif) return navigate("/");
      const { data } = await supabase
        .from("jobs")
        .select("*, profiles(full_name, avatar_url, address_text, photos, tipo_employer, piva_verificata, identita_verificata)")
        .eq("id", rif)
        .maybeSingle();
      if (!data) {
        toast("Questo annuncio non c'è più", { duration: 1900 });
        return navigate("/");
      }
      // Lo stesso giro del ritorno dal profilo (`returnJob` in InteractiveMap).
      return navigate("/", { state: { returnJob: { ...data, tags: data.tags || [] } as unknown as Job } });
    }
    case "recensione": {
      if (!rif) return;
      const { data } = await supabase
        .from("applications")
        .select("id, job_id, applicant_id, status, jobs(title, owner_id, profiles(full_name))")
        .eq("id", rif)
        .maybeSingle();
      const job = data?.jobs as unknown as { title: string; owner_id: string; profiles: { full_name: string | null } | null } | null;
      if (!data || !job) return navigate("/messaggi?vista=bacheca");
      const { count } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("job_id", data.job_id)
        .eq("worker_id", data.applicant_id);
      // Già recensito: la bacheca, dove il lavoro è «Concluso».
      if ((count ?? 0) > 0) return navigate("/messaggi?vista=bacheca");
      return apriRecensione({
        applicationId: data.id,
        jobId: data.job_id,
        employerId: job.owner_id,
        employerName: job.profiles?.full_name || "l'attività",
        jobTitle: job.title,
      });
    }
    default:
      return;
  }
}
