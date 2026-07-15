# Politask — Memoria di progetto (CLAUDE.md)

> Questo file viene letto automaticamente da Claude Code a ogni avvio nella cartella del progetto.
> È la "memoria persistente": tienilo aggiornato quando cambia lo stato del lavoro.

## Cos'è Politask

Marketplace di **gig-work per la città di Genova** che collega lavoratori (soprattutto
studenti in cerca di lavoretti occasionali) con datori di lavoro (aziende e privati).
Esperienza mobile-first, **map-based e geolocalizzata**, con target Gen Z: navigazione
a swipe, bottom bar, drawer.

Il brand gioca su più significati: "poli-" = molteplicità; il nome richiama il **polpo**
(intelligenza, connessioni tentacolari). Sistema **dual-theme**: arancio/ambra per i
**worker**, blu per gli **employer**.

Direzione estetica: hand-drawn ma pulito, palette morbida/delicata, icone e illustrazioni
custom, font **Outfit** (alternative: Satoshi / General Sans).

## Stack tecnico

- **Frontend**: React 18 + TypeScript + Vite 5 (plugin SWC)
- **UI**: Tailwind CSS 3 + shadcn/ui (Radix UI) + `lucide-react`
- **Animazioni**: `framer-motion` (già installato) + `canvas-confetti`
- **Mappa**: `mapbox-gl` + `react-map-gl` (token via edge function `get-mapbox-token`)
- **Backend**: **Supabase** (auth, DB Postgres, RLS, edge functions)
- **Data**: `@tanstack/react-query`
- **Form**: `react-hook-form` + `zod`
- **Routing**: `react-router-dom` v6
- **Build platform**: **Lovable** (le modifiche fatte su Lovable vengono committate in automatico nel repo; le modifiche locali pushate si riflettono su Lovable)

## Comandi

```sh
npm i            # installa dipendenze (o: bun install)
npm run dev      # dev server → http://localhost:8080
npm run build    # build produzione
npm run lint     # eslint
npm run preview  # preview build
```

## Struttura

```
src/
  pages/          # Index (mappa), Lista, Annunci, CreateJob, Messaggi,
                  # Profilo, PublicProfile, Settings, EditProfile, Auth,
                  # Onboarding, NotFound
  components/
    map/          # InteractiveMap, SearchBar, JobDetailsSheet, EmployerJobsDrawer,
                  # EmployerGroupMarker  (cuore geolocalizzato dell'app)
    layout/       # Header, MainLayout, PageTransition, bottom nav
    chat/         # MessageBubble  (chat worker↔employer)
    applications/ # ApplicationCard (candidature)
    jobs/ profile/ onboarding/ reviews/ tags/ skeletons/ auth/ ui/(shadcn)
  hooks/          # useAppTheme (dual-theme), useAuth, ...
  contexts/       # UserContext (role: worker | employer)
  integrations/supabase/  # client.ts, types.ts (generati)
  lib/            # tagColors.ts, utils
supabase/
  migrations/     # SQL migrations (RLS incluse)
  functions/get-mapbox-token/  # edge function per il token Mapbox
public/images/    # logo-worker.svg, logo-employer.svg, logo-employer.jpg
```

Route con bottom nav (`TAB_ROUTES` in `App.tsx`): `/ /lista /annunci /messaggi /profilo`.
Tutte le route (tranne `/auth` e `/onboarding`) sono dietro `ProtectedRoute`.

## Sistema di temi (IMPORTANTE)

Il dual-theme è centralizzato in `src/hooks/useAppTheme.tsx`.
- `workerTheme` usa i token `primary` / `accent` / `secondary` (arancio/ambra)
- `employerTheme` usa i token `employer` / `employer-50/100/700/800` (blu)
- I colori sono definiti come CSS variables in `src/index.css` e mappati in `tailwind.config.ts`
  (namespace `employer` e `brand.yellow` / `brand.orange`)

**Regola:** NON hard-codare colori arancio/blu nei componenti. Usare `useAppTheme()` e le sue
classi (`theme.primary`, `theme.headerBg`, ecc.) oppure `getColor(workerColor, employerColor)`.
Un bug ricorrente da evitare: pulsante "indietro" arancio in contesto employer (deve essere blu).

