import { chromium } from "/Users/tommasobruschidesimone/Downloads/POLITASK/POLITASK.ASSET/node_modules/playwright/index.mjs";
import fs from "node:fs";
const [D, da = "0", a = "999"] = process.argv.slice(2);
const files = fs.readdirSync(D).filter((f) => f.endsWith(".jpg")).sort().slice(Number(da), Number(a));
const html = `<html><body style="margin:0;background:#333;display:flex;flex-wrap:wrap;gap:4px;padding:4px;font:11px sans-serif;color:#fff">${files.map((f) => `<div style="width:180px"><img src="file://${D}/${f}" style="width:180px;display:block"><div>${f.replace(".jpg", "")}</div></div>`).join("")}</body></html>`;
fs.writeFileSync(`${D}/../provino.html`, html);
const b = await chromium.launch({ channel: "chrome" }); const p = await b.newPage({ viewport: { width: 1124, height: 800 } });
await p.goto(`file://${D}/../provino.html`); await p.waitForTimeout(800);
await p.screenshot({ path: `${D}/../provino-${da}.png`, fullPage: true }); await b.close();
