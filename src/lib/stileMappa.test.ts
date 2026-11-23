import { test } from "node:test";
import assert from "node:assert/strict";
import { conOutfit } from "./stileMappa.ts";

const stile = {
  version: 8,
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  layers: [
    { id: "acqua", type: "fill" },
    { id: "road-label", type: "symbol", layout: { "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"] } },
    { id: "quartieri", type: "symbol", layout: { "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"] } },
    { id: "strade", type: "symbol", layout: { "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"], "text-size": 12 } },
    { id: "mare", type: "symbol", layout: { "text-font": ["DIN Pro Italic", "Arial Unicode MS Regular"] } },
    { id: "citta", type: "symbol", layout: { "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"] } },
    { id: "zoom", type: "symbol", layout: { "text-font": ["step", ["zoom"], ["literal", ["DIN Pro Regular"]], 10, ["literal", ["DIN Pro Bold"]]] } },
  ],
};

test("i caratteri si chiedono all'account di Tommaso", () => {
  assert.equal(conOutfit(stile).glyphs, "mapbox://fonts/tommybds/{fontstack}/{range}.pbf");
});

test("DIN Pro diventa Outfit dello stesso peso; Arial resta di riserva", () => {
  const s = conOutfit(stile);
  const font = (id: string) => s.layers!.find((l) => l.id === id)!.layout!["text-font"];
  assert.deepEqual(font("strade"), ["Outfit Medium", "Arial Unicode MS Regular"]);
  assert.deepEqual(font("mare"), ["Outfit Regular", "Arial Unicode MS Regular"]);
  assert.deepEqual(font("citta"), ["Outfit SemiBold", "Arial Unicode MS Bold"]);
  assert.deepEqual(font("zoom"), ["step", ["zoom"], ["literal", ["Outfit Regular"]], 10, ["literal", ["Outfit SemiBold"]]]);
});

test("i nomi delle vie in Outfit Light, gli altri Regular restano Regular", () => {
  const s = conOutfit(stile);
  const font = (id: string) => s.layers!.find((l) => l.id === id)!.layout!["text-font"];
  assert.deepEqual(font("road-label"), ["Outfit Light", "Arial Unicode MS Regular"]);
  assert.deepEqual(font("quartieri"), ["Outfit Regular", "Arial Unicode MS Regular"]);
});

test("il resto dello stile non cambia, e l'originale non viene toccato", () => {
  const s = conOutfit(stile);
  assert.equal(s.layers![0], stile.layers[0]);
  const strade = (x: { layers?: { id?: unknown; layout?: Record<string, unknown> }[] }) => x.layers!.find((l) => l.id === "strade")!.layout!;
  assert.equal(strade(s)["text-size"], 12);
  assert.equal((strade(stile)["text-font"] as string[])[0], "DIN Pro Medium");
  assert.equal(stile.glyphs, "mapbox://fonts/mapbox/{fontstack}/{range}.pbf");
});
