import { useQuery, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SocialLinks } from "@/contexts/UserContext";
import { adessoISO } from "@/lib/scadenzaAnnunci";

export interface ProfiloPubblico {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  address_text: string | null;
  neighborhood: string | null;
  role: "worker" | "employer";
  photos: string[];
  looking_for: string | null;
  experience: string | null;
  social_links?: SocialLinks | null;
  tipo_employer?: "attivita" | "privato" | null;
  piva_verificata?: boolean;
  identita_verificata?: boolean;
}

export interface LavoroConcluso {
  id: string;
  applicationId: string;
  title: string;
  employerName: string;
  completedAt: string;
  tags: string[];
}

export interface AnnuncioPubblico {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  category: string | null;
  schedule: string | null;
  neighborhood: string | null;
  created_at: string;
  tags: string[];
}

export interface DatiProfiloPubblico {
  profilo: ProfiloPubblico | null;
  annunci: AnnuncioPubblico[];
  conclusi: LavoroConcluso[];
}

const chiave = (userId: string | undefined) => ["profilo-pubblico", userId] as const;

/**
 * IL PROFILO PUBBLICO (3 novembre), in react-query.
 *
 * ⚠️ Prima era uno `useEffect` senza cache con TRE letture in fila (profilo,
 * poi annunci o storico secondo il ruolo): a ogni apertura lo scheletro, e
 * con una rete da 200 ms di latenza ~0,6 s prima di vedere qualcosa. Ora:
 * - le tre letture partono INSIEME: annunci e storico non dipendono dal
 *   profilo se non per il ruolo, e una lettura vuota in più costa meno di
 *   due giri di rete in fila;
 * - il risultato sta in cache: riaprire lo stesso profilo è immediato;
 * - la scheda di un annuncio lo PRECARICA appena si apre
 *   (`precaricaProfiloPubblico`), così chi tocca «chi lo offre» lo trova già.
 */
async function leggi(userId: string): Promise<DatiProfiloPubblico> {
  const [profiloR, annunciR, conclusiR] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    // Gli annunci attivi: aperti e non scaduti (lib/scadenzaAnnunci.ts).
    supabase
      .from("jobs")
      .select("*")
      .eq("owner_id", userId)
      .eq("status", "open")
      .gt("scade_il", adessoISO())
      .order("created_at", { ascending: false }),
    supabase
      .from("applications")
      .select(`
        id,
        updated_at,
        job_id,
        jobs (
          id,
          title,
          tags,
          owner_id,
          profiles!jobs_owner_id_fkey (
            full_name
          )
        )
      `)
      .eq("applicant_id", userId)
      .eq("status", "completed")
      .order("updated_at", { ascending: false }),
  ]);
  if (profiloR.error) throw profiloR.error;
  const p = profiloR.data;
  if (!p) return { profilo: null, annunci: [], conclusi: [] };

  const profilo: ProfiloPubblico = {
    ...p,
    photos: p.photos || [],
    social_links: p.social_links as SocialLinks | null,
    tipo_employer: p.tipo_employer as ProfiloPubblico["tipo_employer"],
  } as ProfiloPubblico;

  const annunci =
    profilo.role === "employer" && !annunciR.error
      ? (annunciR.data || []).map((j) => ({ ...j, tags: j.tags || [] }) as AnnuncioPubblico)
      : [];

  type RigaConclusa = {
    id: string;
    updated_at: string;
    job_id: string;
    jobs: { id: string; title: string; tags: string[] | null; profiles: { full_name: string | null } | null } | null;
  };
  const conclusi =
    profilo.role === "worker" && !conclusiR.error
      ? ((conclusiR.data || []) as unknown as RigaConclusa[]).map((app) => ({
          id: app.jobs?.id || app.job_id,
          applicationId: app.id,
          title: app.jobs?.title || "Lavoro",
          employerName: app.jobs?.profiles?.full_name || "Attività",
          completedAt: app.updated_at,
          tags: app.jobs?.tags || [],
        }))
      : [];

  return { profilo, annunci, conclusi };
}

export function useProfiloPubblico(userId: string | undefined) {
  return useQuery({
    queryKey: chiave(userId),
    queryFn: () => leggi(userId!),
    enabled: !!userId,
  });
}

/** Da chiamare quando è probabile che il profilo si apra (la scheda di un
 *  annuncio): se è già in cache e fresco, non fa niente. */
export function precaricaProfiloPubblico(queryClient: QueryClient, userId: string | null | undefined) {
  if (!userId) return;
  queryClient.prefetchQuery({ queryKey: chiave(userId), queryFn: () => leggi(userId) });
}
