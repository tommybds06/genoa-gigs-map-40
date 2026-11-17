// L'ATLANTE — tutte le schermate, per la revisione di Tommaso.
// node brand/scatta-atlante.mjs [filtro]   (banco montato: banco.sh su; server di sviluppo su 8080)
// Telefono: 390×844 a 2,625 (il Pixel 9a), JPEG. Le pagine lunghe in più parti.
import { chromium } from "/Users/tommasobruschidesimone/Downloads/POLITASK/POLITASK.ASSET/node_modules/playwright/index.mjs";
import fs from "node:fs";

const OGGI = (() => { const x = new Date(); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; })();
const OUT = `/Users/tommasobruschidesimone/Downloads/POLITASK/POLITASK.ASSET/atlante/${OGGI}`;
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://127.0.0.1:8080/guida.html";
const MAREA = "9d1da000-0000-4000-a000-000000000001";
const MARCO = "9d1da000-0000-4000-c000-000000000001";
const u = (q) => `${BASE}?${new URLSearchParams(q)}`;
const attesa = (ms) => new Promise((r) => setTimeout(r, ms));
const FILTRO = process.argv[2] ?? "";
const indice = [];

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

async function telefono(svuota = []) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true,
    locale: "it-IT", timezoneId: "Europe/Rome",
    geolocation: { latitude: 44.4006, longitude: 8.9466 }, permissions: ["geolocation"],
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 9a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
  });
  // Lo splash di oggi è «già visto»: se no le pagine aspettano lui (lib/splash.ts).
  await ctx.addInitScript((oggi) => { const d = new Date(); try { localStorage.setItem("politask.splash-visto-il", `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`); } catch {} }, OGGI);
  // Stati VUOTI: il banco non ha permessi per riga, quindi si svuotano le
  // tabelle finte nel momento in cui il banco le espone (prima di ogni lettura).
  if (svuota.length) await ctx.addInitScript((tabelle) => {
    let db; Object.defineProperty(window, "__db", { configurable: true, get: () => db, set: (v) => { for (const t of tabelle) if (Array.isArray(v[t])) v[t].length = 0; db = v; } });
  }, svuota);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("  [errore pagina]", e.message.slice(0, 160)));
  return { ctx, page };
}

/** Il contenitore che scorre (il più alto fra quelli scorrevoli e visibili). */
const trovaScorrevole = (page) => page.evaluate(() => {
  const els = [...document.querySelectorAll("*")].filter((e) => {
    const s = getComputedStyle(e); if (!/(auto|scroll)/.test(s.overflowY)) return false;
    const r = e.getBoundingClientRect(); if (r.width < 200 || r.height < 200 || s.visibility === "hidden") return false;
    // dentro una scheda aperta, se c'è
    return e.scrollHeight - e.clientHeight > 40;
  });
  const drawer = els.filter((e) => e.closest("[data-vaul-drawer][data-state=open], [role=dialog]"));
  const scelti = drawer.length ? drawer : els.filter((e) => !e.closest(".invisible"));
  scelti.sort((a, b) => b.clientHeight - a.clientHeight);
  const el = scelti[0]; if (!el) return null;
  el.setAttribute("data-atlante-scorre", "1");
  return { totale: el.scrollHeight, vista: el.clientHeight };
});

