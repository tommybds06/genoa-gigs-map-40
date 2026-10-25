// VERIFICA DELLA PARTITA IVA con VIES, il servizio europeo (24 ottobre 2026).
//
// Chiamata dall'app con il token dell'utente: { partita_iva: "01234567890" }.
// Risponde { esito: "valida" | "non_valida" | "formato" | "gia_usata" |
// "servizio" | "non_attivita", nome? }.
//
// - Il badge «Attività verificata» lo accende SOLO questa funzione, con la
//   chiave di servizio: i trigger del database impediscono all'utente di
//   scriverselo (migration 20261024120000_attivita_privato.sql).
// - VIES dice che la partita IVA ESISTE ed è attiva, non che appartiene a
//   chi la inserisce. Per questo: una partita IVA verificata su un account
//   non verifica un secondo account, e il nome registrato su VIES si salva
//   (in `profili_riservati`, privato) per i controlli a mano.
// - VIES a volte non risponde (un paese è giù, troppe richieste): si dice
//   «riprova più tardi», non «non valida».

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const risposta = (corpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** 11 cifre e la cifra di controllo della partita IVA italiana. */
function formatoValido(piva: string): boolean {
  if (!/^\d{11}$/.test(piva)) return false;
  let somma = 0;
  for (let i = 0; i < 10; i++) {
    let c = Number(piva[i]);
    if (i % 2 === 1) {
      c *= 2;
      if (c > 9) c -= 9;
    }
    somma += c;
  }
  return (10 - (somma % 10)) % 10 === Number(piva[10]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const autorizzazione = req.headers.get("Authorization");
    if (!autorizzazione) return risposta({ errore: "non_autenticato" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonima = Deno.env.get("SUPABASE_ANON_KEY")!;
    const servizio = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const comeUtente = createClient(url, anonima, { global: { headers: { Authorization: autorizzazione } } });
    const { data: { user } } = await comeUtente.auth.getUser();
    if (!user) return risposta({ errore: "non_autenticato" }, 401);

    const corpo = await req.json().catch(() => ({}));
    const piva = String(corpo.partita_iva ?? "").replace(/\s/g, "").replace(/^IT/i, "");
    if (!formatoValido(piva)) return risposta({ esito: "formato" });

    const admin = createClient(url, servizio);

    const { data: profilo } = await admin
      .from("profiles")
      .select("role, tipo_employer")
      .eq("id", user.id)
      .maybeSingle();
    if (profilo?.role !== "employer" || profilo?.tipo_employer !== "attivita") {
      return risposta({ esito: "non_attivita" }, 403);
    }

    // Già verificata su un ALTRO account?
    const { data: altri } = await admin
      .from("profili_riservati")
      .select("id, profiles!inner(piva_verificata)")
      .eq("partita_iva", piva)
      .neq("id", user.id)
      .eq("profiles.piva_verificata", true)
      .limit(1);
    if (altri && altri.length > 0) return risposta({ esito: "gia_usata" });

    let vies: { valid?: boolean; name?: string } | null = null;
    try {
      const r = await fetch("https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: "IT", vatNumber: piva }),
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) vies = await r.json();
    } catch (_) {
      vies = null;
    }
    if (!vies || typeof vies.valid !== "boolean") return risposta({ esito: "servizio" });

    const nome = vies.name && vies.name !== "---" ? vies.name.trim() : null;

    await admin
      .from("profili_riservati")
      .upsert({ id: user.id, partita_iva: piva, piva_nome_vies: nome }, { onConflict: "id" });

    await admin
      .from("profiles")
      .update(
        vies.valid
          ? { piva_verificata: true, piva_verificata_il: new Date().toISOString() }
          : { piva_verificata: false, piva_verificata_il: null }
      )
      .eq("id", user.id);

    return risposta({ esito: vies.valid ? "valida" : "non_valida", nome });
  } catch (error: unknown) {
    const messaggio = error instanceof Error ? error.message : "errore";
    return risposta({ errore: messaggio }, 500);
  }
});
