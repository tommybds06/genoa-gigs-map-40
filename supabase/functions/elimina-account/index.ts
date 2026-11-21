// ELIMINARE L'ACCOUNT (21 novembre 2026).
//
// Chiamata dall'app con il token dell'utente, senza corpo. Risponde
// { ok: true } oppure { errore: "<passo>" } con lo stato HTTP.
//
// L'ordine (migration 20261121120000_elimina_account.sql):
//   1. `elimina_dati_account` svuota l'account e lascia la LAPIDE del
//      profilo («Account eliminato»): chat e recensioni restano, anonime.
//   2. Le foto del profilo si tolgono dallo Storage. Dalle API: il database
//      non può cancellare i file. Gli allegati della chat NO: fanno parte
//      della conversazione dell'altra persona, come i messaggi.
//   3. L'utente di auth si cancella: da qui non si entra più, e la stessa
//      email può iscriversi di nuovo come account nuovo.
// Ogni passo è rieseguibile: se uno fallisce, l'app può riprovare.

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const autorizzazione = req.headers.get("Authorization");
  if (!autorizzazione) return risposta({ errore: "non_autenticato" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonima = Deno.env.get("SUPABASE_ANON_KEY")!;
  const servizio = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const comeUtente = createClient(url, anonima, { global: { headers: { Authorization: autorizzazione } } });
  const { data: { user } } = await comeUtente.auth.getUser();
  if (!user) return risposta({ errore: "non_autenticato" }, 401);

  const admin = createClient(url, servizio);

  // 1. I dati, e la lapide.
  const { error: erroreDati } = await admin.rpc("elimina_dati_account", { p_utente: user.id });
  if (erroreDati) {
    console.error("[elimina-account] dati", user.id, erroreDati);
    return risposta({ errore: "dati" }, 500);
  }

  // 2. Le foto del profilo: stanno in `profile-photos/<id utente>/…`.
  //    Un errore qui non ferma il resto (le foto non sono più collegate a
  //    niente), ma si scrive nel registro per toglierle a mano.
  try {
    const cartella = user.id;
    for (;;) {
      const { data: file, error } = await admin.storage.from("profile-photos").list(cartella, { limit: 100 });
      if (error) throw error;
      if (!file || file.length === 0) break;
      const { error: erroreTogli } = await admin.storage
        .from("profile-photos")
        .remove(file.map((f) => `${cartella}/${f.name}`));
      if (erroreTogli) throw erroreTogli;
      if (file.length < 100) break;
    }
  } catch (e) {
    console.error("[elimina-account] foto non tolte", user.id, e);
  }

  // 3. L'utente: da qui l'accesso non c'è più.
  const { error: erroreUtente } = await admin.auth.admin.deleteUser(user.id);
  if (erroreUtente) {
    console.error("[elimina-account] utente", user.id, erroreUtente);
    return risposta({ errore: "utente" }, 500);
  }

  return risposta({ ok: true });
});
