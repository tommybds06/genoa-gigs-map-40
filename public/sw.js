/* IL SERVICE WORKER DI POLITASK (5 novembre 2026) — solo le notifiche.
 *
 * Niente cache, niente gestione delle richieste (nessun evento `fetch`): la
 * app si scarica sempre fresca come prima. Chrome non lo chiede più per
 * rendere l'app installabile; e un service worker che mette in cache è il
 * modo più sicuro di far vedere a qualcuno una versione vecchia per giorni.
 *
 * - `push`: il server (edge function `invia-notifiche`) manda
 *   { titolo, testo, notifica, tag }. Stesso `tag` = la notifica raggruppata
 *   prende il posto di quella di prima («3 nuovi messaggi» al posto di «2»).
 * - `notificationclick`: se l'app è già aperta le si dice quale notifica è
 *   stata toccata (la porta lei alla schermata giusta), se no la si apre su
 *   `/?notifica=<id>`.
 *
 * ⚠️ Se cambia, il browser lo riscarica da solo (lo confronta byte per byte):
 * non serve rinominarlo, a differenza degli asset.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { titolo: "Politask", testo: e.data ? e.data.text() : "" }; }
  e.waitUntil(mostra(d));
});

// Con l'app IN VISTA niente notifica di sistema: la mostra l'app stessa
// (toast col tempo reale), e due avvisi per la stessa cosa sono rumore.
// Chrome lo permette: la regola «ogni push mostra una notifica» non vale
// se una pagina del sito è in primo piano.
// ⚠️ Su Safari (iPhone) invece SEMPRE: toglie l'iscrizione a chi riceve
// push senza mostrarli.
const ua = self.navigator.userAgent;
// Safari, anche su Mac (ha la stessa regola); Chrome e gli altri no.
const suSafari = /iPhone|iPad|iPod/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Android|Edg/.test(ua));
async function mostra(d) {
  const finestre = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const inVista = finestre.filter((f) => f.visibilityState === "visible" && new URL(f.url).origin === self.location.origin);
  if (inVista.length > 0 && !suSafari) {
    inVista.forEach((f) => f.postMessage({ tipo: "notifica-arrivata", notifica: d.notifica || null }));
    return;
  }
  return self.registration.showNotification(d.titolo || "Politask", {
    body: d.testo || "",
    tag: d.tag || d.notifica || undefined,
    renotify: Boolean(d.tag),
    icon: "/icons/icona-192-v2.png",
    badge: "/icons/badge-96-v2.png",
    lang: "it",
    data: { notifica: d.notifica || null },
  });
}

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const id = e.notification.data && e.notification.data.notifica;
  const url = id ? `/?notifica=${id}` : "/";
  e.waitUntil(
    (async () => {
      const finestre = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const f of finestre) {
        if (new URL(f.url).origin !== self.location.origin) continue;
        await f.focus();
        f.postMessage({ tipo: "notifica-toccata", notifica: id });
        return;
      }
      await self.clients.openWindow(url);
    })()
  );
});
