import { test } from "node:test";
import assert from "node:assert/strict";
import {
  durataVocale,
  estensioneVocale,
  leggiVocale,
  percorsoVocale,
  riduciPicchi,
  ePdf,
  eSegnaposto,
  etichettaMessaggio,
  nomeAllegato,
  nomePulito,
  percorsoDocumento,
  segnapostoAllegato,
  tipoAllegato,
} from "./allegati.ts";

test("il tipo si legge dall'estensione", () => {
  assert.equal(tipoAllegato("c/u/1731400000000-cv.pdf"), "documento");
  assert.equal(tipoAllegato("c/u/1731400000000-CV.PDF"), "documento");
  assert.equal(tipoAllegato("c/u/1731400000000.jpg"), "foto");
  assert.equal(tipoAllegato("https://x/chat-attachments/c/u/a.pdf?token=1"), "documento");
  assert.equal(tipoAllegato(null), null);
});

test("solo PDF, anche quando il telefono non dichiara il tipo", () => {
  assert.equal(ePdf({ type: "application/pdf", name: "x" }), true);
  assert.equal(ePdf({ type: "", name: "cv.PDF" }), true);
  assert.equal(ePdf({ type: "application/msword", name: "cv.doc" }), false);
  assert.equal(ePdf({ type: "application/zip", name: "finto.pdf" }), false);
});

test("il nome diventa adatto a un percorso", () => {
  assert.equal(nomePulito("Curriculum Sara Bianchi.pdf"), "Curriculum-Sara-Bianchi.pdf");
  assert.equal(nomePulito("Caffè & perché (2).PDF"), "Caffe-perche-2.pdf");
  assert.equal(nomePulito("../../etc/passwd.pdf"), "etc-passwd.pdf");
  assert.equal(nomePulito("....pdf"), "documento.pdf");
  assert.equal(nomePulito("a".repeat(200) + ".pdf").length, 64);
});

test("dal percorso si ritrova il nome da mostrare", () => {
  const p = percorsoDocumento("chat1", "utente1", "Curriculum Sara.pdf", 1731400000000);
  assert.equal(p, "chat1/utente1/1731400000000-Curriculum-Sara.pdf");
  assert.equal(nomeAllegato(p), "Curriculum-Sara.pdf");
  // Un nome che comincia con un anno non perde l'anno: l'ora ha 13 cifre.
  assert.equal(nomeAllegato("c/u/1731400000000-2026-orari.pdf"), "2026-orari.pdf");
});

test("segnaposto ed etichette", () => {
  assert.equal(segnapostoAllegato("c/u/1.jpg"), "📷 Foto");
  assert.equal(segnapostoAllegato("c/u/1731400000000-cv.pdf"), "📄 cv.pdf");
  assert.equal(eSegnaposto("📷 Foto"), true);
  assert.equal(eSegnaposto("📄 cv.pdf"), true);
  assert.equal(eSegnaposto("ciao"), false);
  assert.equal(eSegnaposto(""), false);
  assert.equal(etichettaMessaggio({ content: "📷 Foto", attachment_url: "c/u/1.jpg" }), "Foto");
  assert.equal(etichettaMessaggio({ content: "📄 cv.pdf", attachment_url: "c/u/1-cv.pdf" }), "Documento");
  assert.equal(etichettaMessaggio({ content: "ecco il cv", attachment_url: "c/u/1-cv.pdf" }), "ecco il cv");
  assert.equal(etichettaMessaggio({ content: "", attachment_url: "c/u/1-cv.pdf" }), "Documento");
  assert.equal(etichettaMessaggio({ content: "", attachment_url: null }), "");
});

test("vocali: tipo, segnaposto, etichetta", () => {
  assert.equal(tipoAllegato("c/u/1731400000000-vocale-12s-0123.m4a"), "vocale");
  assert.equal(tipoAllegato("c/u/1731400000000-vocale-12s-0123.webm?token=x"), "vocale");
  assert.equal(segnapostoAllegato("c/u/1-vocale-3s-1.m4a"), "🎤 Vocale");
  assert.equal(eSegnaposto("🎤 Vocale"), true);
  assert.equal(etichettaMessaggio({ content: "🎤 Vocale", attachment_url: "c/u/1-vocale-3s-1.m4a" }), "Vocale");
  assert.equal(etichettaMessaggio({ content: "", attachment_url: "c/u/1-vocale-3s-1.webm" }), "Vocale");
});

test("vocali: durata e forma d'onda nel nome del file", () => {
  const picchi = [0, 1, 2, 3, 9, 9, 4];
  const p = percorsoVocale("chat", "io", 12.4, picchi, "m4a", 1731400000000);
  assert.equal(p, "chat/io/1731400000000-vocale-12s-0123994.m4a");
  assert.deepEqual(leggiVocale(p), { secondi: 12, picchi });
  // Un percorso che non è un vocale: durata 0, forma piatta, niente errori.
  assert.equal(leggiVocale("c/u/1.jpg").secondi, 0);
  assert.equal(leggiVocale(null).picchi.length, 40);
});

test("vocali: la forma d'onda si normalizza sul più forte", () => {
  const r = riduciPicchi([0.1, 0.2, 0.05, 0.4], 4);
  assert.deepEqual(r, [2, 5, 1, 9]);
  assert.deepEqual(riduciPicchi([], 3), [0, 0, 0]);
  assert.deepEqual(riduciPicchi([0, 0.001], 2), [0, 0]);
  // Più barre che campioni: si ripete, non si rompe.
  assert.equal(riduciPicchi([0.5, 1], 40).length, 40);
  // Molti campioni: 40 barre, tutte cifre da 0 a 9.
  const molti = riduciPicchi(Array.from({ length: 1234 }, (_, i) => Math.abs(Math.sin(i / 30))));
  assert.equal(molti.length, 40);
  assert.ok(molti.every((v) => Number.isInteger(v) && v >= 0 && v <= 9));
});

test("vocali: durata leggibile ed estensione", () => {
  assert.equal(durataVocale(7), "0:07");
  assert.equal(durataVocale(90.9), "1:30");
  assert.equal(estensioneVocale("audio/mp4;codecs=mp4a.40.2"), "m4a");
  assert.equal(estensioneVocale("audio/webm;codecs=opus"), "webm");
});