let numero = 0;
async function foto(page, nome, titolo, { parti = 4 } = {}) {
  numero += 1;
  const base = `${String(numero).padStart(2, "0")}-${nome}`;
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await attesa(300);
  const sc = await trovaScorrevole(page);
  const file = [];
  const n = sc ? Math.min(parti, Math.ceil((sc.totale - 40) / (sc.vista - 120))) : 1;
  let ultimo = -1;
  for (let i = 0; i < Math.max(1, n); i++) {
    if (sc && i > 0) {
      const dove = await page.evaluate((y) => { const e = document.querySelector("[data-atlante-scorre]"); e.scrollTo(0, y); return e.scrollTop; }, i * (sc.vista - 120));
      if (dove <= ultimo + 40) break; // in fondo: la parte sarebbe una copia
      ultimo = dove; await attesa(500);
    } else ultimo = 0;
    const f = `${base}-${i + 1}.jpg`;
    await page.screenshot({ path: `${OUT}/${f}`, type: "jpeg", quality: 82 });
    file.push(f);
  }
  if (sc && n > 1) await page.evaluate(() => document.querySelector("[data-atlante-scorre]")?.scrollTo(0, 0));
  await page.evaluate(() => document.querySelector("[data-atlante-scorre]")?.removeAttribute("data-atlante-scorre"));
  indice.push({ nome: base, titolo, file });
  console.log("✓", base, file.length > 1 ? `(${file.length} parti)` : "");
}

const tocca = async (page, testo, { exact = true, dopo = 700 } = {}) => {
  await page.getByText(testo, { exact }).filter({ visible: true }).first().tap({ timeout: 5000 });
  await attesa(dopo);
};
const apriPagina = async (page, q, ms = 3500) => { await page.goto(u(q)); await attesa(ms); };
const apriChat = async (page, nome) => { await page.locator('main [role="button"]').filter({ hasText: nome }).first().tap(); await attesa(1500); };
/** Il pin di un annuncio (non il punto «tu sei qui»): il più grande fra i marker. */
const tocaPin = async (p) => {
  const box = await p.evaluate(() => {
    const m = [...document.querySelectorAll(".mapboxgl-marker")].map((e) => e.getBoundingClientRect()).filter((r) => r.width >= 36 && r.top > 120 && r.bottom < 780);
    m.sort((a, b) => b.width - a.width); const r = m[0]; return r ? { x: r.x + r.width / 2, y: r.y + r.height * 0.35 } : null;
  });
  if (!box) throw new Error("nessun pin a schermo");
  await p.touchscreen.tap(box.x, box.y); await attesa(1800);
  if (!(await p.locator('[data-vaul-drawer][data-state="open"]').count())) throw new Error("la scheda non si è aperta");
};
const compilaAnnuncio = async (p) => {
  const prova = async (f) => { try { await f(); } catch { /* campo assente in questa versione */ } };
  await p.locator("#title").fill("Cameriere per sabato sera");
  await p.locator("#description").fill("Sabato sera il bar si riempie per l'aperitivo e il dopocena: prendi le ordinazioni ai tavoli e porti i drink. Ti affianchiamo noi.");
  await prova(() => p.locator("#schedule").fill("Sabato 18:00–23:00", { timeout: 2000 }));
  await prova(() => tocca(p, "Una tantum", { dopo: 400 }));
  await prova(() => tocca(p, "Ora", { dopo: 300 }));
  await p.locator("#paga").fill("10");
  await prova(() => tocca(p, "Lordi", { dopo: 200 }));
  await prova(() => p.locator("#oreTotali").fill("5", { timeout: 2000 }));
  await p.getByRole("button", { name: "Cameriere", exact: true }).first().tap();
  await attesa(400);
};
const chiudiSchede = async (page) => { await page.keyboard.press("Escape"); await attesa(700); };

