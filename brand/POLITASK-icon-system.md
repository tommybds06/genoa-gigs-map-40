# Politask — Sistema Icone (Fase 3)
> Guida per il redesign delle icone in-app. Versione: bozza 1 (luglio 2026).
> Decisioni prese con Tommaso: **filled/chunky · accento hand-drawn · utility lucide armonizzate.**

## Regole di stile (Tier 1: ruoli + bottom nav)

- **Forma:** **piene (filled)**, non outline. Silhouette chunky e arrotondate, coerenti col logo.
- **Angoli:** raccordi morbidi (corner radius generoso), niente spigoli vivi.
- **Accento hand-drawn:** leggere irregolarità/organicità nei bordi e nelle terminazioni — un tocco "fatto a mano" senza esagerare. Dove naturale, richiamo al motivo **ventose** (piccoli tondi) come firma. Mai a scapito della leggibilità.
- **Colore:** **mono, `fill="currentColor"`** → l'icona eredita il tema (arancio worker / blu employer) via `useAppTheme`, senza colori hard-coded.
- **Peso visivo:** pieno ma non pesante; bilanciato con le utility lucide vicine, così il mix non stona.

## Griglia & export

- Disegna su **griglia 24×24** (come lucide, così lo swap è 1:1 nei componenti).
- **Live area ~20×20**, margine di sicurezza ~2px per lato.
- Export **SVG**, `viewBox="0 0 24 24"`, **niente colore hard-coded** (usa `currentColor`), path puliti/uniti.
- Consegna come SVG singoli; io li monto come componenti React.

## Utility (Tier 3: restano lucide, armonizzate)

- Si tengono le icone `lucide-react` (chevron, X, check, loader, search, settings, +, star, ecc.).
- Armonizzazione: `strokeWidth` coerente (~2.25), `linecap`/`linejoin` round (default lucide), dimensioni uniformi.
- Si **accetta un lieve mix** filled(custom) + outline(utility): standard nel settore, alto risparmio di lavoro.

## Set da disegnare (Tier 1 — ~16 icone)

