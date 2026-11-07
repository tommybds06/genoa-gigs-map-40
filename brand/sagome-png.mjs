/**
 * LE SAGOME IN PNG — `node brand/sagome-png.mjs` (7 novembre 2026).
 *
 * I disegni di Tommaso restano in SVG in `public/images/cornici/` (sono la
 * SORGENTE), ma l'app usa le loro copie PNG a 3× (`<nome>-3x.png`).
 *
 * Perché: una maschera o un bordo SVG viene ridisegnato come VETTORE a ogni
 * ridisegno, per ognuna delle 9 sezioni e per ogni elemento — su una
 * schermata sono 30–60 elementi. Sul Pixel di Tommaso era la parte più
 * grossa del lag (video del 7 novembre: 300 ms dopo il tocco su una tessera
 * degli interessi). Misurato con la GPU lenta (SwiftShader), stesso giro tre
 * volte: tessera 320 → 150 ms, «Modifica» 130 → 56, ingranaggio 105 → 65.
 * Un PNG è una copia di pixel.
 *
 * 3× basta: il rapporto più alto fra misura a schermo e tavola è ~0,94
 * (sagoma-tag), per 3 pixel per punto (iPhone) fa 2,8.
 *
 * ⚠️ Gli SLICE nel CSS sono in pixel DELL'IMMAGINE: con il PNG a 3× sono il
 * triplo di quelli della tavola SVG (28 → 84). Già fatto in index.css; chi
 * aggiunge una sagoma deve moltiplicarli anche lui.
 * ⚠️ Se un disegno cambia: rilanciare lo script E cambiare nome al file (es.
 * `-v2`), se no il browser tiene la copia vecchia (§2, lezione 3).
 */
import { chromium } from "playwright";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const CARTELLA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/images/cornici");
const SCALA = 3;

const browser = await chromium.launch({ channel: "chrome" });
for (const file of readdirSync(CARTELLA).filter((f) => f.endsWith(".svg"))) {
  const svg = readFileSync(path.join(CARTELLA, file), "utf8");
  const apertura = svg.match(/<svg[^>]*>/)[0];
  const w = Number(apertura.match(/width="([\d.]+)"/)[1]);
  const h = Number(apertura.match(/height="([\d.]+)"/)[1]);
  const pagina = await (await browser.newContext({ viewport: { width: Math.ceil(w), height: Math.ceil(h) }, deviceScaleFactor: SCALA })).newPage();
  await pagina.setContent(
    `<body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}" style="display:block;width:${w}px;height:${h}px"></body>`,
  );
  await pagina.waitForFunction(() => document.images[0].complete);
  const uscita = path.join(CARTELLA, file.replace(/\.svg$/, `-${SCALA}x.png`));
  await pagina.screenshot({ path: uscita, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  await pagina.close();
  console.log(`${file} → ${path.basename(uscita)} (${w * SCALA}×${h * SCALA})`);
}
await browser.close();