const SCENE = [
  // — Accesso —
  ["accesso", "Accesso", async (p) => { await apriPagina(p, { chi: "nessuno", da: "/auth" }); }],
  ["registrazione-worker", "Registrazione · cerco lavoro", async (p) => { await apriPagina(p, { chi: "nessuno", da: "/auth" }); await tocca(p, "Registrati"); }],
  ["registrazione-attivita", "Registrazione · attività", async (p) => { await apriPagina(p, { chi: "nessuno", da: "/auth" }); await tocca(p, "Registrati"); await tocca(p, "Offro impiego"); await tocca(p, "Attività"); }],
  ["registrazione-privato", "Registrazione · privato", async (p) => { await apriPagina(p, { chi: "nessuno", da: "/auth" }); await tocca(p, "Registrati"); await tocca(p, "Offro impiego"); await tocca(p, "Privato"); }],
  ["scelta-quartiere", "Registrazione · scelta del quartiere", async (p) => { await apriPagina(p, { chi: "nessuno", da: "/auth" }); await tocca(p, "Registrati"); await tocca(p, "Offro impiego"); await tocca(p, "Attività"); await p.getByText("Seleziona quartiere").filter({ visible: true }).first().tap(); await attesa(900); }],
  ["reimposta-password", "Reimposta password (link scaduto)", async (p) => { await apriPagina(p, { chi: "nessuno", da: "/reimposta-password" }, 3500); }],
  ["scegli-ruolo", "Scegli ruolo (dopo Google/Apple)", async (p) => { await apriPagina(p, { chi: "nuovo", da: "/scegli-ruolo" }); }],
  ["configurazione-attivita", "Configurazione del profilo · attività", async (p) => { await apriPagina(p, { chi: "nuovo", da: "/onboarding" }, 4500); }],
  // — Mappa —
  ["mappa-worker", "Mappa · worker", async (p) => { await apriPagina(p, { chi: "sara", momento: "pubblicato", da: "/" }, 8000); }],
  ["annuncio-basso", "Scheda annuncio · aperta bassa", async (p) => { await apriPagina(p, { chi: "sara", momento: "pubblicato", da: "/" }, 8000); await tocaPin(p); }],
  ["annuncio-alto", "Scheda annuncio · aperta tutta", async (p) => {
    await apriPagina(p, { chi: "sara", momento: "pubblicato", da: "/" }, 8000); await tocaPin(p);
    const t = await p.locator("[data-vaul-drawer]").first().boundingBox(); const cdp = await p.context().newCDPSession(p);
    const tt = (type, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: 195, y }] });
    await tt("touchStart", t.y + 14); for (let i = 1; i <= 18; i++) { await tt("touchMove", t.y + 14 + ((60 - t.y - 14) * i) / 18); await attesa(16); } await tt("touchEnd", 60); await attesa(1500);
  }],
  ["ricerca-filtri", "Mappa · ricerca e filtri", async (p) => { await apriPagina(p, { chi: "sara", momento: "pubblicato", da: "/" }, 6000); await p.locator('button[aria-label*="iltri"], button[aria-label*="Filtri"]').first().tap().catch(async () => { await p.getByPlaceholder(/Cerca/).first().tap(); }); await attesa(1200); }],
  ["mappa-employer", "Mappa · employer", async (p) => { await apriPagina(p, { chi: "marea", momento: "pubblicato", da: "/" }, 8000); }],
  // — Lista (worker) —
  ["lista-esplora", "Lista · esplora", async (p) => { await apriPagina(p, { chi: "sara", momento: "pubblicato", da: "/lista" }); }],
  ["lista-candidature", "Lista · candidature", async (p) => { await apriPagina(p, { chi: "marco", momento: "scelto", da: "/lista" }); await tocca(p, "Candidature"); }],
  ["lista-candidature-vuote", "Lista · candidature (vuote)", async (p) => { await apriPagina(p, { chi: "sara", momento: "pubblicato", da: "/lista" }); await tocca(p, "Candidature"); }],
  ["lista-vuota", "Lista · nessun annuncio", async (p) => { await apriPagina(p, { chi: "sara", momento: "pubblicato", da: "/lista" }); }, { svuota: ["jobs"] }],
  ["mappa-vuota", "Mappa · nessun annuncio", async (p) => { await apriPagina(p, { chi: "sara", momento: "pubblicato", da: "/" }, 8000); }, { svuota: ["jobs"] }],
  // — Annunci (employer) —
  ["annunci", "Annunci · employer", async (p) => { await apriPagina(p, { chi: "marea", momento: "candidature", da: "/annunci" }); }],
  ["annuncio-dettaglio", "Annunci · un annuncio con le candidature", async (p) => { await apriPagina(p, { chi: "marea", momento: "candidature", da: "/annunci" }); await p.locator("main").getByText("Cameriere per sabato sera").first().tap(); await attesa(1500); }],
  ["crea-annuncio", "Crea annuncio", async (p) => { await apriPagina(p, { chi: "marea", momento: "pubblicato", da: "/create-job" }); }, { parti: 5 }],
  ["crea-annuncio-compilato", "Crea annuncio · compilato", async (p) => { await apriPagina(p, { chi: "marea", momento: "pubblicato", da: "/create-job" }); await compilaAnnuncio(p); }, { parti: 5 }],
  ["opzioni-annuncio", "Opzioni dell'annuncio (dopo «Prosegui»)", async (p) => { await apriPagina(p, { chi: "marea", momento: "pubblicato", da: "/create-job" }); await compilaAnnuncio(p); await tocca(p, "Prosegui", { dopo: 1800 }); }],
  ["annunci-vuoti", "Annunci · nessun annuncio", async (p) => { await apriPagina(p, { chi: "marea", momento: "pubblicato", da: "/annunci" }); }, { svuota: ["jobs", "applications"] }],
  // — Messaggi —
  ["messaggi-worker", "Messaggi · lista · worker", async (p) => { await apriPagina(p, { chi: "marco", momento: "assunto", da: "/messaggi" }); }],
  ["messaggi-vuoti", "Messaggi · vuoti", async (p) => { await apriPagina(p, { chi: "sara", momento: "pubblicato", da: "/messaggi" }); }, { svuota: ["chats", "messages"] }],
  ["bacheca-employer-vuota", "Bacheca · employer, vuota", async (p) => { await apriPagina(p, { chi: "marea", momento: "pubblicato", da: "/messaggi?vista=bacheca" }); }, { svuota: ["cartellini"] }],
  ["messaggi-employer", "Messaggi · lista · employer", async (p) => { await apriPagina(p, { chi: "marea", momento: "assunto", da: "/messaggi" }); }],
  ["chat-employer", "Chat · employer", async (p) => { await apriPagina(p, { chi: "marea", momento: "assunto", da: "/messaggi" }); await apriChat(p, "Marco"); }, { parti: 1 }],
  ["chat-worker", "Chat · worker", async (p) => { await apriPagina(p, { chi: "marco", momento: "scelto", da: "/messaggi" }); await apriChat(p, "Marea"); }, { parti: 1 }],
  ["chat-allega", "Chat · Allega", async (p) => { await apriPagina(p, { chi: "marea", momento: "assunto", da: "/messaggi" }); await apriChat(p, "Marco"); await p.locator('button[aria-label="Allega"]').tap(); await attesa(900); }, { parti: 1 }],
  ["chat-cerca", "Chat · Cerca in chat", async (p) => { await apriPagina(p, { chi: "marea", momento: "assunto", da: "/messaggi" }); await apriChat(p, "Marco"); await p.locator('button[aria-label="Cerca in chat"]').tap(); await attesa(900); }, { parti: 1 }],
  ["chat-menu-messaggio", "Chat · tenere premuto un messaggio", async (p) => {
    await apriPagina(p, { chi: "marea", momento: "assunto", da: "/messaggi" }); await apriChat(p, "Marco");
    const b = await p.locator("[data-messaggio] .select-none").nth(1).boundingBox(); const cdp = await p.context().newCDPSession(p);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: b.x + 40, y: b.y + 20 }] }); await attesa(650); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await attesa(700);
  }, { parti: 1 }],
  ["chat-menu-lista", "Messaggi · tenere premuta una chat", async (p) => {
    await apriPagina(p, { chi: "marea", momento: "assunto", da: "/messaggi" });
    const b = await p.locator('main [role="button"]').first().boundingBox(); const cdp = await p.context().newCDPSession(p);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: b.x + 120, y: b.y + 30 }] }); await attesa(650); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await attesa(700);
  }, { parti: 1 }],
  ["bacheca-employer", "Bacheca · employer", async (p) => { await apriPagina(p, { chi: "marea", momento: "assunto", da: "/messaggi?vista=bacheca" }); }],
  ["cartellino", "Bacheca · scheda del cartellino", async (p) => { await apriPagina(p, { chi: "marea", momento: "assunto", da: "/messaggi?vista=bacheca" }); await p.locator(".bacheca > *").first().tap(); await attesa(1500); }],
  ["bacheca-worker", "Bacheca · worker", async (p) => { await apriPagina(p, { chi: "marco", momento: "assunto", da: "/messaggi?vista=bacheca" }); }],
  ["scheda-lavoro", "Bacheca · scheda del lavoro (worker)", async (p) => { await apriPagina(p, { chi: "marco", momento: "assunto", da: "/messaggi?vista=bacheca" }); await p.locator(".bacheca > *").first().tap(); await attesa(1500); }],
  ["bacheca-vuota", "Bacheca · vuota (worker)", async (p) => { await apriPagina(p, { chi: "sara", momento: "pubblicato", da: "/messaggi?vista=bacheca" }); }],
  // — Profili —
  ["profilo-worker", "Profilo · worker", async (p) => { await apriPagina(p, { chi: "marco", momento: "concluso", da: "/profilo" }); }],
  ["profilo-employer", "Profilo · employer", async (p) => { await apriPagina(p, { chi: "marea", momento: "concluso", da: "/profilo" }); }],
  ["profilo-pubblico-worker", "Profilo pubblico di un worker (visto dall'attività)", async (p) => { await apriPagina(p, { chi: "marea", momento: "concluso", da: `/profile/${MARCO}` }); }],
  ["profilo-pubblico-attivita", "Profilo pubblico di un'attività (visto dal worker)", async (p) => { await apriPagina(p, { chi: "marco", momento: "concluso", da: `/profile/${MAREA}` }); }],
  ["modifica-profilo-worker", "Modifica profilo · worker", async (p) => { await apriPagina(p, { chi: "marco", momento: "concluso", da: "/settings/edit-profile" }); }, { parti: 5 }],
  ["modifica-profilo-employer", "Modifica profilo · employer", async (p) => { await apriPagina(p, { chi: "marea", momento: "concluso", da: "/settings/edit-profile" }); }, { parti: 5 }],
  ["impostazioni-worker", "Impostazioni · worker", async (p) => { await apriPagina(p, { chi: "marco", momento: "concluso", da: "/settings" }); }],
  ["impostazioni-employer", "Impostazioni · employer", async (p) => { await apriPagina(p, { chi: "marea", momento: "concluso", da: "/settings" }); }],
  ["notifiche-employer", "Notifiche · employer", async (p) => { await apriPagina(p, { chi: "marea", momento: "candidature", da: "/notifiche" }); }],
  ["notifiche-vuote", "Notifiche · vuote", async (p) => { await apriPagina(p, { chi: "sara", momento: "pubblicato", da: "/notifiche" }); }],
  // — Finestre e varie —
  ["promemoria", "Promemoria (scadenze, cuore)", async (p) => { await apriPagina(p, { chi: "marea", momento: "concluso", da: "/", promemoria: "1" }, 6000); }],
  ["pagina-non-trovata", "Pagina non trovata", async (p) => { await apriPagina(p, { chi: "marco", momento: "pubblicato", da: "/questa-pagina-non-esiste" }); }],
];

for (const [nome, titolo, fai, opz] of SCENE) {
  if (FILTRO && !nome.includes(FILTRO)) continue;
  const { ctx, page } = await telefono(opz?.svuota ?? []);
  try { await fai(page); await foto(page, nome, titolo, opz); }
  catch (e) { numero += 1; console.log("✗", nome, "→", e.message.split("\n")[0].slice(0, 140)); indice.push({ nome: `${String(numero).padStart(2, "0")}-${nome}`, titolo, file: [], errore: e.message.split("\n")[0] }); }
  await ctx.close();
}
fs.writeFileSync(`${OUT}/indice.json`, JSON.stringify(indice, null, 2));
await browser.close();