**Ruoli lavoro (13 + generico)** — è il linguaggio visivo di marker mappa/card/liste.
Lista aggiornata (luglio 2026, implementata in `constants/tags.ts` + `jobIcons.ts` con icone
lucide provvisorie): Rider · Cameriere · Aiuto cucina · Cassa · Vendite · Pulizie · Ripetizioni ·
Babysitter · Dog-sitter · Grafico · Social · Promoter · Steward · **Generico** (fallback).
(Rimossi/rinominati: Security→Steward per motivi legali, Biglietteria e Staff accorpati in
Steward; aggiunti Aiuto cucina, Babysitter, Dog-sitter, Promoter. Alias legacy mantenuti in
`jobIcons.ts` così gli annunci vecchi mostrano ancora un'icona decorosa.)

**Bottom nav (5):** Mappa · Lista · Annunci · Messaggi · Profilo.

**Tier 2 (dopo):** icone per i tag di **durata** (Una tantum, Giorni, Settimane, Mesi, Continuativo). Empty-state → Fase 5 (illustrazioni).

## Note tecniche / pulizia

- **Consolidare** in un unico sistema: oggi c'è una mappa legacy `categoryIcons` in `JobDetailsSheet.tsx` (tutoring/delivery/event/general) che si sovrappone a `lib/jobIcons.ts` (ruoli). Durante l'implementazione unifico tutto su `jobIcons.ts`.
- Punti di montaggio centralizzati: `src/lib/jobIcons.ts` (ruoli) e `src/components/layout/BottomNav.tsx` (nav) → swap pulito, in un punto solo.
- Le icone ruolo sono spesso mostrate dentro un tile arrotondato (`bg-accent`/`bg-employer-50`): la glifo pieno chunky ci sta bene.

## Workflow proposto

1. **Pilot (round 1):** disegna 2–3 icone per fissare lo stile prima di farle tutte — es. **Rider** (mezzo), **Pulizie** (astratta/scintille), **Profilo** (nav/persona). Diverse tra loro = stress-test dello stile.
2. Iteriamo round-by-round finché lo stile è bloccato.
3. Rollout del resto del set sullo stile approvato.
4. Io implemento (swap in `jobIcons.ts` + `BottomNav.tsx`, consolidamento, theme-aware).

## Stato implementazione (luglio 2026)

✅ **Icone ruolo (13 + generico) implementate.** SVG di Tommaso → componenti in
`src/components/icons/roleIcons.tsx` (mono, `currentColor`, `className`, size default 24).
- `lib/jobIcons.ts` ora delega a questi → icone in **creazione annunci**, card, marker, storico.
- `JobDetailsSheet.tsx`: rimossa la mappa legacy `categoryIcons`, ora usa `getJobIconFromTags`.
- `TagSelector.tsx` (preferenze worker in Profilo/Onboarding, filtro Lista): ogni chip ruolo
  mostra l'icona + aggiunto **input "ruolo personalizzato"**; heading "Modalità"→"Durata".
- Verificato con `tsc --noEmit` (pulito). Il full build in sandbox fallisce solo per binari
  nativi (node_modules macOS su Linux) — sul Mac gira.

✅ **Nav + utility (batch 2) implementate.** Componenti in `src/components/icons/uiIcons.tsx`:
- Nav (Mappa, Lista, Annunci, Messaggi, Profilo) → `BottomNav.tsx`.
- Impostazioni → ingranaggio nel `Profilo.tsx`; Notifiche → `Settings.tsx`; Calendario →
  `WorkerJobHistory.tsx` + `PublicProfile.tsx` (date).
- Colori tag allineati ai token brand (`primary`/`accent`) invece di orange grezzi; pin mappa
  ingranditi (`w-10`→`w-12`, icona `w-5`→`w-6`); ruoli nelle preferenze a griglia quadrata,
  durata rimossa dalle preferenze.

✅ **Search + Filtri implementate** (`uiIcons.tsx` → `SearchBar.tsx`). **Set icone COMPLETO**:
ruoli (14) + nav (5) + utility (impostazioni, notifiche, calendario, search, filtri). Tutte
theme-aware (`currentColor`), montate ai punti dedicati. Fase 3 icone = conclusa.

## Riepilogo finale Fase 3 (icone) — COMPLETATA (luglio 2026)

Tutte le icone dell'app sono ora custom di Tommaso, generate come componenti React
theme-aware in due file:
- `src/components/icons/roleIcons.tsx` — 13 ruoli + generico (`getRoleIcon`), usato da `jobIcons.ts`.
- `src/components/icons/uiIcons.tsx` — nav, utility, azioni, stati.

**Set completo:**
- **Ruoli (14):** Rider, Cameriere, Aiuto cucina, Cassa, Vendite, Pulizie, Ripetizioni,
  Babysitter, Dog-sitter, Grafico, Social, Promoter, Steward, Generico.
- **Nav (5):** Mappa, Lista, Annunci, Messaggi, Profilo — **+ versioni outline** (`*VuotaIcon`).
- **Utility/azioni:** Impostazioni, Notifiche, Calendario, Search, Filtri, Documento, Mail,
  Lucchetto, Penna, Bidone, X, Info, Cuore, Esci, Foto, Indietro, Stella/MezzaStella/StellaVuota,
  Orologio, StoricoLavori, AnnunciAttivi, Invio, Immagini, Frecce foto (sinistra/destra).

**Tecnica:** le icone piene usano `fill="currentColor"`; le outline (`*VuotaIcon`, stelle vuote)
usano `fill="none"` + `stroke="currentColor"` (colore ereditato dal tema). Il generatore
(bash/node) legge gli SVG dagli uploads, strippa `id/data-name`, neutralizza i fill/stroke
hardcoded e imposta `currentColor`. Le outline della nav hanno `stroke-width` ×2.3 + round join.

**Bottom nav (stile Instagram):** `BottomNav.tsx` — niente label, icone più grandi (`w-7`),
colore del ruolo (arancio worker / blu employer), cross-fade **outline→filled** su opacità +
scala 110% sull'attiva, nessun rettangolo. (Se le outline restano troppo sottili → ridisegnarle
con tratto più pesante e più spazio tra gli elementi: lo stroke-width via codice collide su
testa/corpo del profilo.)

**Altre rifiniture correlate:**
- Colori tag allineati ai token brand (`primary`/`accent`) invece degli `orange-*` grezzi.
- Pin mappa ingranditi (`w-12`); mini-mappa dettaglio annuncio con pin arancione politask +
  icona-ruolo dentro (via `renderToStaticMarkup`).
- Card lista/candidature: icone senza riquadro, più grandi, arancio; gerarchia card più pulita.
- Stelle recensioni a 3 stati (piena/mezza/vuota), contorno **blu** (non nero).
- Logo principale sostituito con `logoPOLITASK.svg`, colorato arancio (worker) / blu (employer)
  in `public/images/logo-worker.svg` e `logo-employer.svg`.
- Barra chat più grande; toggle notifiche blu per employer.

⚠️ **Tutto frontend, non ancora committato/pushato** (fine sessione luglio 2026). Da fare:
commit + push (nuova tab terminale) per allineare Lovable. Ricorda l'ordine per l'eventuale
migration snapshot (già applicata).
