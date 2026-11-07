/**
 * I test dei prezzi. Si lanciano con `npm test` (Node 24 esegue il
 * TypeScript da solo: niente librerie in più).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcolaPrezzi, testoPaga, testoPrezzo, valoreAnnuncio } from "./prezzi.ts";

const vicino = (ottenuto: number, atteso: number, msg: string) =>
  assert.ok(Math.abs(ottenuto - atteso) <= 0.01, `${msg}: ${ottenuto} invece di ${atteso}`);

test("potenziamento per valore (tolleranza 0,01 €)", () => {
  const casi: [number, number][] = [
    [27, 1.75],
    [50, 2.51],
    [160, 4.99],
    [216, 5.96],
    [720, 12.13],
    [1296, 15.0],
    [1600, 15.0],
  ];
  for (const [valore, atteso] of casi) vicino(calcolaPrezzi(valore).potenziamento, atteso, `valore ${valore}`);
});

test("minimo: un annuncio da pochi euro costa comunque 1,50", () => {
  assert.equal(calcolaPrezzi(0).potenziamento, 1.5);
  assert.equal(calcolaPrezzi(5).potenziamento, 1.5);
});

test("allungamento e pacchetto partono dal potenziamento, al centesimo", () => {
  const p = calcolaPrezzi(50); // 2,51
  assert.equal(p.allungamento, 1.51); // 2,51 × 0,6 = 1,506
  assert.equal(p.pacchetto, 3.22); // (2,51 + 1,51) × 0,8 = 3,216
  for (const v of Object.values(p)) assert.equal(Math.round(v * 100) / 100, v);
});

test("valore dell'annuncio, durata per durata", () => {
  assert.equal(valoreAnnuncio({ durata: "occasionale", tipoPaga: "forfait", importo: 80 }), 80);
  assert.equal(valoreAnnuncio({ durata: "occasionale", tipoPaga: "oraria", importo: 10, oreTotali: 5 }), 50);
  assert.equal(valoreAnnuncio({ durata: "giornaliero", tipoPaga: "oraria", importo: 9, oreGiorno: 4, giorni: 3 }), 108);
  assert.equal(valoreAnnuncio({ durata: "settimanale", tipoPaga: "oraria", importo: 10, oreSettimana: 10, settimane: 2 }), 200);
  // oltre settimaneMassime (4) il valore non cresce
  assert.equal(valoreAnnuncio({ durata: "settimanale", tipoPaga: "oraria", importo: 10, oreSettimana: 10, settimane: 9 }), 400);
  assert.equal(valoreAnnuncio({ durata: "mensile", tipoPaga: "oraria", importo: 9, oreSettimana: 20 }), 720);
  assert.equal(valoreAnnuncio({ durata: "continuativo", tipoPaga: "oraria", importo: 9, oreSettimana: 20 }), 720);
});

test("valore: senza le ore che servono non c'è", () => {
  assert.equal(valoreAnnuncio({ durata: "giornaliero", tipoPaga: "oraria", importo: 9, oreGiorno: 4 }), null);
  assert.equal(valoreAnnuncio({ durata: "occasionale", tipoPaga: "oraria", importo: 9, oreTotali: 0 }), null);
});

test("testi", () => {
  assert.equal(testoPrezzo(2.51), "2,51 €");
  assert.equal(testoPrezzo(15), "15,00 €");
  assert.equal(testoPaga("oraria", 9.5, false), "9,50€/h netti");
  assert.equal(testoPaga("forfait", 150, true), "150€ forfait lordi");
});
