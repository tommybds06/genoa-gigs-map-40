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

// Con l'app IN VISTA l'avviso lo dà l'app stessa (toast col tempo reale).
// Ma OGNI push deve mostrare una notifica di sistema: se non la mostriamo
// noi, Chrome ne mette una sua — «Questo sito è stato aggiornato in
// background», col logo di Chrome, silenziosa e senza testo (Tommaso, 7
// novembre: «notifiche silenziose con il logo di Chrome»). Chrome la
// risparmia solo se il sito è la scheda attiva e visibile; sul telefono,
// con l'app aperta dalla schermata Home, non la riconosce come tale.
//
// Quindi:
// - Android: SEMPRE la nostra. Con l'app in vista SILENZIOSA, e l'app la
//   toglie appena dopo (GestoreNotifiche), quando c'è già il toast.
// - Safari (iPhone, Mac): SEMPRE, normale: toglie l'iscrizione a chi riceve
//   push senza mostrarli.
// - Chrome sul computer: con la scheda in vista niente (lì l'eccezione di
//   Chrome funziona), solo il toast.
// - La PROVA da Impostazioni (`prova`): sempre, normale, anche in vista: è
//   lì apposta per vedere la notifica vera.
//
// ⚠️ «IN VISTA» LO DICE LA PAGINA, NON `visibilityState` (11 novembre).
// Tommaso: «non arrivano proprio mai». Una delle cause possibili (NON
// verificata sul telefono): lo stato che il service worker legge da
// `clients.matchAll()` può non essere aggiornato per una pagina messa in
// background e congelata da Android. Se risulta ancora «visible», la
// notifica parte silenziosa e l'app la toglie: per chi guarda, non arriva.
// Comunque sia, la fonte giusta è la pagina stessa: si CHIEDE
// (`sei-in-vista`, risponde GestoreNotifiche). Una pagina congelata non può
// rispondere, e senza risposta in 400 ms vale «non in vista».
const ua = self.navigator.userAgent;
// Safari, anche su Mac (ha la stessa regola); Chrome e gli altri no.
const suSafari = /iPhone|iPad|iPod/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Android|Edg/.test(ua));
const suAndroid = /Android/.test(ua);

/** Le finestre dell'app che rispondono «sono in vista», entro 400 ms. */
async function finestreInVista() {
  const finestre = (await self.clients.matchAll({ type: "window", includeUncontrolled: true })).filter(
    (f) => new URL(f.url).origin === self.location.origin
  );
  const risposte = await Promise.all(
    finestre.map(
      (f) =>
        new Promise((fatto) => {
          const canale = new MessageChannel();
          const scaduto = setTimeout(() => fatto(false), 400);
          canale.port1.onmessage = (e) => {
            clearTimeout(scaduto);
            fatto(Boolean(e.data && e.data.inVista));
          };
          try {
            f.postMessage({ tipo: "sei-in-vista" }, [canale.port2]);
          } catch {
            clearTimeout(scaduto);
            fatto(false);
          }
        })
    )
  );
  return finestre.filter((_, i) => risposte[i]);
}

async function mostra(d) {
  const inVista = await finestreInVista();
  const tag = d.tag || d.notifica || "politask";
  const prova = Boolean(d.prova);
  inVista.forEach((f) => f.postMessage({ tipo: "notifica-arrivata", notifica: d.notifica || null, tag }));
  if (inVista.length > 0 && !prova && !suSafari && !suAndroid) return;
  const silenziosa = inVista.length > 0 && !prova && !suSafari;
  return self.registration.showNotification(d.titolo || "Politask", {
    body: d.testo || "",
    tag,
    // Stesso tag = sostituisce quella di prima; «renotify» la fa suonare di nuovo.
    renotify: !silenziosa,
    silent: silenziosa,
    icon: "/icons/icona-192-v2.png",
    badge: "/icons/badge-96-v2.png",
    lang: "it",
    timestamp: Date.now(),
    data: { notifica: d.notifica || null, inVista: silenziosa },
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