## Stato attuale (aggiornato: luglio 2026)

**Piano di esecuzione a 10 fasi:**
1. ✅ **Bug fix (Fase 1 completata)** — commit `bf51341 "fix: risolti bug fase 1"`.
   Risolti: dialog recensione incoerente per i worker a fine job; sezioni Messaggi/Lista
   rotte da una dipendenza circolare in una policy RLS Supabase (fix via chat Lovable +
   migration `20260403000000_drop_circular_rls_policy.sql`).
2. ⏳ **Logo e brand identity** ← PROSSIMA FASE (dopo le rifiniture qui sotto)
3. Redesign icone
4. Applicazione brand identity via Claude Code
5. Illustrazioni custom
6. Miglioramenti UX/UI
7. Animazioni (Framer Motion ora; After Effects + Lottie poi)
8. Pagamenti Stripe
9. Gamification
10. Conversione app nativa con Despia

### ⚠️ Modifiche NON committate nel working tree
Al momento ci sono ~26 file modificati e non committati (pass di theming/branding su tutta
l'app: `useAppTheme`, `index.css`, `tailwind.config.ts` + ritocchi diffusi). È il lavoro di
una sessione precedente rimasto sospeso. **Decidere se committarli** prima di procedere
(vedi "Come committare" sotto). File nuovi non tracciati: `public/images/`, `.claude/`.

## Prossimi passi immediati (le rifiniture prima della Fase 2)

1. ✅ **Logo provvisorio** — FATTO (luglio 2026): sostituiti `public/images/logo-worker.svg`
   e `logo-employer.svg` con le nuove versioni wordmark (da `LOGO/logo_workerD.svg` arancio
   `#f6a24d` e `logo_employerD.svg` blu `#6e97cc`). Ingranditi: Header `h-8`→`h-14`
   (allineato a sinistra, `-ml-1` per allineamento ottico), Auth `h-14`→`h-20`. Fixato il bug in `Auth.tsx`: il logo era hard-coded su worker e non
   cambiava colore col ruolo — ora `src` dipende da `selectedRole` (employer=blu, altrimenti
   arancio). Logo ingrandito a `h-14` (`-ml-1`) anche in `Messaggi.tsx` e `Profilo.tsx`.
   `Settings.tsx` è rimasto `h-8` (layout con back button accanto). Tutte le pagine
   commutano worker/employer via `isEmployer`.
2. ✅ **Dialog employer arancioni → blu** — FATTO: in `Messaggi.tsx` i 3 pulsanti pieni dei
   dialog (Conferma Assunzione, Concludi Lavoro→Conferma, "Sì, rimuovi" annuncio dalla mappa)
   erano hard-coded `bg-primary` (arancio). Ora usano il pattern `isEmployer ? bg-employer... :
   bg-primary...`. Nota aperta: i pulsanti `variant="outline"` (Annulla / No tieni visibile)
   hanno bordo neutro ma in hover usano `bg-accent` (arancio) anche in employer — da valutare
   se renderli blu.
3. ✅ **Rimosso box "Genova Centro / N impieghi disponibili"** — FATTO: era il `<div>` a
   `bottom-4 left-4` in `InteractiveMap.tsx`, non interattivo, presente sia in worker che
   employer. Rimosso (il fallback `MapFallback` senza token è rimasto invariato).
4. **Altri fix UI / mini bug** — *(da dettagliare da parte di Tommaso)*.

## Bug importanti (sessione luglio 2026)

### ✅ Freeze dopo inattività / cambio tab (deadlock auth) — FIX APPLICATO
**Sintomo:** dopo qualche minuto di inattività o uscendo/rientrando nella tab, l'app si
freezava e non caricava più le pagine; solo un hard refresh la sbloccava.
**Causa:** in `UserContext.tsx` il callback di `supabase.auth.onAuthStateChange` era `async`
e faceva `await fetchProfile()` (→ `supabase.from(...)`). Supabase tiene un lock (Web Locks
API) durante il callback: chiamare una query supabase lì dentro causa un **deadlock** silenzioso
(nessun errore in console). Al refresh del token (che scatta proprio al ritorno sulla tab) la
sessione restava appesa → tutte le query in loading infinito.
**Fix:** callback reso sincrono e chiamate supabase differite fuori dal lock con
`setTimeout(() => { ... }, 0)`. Inoltre `QueryClient` (`App.tsx`) ora ha
`refetchOnWindowFocus: false` + `staleTime` per evitare la raffica di refetch al focus.
**Da verificare:** riprodurre (lasciare la tab in background e tornare) e confermare che non
si freeza più. Test di conferma del deadlock: `await navigator.locks.query()` da freezata
mostrava `held`/`pending` popolati; da sana è `{held: [], pending: []}`.

### ✅/⏳ Storico orfano: annunci mostrati come "Lavoro"/"Attività" (+ errori 406)
**Sintomo:** nello storico candidature/lavori alcune voci mostrano "Lavoro" / "Attività"
invece del titolo reale; in console raffica di `406 (Not Acceptable)` su `GET .../jobs`.
**Causa:** quando un employer cancella un annuncio, le candidature restano orfane (perdono il
titolo). `WorkerJobHistory.tsx` faceva `.single()` sul job cancellato → PostgREST risponde
**406** (0 righe); `job` diventa `null` → UI cade sul fallback "Lavoro"/"Attività".
**Fix applicati:**
- `.single()` → `.maybeSingle()` in `WorkerJobHistory.tsx` (niente più 406 in console). ✅
- **Snapshot**: nuova migration `20260710000000_add_application_snapshot.sql` aggiunge
  `job_title` + `employer_name` alla tabella `applications`, con backfill delle righe il cui
  annuncio esiste ancora. Il codice ora **salva lo snapshot** alla candidatura
  (`JobDetailsSheet.tsx`) e lo **legge** con fallback in `WorkerJobHistory.tsx`,
  `ApplicationCard.tsx`, tipo `useApplications.ts`, `types.ts`. ✅ (codice)

> ⚠️ **ORDINE DI DEPLOY OBBLIGATORIO** per lo snapshot: applicare PRIMA la migration su
> Supabase (via Lovable o `supabase db push`), POI fare `git push` del codice. Il codice
> scrive `job_title`/`employer_name` in `applications.insert(...)`: se le colonne non esistono
> ancora nel DB, **la candidatura fallisce**. Le candidature verso annunci già cancellati
> restano "Lavoro" (dato irrecuperabile); tutte le nuove avranno il titolo corretto per sempre.

> Nota per Claude: quando Tommaso fornisce i dettagli dei punti 2 e 3, sostituire i
> "(da dettagliare)" qui sopra con la descrizione precisa, così restano in memoria.

## Come committare (da fare da terminale/desktop di Tommaso)

Le modifiche sospese vanno salvate su git. Comandi consigliati:

```sh
git status                     # rivedere cosa è cambiato
git diff                       # ispezionare le modifiche
git add -A
git commit -m "chore: theming/branding pass (sessione precedente)"
git push origin main           # push già autorizzato (PAT configurato)
```

Il push su `origin main` è già permesso (vedi `.claude/settings.local.json`).

## Convenzioni & preferenze di lavoro

- Commit message in italiano, stile `tipo: descrizione` (es. `fix:`, `chore:`, `feat:`).
- Tommaso preferisce **critica diretta e onesta** rispetto alla validazione; pianificazione
  strutturata e per fasi; iterazione visiva round-by-round su logo/icone.
- Già esperto di Adobe (Illustrator; After Effects in pipeline).

## Note & sicurezza

- **Attenzione**: il remote git contiene il Personal Access Token GitHub in chiaro
  (`git remote -v`). Non condividere l'output di quel comando né il file `.git/config`.
- `.env` presente in locale (non committato). Contiene le chiavi Supabase/Mapbox.
- GitHub: utente `tommybds06`, repo `genoa-gigs-map-40`.
- Migrations Supabase gestite localmente ma applicate spesso via Lovable (accesso diretto
  a Supabase non sempre disponibile).
