// INVIO DELLE NOTIFICHE: push ed email (5 novembre 2026).
//
// Chi riceve cosa lo decide il database (migration
// 20261105140000_notifiche.sql): la tabella `notifiche` è la posta in uscita.
// Questa funzione la svuota. La chiama il database stesso — subito, con
// pg_net, quando nasce una notifica push, e ogni minuto con pg_cron — con
// l'intestazione `x-politask-chiave` (il segreto INVIO_NOTIFICHE_SEGRETO).
// Non la chiama l'app.
//
// PUSH — per ogni notifica con 'push' nei canali, `mostra_dal` passato e
// `push_inviata_il` vuoto, a ogni dispositivo dell'utente (`iscrizioni_push`):
//   - 'web': Web Push con le chiavi VAPID;
//   - 'despia' (app nativa, quando ci sarà): `inviaDespia`, da scrivere con la
//     loro API. Il resto non cambia.
//   Un dispositivo che risponde 404/410 non esiste più: si cancella.
//
// EMAIL — Resend (https://resend.com). Per le notifiche con `email_dopo`
// passato ed `email_inviata_il` vuoto: scelte e candidature solo se ANCORA
// NON LETTE (sono passate 2 ore), l'esito della verifica sempre. Senza
// RESEND_API_KEY non parte niente e non si segna niente: si manderanno
// quando ci sarà.
//
// Segreti: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
// INVIO_NOTIFICHE_SEGRETO, RESEND_API_KEY, EMAIL_MITTENTE
// (es. «Politask <notifiche@politask.app>»), URL_APP (dove portano i link
// delle email). SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ci sono già.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

interface Notifica {
  id: string;
  utente_id: string;
  tipo: string;
  titolo: string;
  testo: string;
  chiave: string | null;
}

interface Iscrizione {
  id: string;
  piattaforma: "web" | "despia";
  endpoint: string;
  p256dh: string | null;
  auth: string | null;
}

const env = (k: string) => Deno.env.get(k) ?? "";

/** L'app nativa (Despia): da scrivere quando ci sarà. Stessa forma del web. */
async function inviaDespia(_iscrizione: Iscrizione, _n: Notifica): Promise<"ok" | "sparita"> {
  console.log("[invia-notifiche] push Despia non ancora collegato");
  return "ok";
}

async function inviaWeb(i: Iscrizione, n: Notifica): Promise<"ok" | "sparita"> {
  try {
    await webpush.sendNotification(
      { endpoint: i.endpoint, keys: { p256dh: i.p256dh ?? "", auth: i.auth ?? "" } },
      JSON.stringify({
        titolo: n.titolo,
        testo: n.testo,
        notifica: n.id,
        // Stessa chiave = la notifica raggruppata SOSTITUISCE quella di prima
        // sul telefono («3 nuovi messaggi» al posto di «2»).
        tag: n.chiave ?? n.id,
      }),
      { TTL: 60 * 60 * 24 }
    );
    return "ok";
  } catch (e) {
    const stato = (e as { statusCode?: number }).statusCode;
    if (stato === 404 || stato === 410) return "sparita";
    console.error("[invia-notifiche] push fallito", stato, (e as Error).message);
    return "ok";
  }
}

const TESTI_EMAIL: Record<string, string> = {
  scelto: "Apri Politask per vedere i dettagli e scrivere in chat.",
  candidatura: "Apri Politask per vedere chi si è candidato.",
  verifica_piva: "Apri Politask per vedere il tuo profilo.",
};

async function inviaEmail(a: ReturnType<typeof createClient>, n: Notifica): Promise<boolean> {
  const chiave = env("RESEND_API_KEY");
  if (!chiave) return false;
  const { data } = await a.auth.admin.getUserById(n.utente_id);
  const indirizzo = data?.user?.email;
  if (!indirizzo) return true; // niente email: la si dà per fatta
  const link = `${env("URL_APP") || "https://politask.app"}/?notifica=${n.id}`;
  const html = `<div style="font-family:Arial,sans-serif;color:#382D24;max-width:480px">
    <p style="font-size:18px;font-weight:bold;margin:0 0 8px">${n.titolo}</p>
    <p style="margin:0 0 16px">${n.testo}</p>
    <p style="margin:0 0 20px">${TESTI_EMAIL[n.tipo] ?? ""}</p>
    <a href="${link}" style="background:#355D8D;color:#FAF5E9;padding:12px 20px;border-radius:12px;text-decoration:none">Apri Politask</a>
    <p style="font-size:12px;color:#746759;margin-top:24px">Puoi scegliere quali avvisi ricevere nelle Impostazioni dell'app.</p>
  </div>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chiave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env("EMAIL_MITTENTE"), to: indirizzo, subject: n.titolo, html }),
  });
  if (!r.ok) console.error("[invia-notifiche] email fallita", r.status, await r.text());
  return r.ok;
}

Deno.serve(async (req) => {
  if (!env("INVIO_NOTIFICHE_SEGRETO") || req.headers.get("x-politask-chiave") !== env("INVIO_NOTIFICHE_SEGRETO")) {
    return new Response("non autorizzato", { status: 401 });
  }
  const a = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  const adesso = new Date().toISOString();
  const ieri = new Date(Date.now() - 24 * 3600_000).toISOString();
  let push = 0;
  let email = 0;

  // ---- PUSH ----
  if (env("VAPID_PRIVATE_KEY")) {
    webpush.setVapidDetails(env("VAPID_SUBJECT"), env("VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"));
    const { data: daMandare } = await a
      .from("notifiche")
      .select("id, utente_id, tipo, titolo, testo, chiave")
      .contains("canali", ["push"])
      .is("push_inviata_il", null)
      .lte("mostra_dal", adesso)
      .gte("aggiornata_il", ieri) // una notifica di ieri non si manda più
      .limit(200);
    for (const n of (daMandare ?? []) as Notifica[]) {
      const { data: dispositivi } = await a
        .from("iscrizioni_push")
        .select("id, piattaforma, endpoint, p256dh, auth")
        .eq("utente_id", n.utente_id);
      for (const i of (dispositivi ?? []) as Iscrizione[]) {
        const esito = i.piattaforma === "despia" ? await inviaDespia(i, n) : await inviaWeb(i, n);
        if (esito === "sparita") await a.from("iscrizioni_push").delete().eq("id", i.id);
        else push++;
      }
      await a.from("notifiche").update({ push_inviata_il: adesso }).eq("id", n.id);
    }
  }

  // ---- EMAIL ----
  const { data: email_ } = await a
    .from("notifiche")
    .select("id, utente_id, tipo, titolo, testo, chiave, letta_il")
    .lte("email_dopo", adesso)
    .is("email_inviata_il", null)
    .limit(50);
  for (const n of (email_ ?? []) as (Notifica & { letta_il: string | null })[]) {
    // Scelte e candidature: se l'ha già letta nell'app, l'email non serve.
    if (n.letta_il && n.tipo !== "verifica_piva") {
      await a.from("notifiche").update({ email_inviata_il: adesso, email_dopo: null }).eq("id", n.id);
      continue;
    }
    if (await inviaEmail(a, n)) {
      await a.from("notifiche").update({ email_inviata_il: adesso }).eq("id", n.id);
      email++;
    }
  }

  return new Response(JSON.stringify({ push, email }), { headers: { "Content-Type": "application/json" } });
});
