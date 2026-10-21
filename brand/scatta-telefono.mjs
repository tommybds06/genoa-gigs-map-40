// Screenshot a misura di telefono vera via Chrome DevTools Protocol.
// uso: [POSIZIONE=lat,lng] [PIZZICO=0.75] node brand/scatta-telefono.mjs <url> <file.png> [larghezza=390] [altezza=844] [attesaMs=7000]
// Chrome headless su Mac non scende sotto ~500 px di finestra: qui la misura
// la impone Emulation.setDeviceMetricsOverride (telefono vero, 2×, touch),
// quindi vale anche per drawer e overlay a tutta larghezza. Serve Node ≥ 22
// (WebSocket globale) e Google Chrome installato.
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const [url, out, w = "390", h = "844", attesa = "7000"] = process.argv.slice(2);
const profilo = mkdtempSync(tmpdir() + "/cdp-");
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--remote-debugging-port=9333", `--user-data-dir=${profilo}`, "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
let pagine;
for (let i = 0; i < 50; i++) { try { pagine = await (await fetch("http://127.0.0.1:9333/json/list")).json(); if (pagine.find((p) => p.type === "page")) break; } catch {} await pausa(200); }
const ws = new WebSocket(pagine.find((p) => p.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const attese = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && attese.has(d.id)) { attese.get(d.id)(d); attese.delete(d.id); } };
const cdp = (method, params = {}) => new Promise((r) => { const n = ++id; attese.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await cdp("Emulation.setDeviceMetricsOverride", { width: +w, height: +h, deviceScaleFactor: 2, mobile: true });
await cdp("Emulation.setTouchEmulationEnabled", { enabled: true });
await cdp("Page.enable");
// POSIZIONE=lat,lng finge il GPS (la mappa worker si centra sull'utente).
if (process.env.POSIZIONE) {
  const [latitude, longitude] = process.env.POSIZIONE.split(",").map(Number);
  await cdp("Browser.grantPermissions", { permissions: ["geolocation"], origin: new URL(url).origin });
  await cdp("Emulation.setGeolocationOverride", { latitude, longitude, accuracy: 20 });
}
await cdp("Page.navigate", { url });
await pausa(+attesa);
// PIZZICO=0.75 fa un pizzico vero col dito al centro (sotto 1 = allontana), poi aspetta.
if (process.env.PIZZICO) {
  await cdp("Input.synthesizePinchGesture", { x: +w / 2, y: +h / 2, scaleFactor: +process.env.PIZZICO, gestureSourceType: "touch" });
  await pausa(+(process.env.ATTESA_DOPO ?? 6000));
}
const shot = await cdp("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(shot.result.data, "base64"));
console.log("scritto", out);
ws.close(); chrome.kill();
