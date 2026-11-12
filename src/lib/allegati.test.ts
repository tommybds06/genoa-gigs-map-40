import { test } from "node:test";
import assert from "node:assert/strict";
import {
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
