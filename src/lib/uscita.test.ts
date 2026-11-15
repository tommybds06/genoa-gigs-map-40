import { test } from "node:test";
import assert from "node:assert/strict";
import { esciSempre } from "./uscita.ts";

const prova = (esciDalServer: () => Promise<{ error: unknown }>, scollegaNotifiche = async () => {}) => {
  const tolta = { n: 0 };
  const d = {
    scollegaNotifiche,
    esciDalServer,
    togliSessioneLocale: async () => {
      tolta.n += 1;
    },
    attesaNotificheMs: 30,
    attesaServerMs: 50,
  };
  return { d, tolta };
};

test("il server conferma: la sessione la toglie Supabase, noi niente", async () => {
  const { d, tolta } = prova(async () => ({ error: null }));
  assert.deepEqual(await esciSempre(d), { errore: null });
  assert.equal(tolta.n, 0);
});

test("il server risponde con un errore: la sessione si toglie lo stesso", async () => {
  const { d, tolta } = prova(async () => ({ error: { status: 500, message: "boom" } }));
  const r = await esciSempre(d);
  assert.deepEqual(r.errore, { status: 500, message: "boom" });
  assert.equal(tolta.n, 1);
});

test("signOut lancia un'eccezione: la sessione si toglie lo stesso", async () => {
  const { d, tolta } = prova(async () => {
    throw new Error("rete");
  });
  assert.equal(((await esciSempre(d)).errore as Error).message, "rete");
  assert.equal(tolta.n, 1);
});

test("il server non risponde: dopo l'attesa si esce lo stesso", async () => {
  const { d, tolta } = prova(() => new Promise(() => {}));
  const inizio = Date.now();
  const r = await esciSempre(d);
  assert.ok(Date.now() - inizio < 1000);
  assert.match((r.errore as Error).message, /non ha risposto/);
  assert.equal(tolta.n, 1);
});

test("le notifiche che non rispondono (o falliscono) non bloccano l'uscita", async () => {
  const appese = prova(async () => ({ error: null }), () => new Promise(() => {}));
  assert.deepEqual(await esciSempre(appese.d), { errore: null });
  const rotte = prova(async () => ({ error: null }), async () => {
    throw new Error("sw");
  });
  assert.deepEqual(await esciSempre(rotte.d), { errore: null });
});
