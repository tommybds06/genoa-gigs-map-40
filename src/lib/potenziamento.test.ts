import { test } from "node:test";
import assert from "node:assert/strict";
import { inEvidenza, ordinaAnnunci } from "./potenziamento.ts";

// Foce (44.3994, 8.949): annunci vicini e lontani rispetto a lì.
const VICINO = { lat: 44.3994, lng: 8.949 };
const LONTANO = { lat: 44.4286, lng: 8.7542 }; // Voltri, ~16 km
const annuncio = (id: string, ruolo: string, oreFa: number, dove = VICINO, opzione = "nessuna") => ({
  id,
  tags: ["Una tantum", ruolo],
  created_at: new Date(Date.UTC(2026, 10, 5, 12) - oreFa * 3600_000).toISOString(),
  ...dove,
  opzione,
});
const ids = (a: { id: string }[]) => a.map((x) => x.id).join(" ");
const STUDENTE = { tagsStudente: ["Cameriere", "Barista"], quartiereStudente: "Foce" };

test("il potenziato pertinente passa avanti; il non pertinente no", () => {
  const lista = [
    annuncio("recente", "Cameriere", 1),
    annuncio("potenziato", "Cameriere", 30, VICINO, "potenziamento"),
    annuncio("potenziato-altro-ruolo", "Rider", 2, VICINO, "pacchetto"),
  ];
  assert.equal(ids(ordinaAnnunci(lista, STUDENTE)), "potenziato recente potenziato-altro-ruolo");
});

test("tra più potenziati pertinenti vale l'ordine normale: distanza, poi data", () => {
  const lista = [
    annuncio("pot-lontano", "Cameriere", 1, LONTANO, "pacchetto"),
    annuncio("pot-vicino-vecchio", "Cameriere", 20, VICINO, "potenziamento"),
    annuncio("pot-vicino-nuovo", "Cameriere", 3, VICINO, "potenziamento"),
    annuncio("normale", "Cameriere", 0),
  ];
  assert.equal(ids(ordinaAnnunci(lista, STUDENTE)), "pot-vicino-nuovo pot-vicino-vecchio pot-lontano normale");
});

test("con un filtro attivo: un potenziato che non corrisponde non passa avanti", () => {
  const lista = [
    annuncio("filtrato", "Cameriere", 5),
    annuncio("pot-fuori-filtro", "Cameriere", 1, VICINO, "potenziamento"),
    annuncio("pot-nel-filtro", "Cameriere", 9, VICINO, "potenziamento"),
    annuncio("altro", "Cameriere", 0),
  ];
  const p = { ...STUDENTE, corrispondenti: new Set(["filtrato", "pot-nel-filtro"]) };
  assert.equal(ids(ordinaAnnunci(lista, p)), "pot-nel-filtro filtrato altro pot-fuori-filtro");
  assert.equal(inEvidenza(lista[1], p), false);
  assert.equal(inEvidenza(lista[2], p), true);
});

test("senza tag (o da employer) nessuno passa avanti né è in evidenza", () => {
  const lista = [annuncio("a", "Cameriere", 1), annuncio("b", "Cameriere", 5, VICINO, "pacchetto")];
  assert.equal(ids(ordinaAnnunci(lista, {})), "a b");
  assert.equal(inEvidenza(lista[1], {}), false);
});
