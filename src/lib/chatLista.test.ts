import { test } from "node:test";
import assert from "node:assert/strict";
import { cercaMessaggi, chatInLista, eNascosta, ritaglio, senzaAccenti } from "./chatLista.ts";

const m = (iso: string) => ({ created_at: iso });

test("una chat nascosta torna quando arriva un messaggio più recente", () => {
  assert.equal(eNascosta({}), false);
  assert.equal(eNascosta({ nascosta_il: "2026-11-13T10:00:00Z", last_message: m("2026-11-13T09:00:00Z") }), true);
  assert.equal(eNascosta({ nascosta_il: "2026-11-13T10:00:00Z", last_message: m("2026-11-13T10:00:01Z") }), false);
  // Senza messaggi resta nascosta.
  assert.equal(eNascosta({ nascosta_il: "2026-11-13T10:00:00Z", last_message: null }), true);
  // Fusi orari scritti in modo diverso: si confrontano gli istanti, non le stringhe.
  assert.equal(eNascosta({ nascosta_il: "2026-11-13T10:00:00+00:00", last_message: m("2026-11-13T11:30:00+01:00") }), false);
});

test("le fissate in cima, il resto nell'ordine di prima", () => {
  const chats = [
    { id: "a" },
    { id: "b", fissata_il: "2026-11-01T00:00:00Z" },
    { id: "c", nascosta_il: "2026-11-13T10:00:00Z", last_message: m("2026-11-12T00:00:00Z") },
    { id: "d" },
    { id: "e", fissata_il: "2026-11-10T00:00:00Z" },
  ];
  assert.deepEqual(chatInLista(chats).map((c) => c.id), ["b", "e", "a", "d"]);
});

test("senza accenti, stessa lunghezza", () => {
  assert.equal(senzaAccenti("Caffè PERCHÉ"), "caffe perche");
  for (const t of ["Caffè", "ciao 👋 là", "Sant'Ilario", "ǅ"]) assert.equal(senzaAccenti(t).length, t.length);
});

test("la ricerca ignora accenti e maiuscole e parte dai più recenti", () => {
  const messaggi = [
    { id: 1, created_at: "2026-11-10T10:00:00Z", content: "Ci vediamo al caffè alle 9" },
    { id: 2, created_at: "2026-11-11T10:00:00Z", content: "ok" },
    { id: 3, created_at: "2026-11-12T10:00:00Z", content: "Il CAFFE è chiuso domani" },
  ];
  const t = cercaMessaggi(messaggi, " caffe ", (x) => x.content);
  assert.deepEqual(t.map((x) => x.messaggio.id), [3, 1]);
  assert.equal(t[1].testo.slice(t[1].inizio, t[1].fine), "caffè");
  assert.deepEqual(cercaMessaggi(messaggi, "o", (x) => x.content), []);
  assert.deepEqual(cercaMessaggi(messaggi, "zzz", (x) => x.content), []);
});

test("il ritaglio porta la corrispondenza a inizio riga", () => {
  const testo = "a".repeat(100) + " domani alle nove";
  const r = ritaglio({ testo, inizio: 101, fine: 107 });
  assert.equal(r.trovato, "domani");
  assert.equal(r.prima.startsWith("…"), true);
  assert.equal(r.prima.length, 25);
  assert.equal(ritaglio({ testo: "domani sì", inizio: 0, fine: 6 }).prima, "");
});
