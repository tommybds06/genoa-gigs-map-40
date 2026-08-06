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

### ⚠️ TYPECHECK — il comando ovvio è SBAGLIATO

```sh
npx tsc --noEmit                      # ❌ NON CONTROLLA NIENTE
npx tsc -p tsconfig.app.json --noEmit  # ✅ questo
```

`tsconfig.json` ha `"files": []` e solo `references`, quindi il primo comando compila
zero file ed esce sempre in silenzio. Durante la sessione di agosto 2026 ho letto quel
silenzio come "tutto a posto" per ore, e sono passati due errori veri (un componente
usato senza import → crash della sezione Messaggi, e un `e.target` inesistente nei tipi
di react-map-gl). **Vale la pena aggiungere uno script `"typecheck"` in `package.json`.**

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

## Sistema di temi e palette CARTA (IMPORTANTE — riscritto agosto 2026)

Il dual-theme è centralizzato in `src/hooks/useAppTheme.tsx`; i token in `src/index.css`
e `tailwind.config.ts`.

### Il modello mentale: inchiostro su cartoncino avorio

Non "UI su bianco". Le superfici sono **carta** (fondo) e **foglio** (le card, appena più
chiare); la gerarchia la fa il **bordo**, non un salto di tono. Il "nero" dell'app è un
**bruno**, mai `#000`.

| Token | Valore | Uso |
|---|---|---|
| `--paper` | `#F4EEE2` avorio | fondo app |
| `--paper-sheet` | `#FAF5E9` | card (stacco 1,07 dal fondo) |
| `--paper-sunken` | `#E8E1D1` | incavi, campi, tab inattive |
| `--paper-line` | `#DACFB8` | bordi |
| `--ink` | `#382D24` | testo — 11,6 su carta |
| `--ink-soft` | `#746759` | testo secondario — 4,9 |

### ⚠️ LA REGOLA CHE SPIEGA TUTTO IL RESTO

**Arancio e blu di brand sono pastello e NON reggono testo bianco.** Bianco su arancio
dà **2,07:1** (serve 4,5), bianco su blu **3,03:1**. Con `--ink` sopra danno **6,45** e
**4,41**.

- colori **pieni** (`--primary`, `--employer`) → solo campiture, con testo **scuro**
  (`--primary-foreground` e `--employer-foreground` sono ink, non bianco)
- per **testo e tratti sottili** esistono `--brand-orange-ink` `#A7531B` (4,66) e
  `--brand-blue-ink` `#355D8D` (5,86)

Nessuna scelta di fondo risolve il problema: desaturando la crema da 76% a 20% il
contrasto passa da 1,89 a 1,84. È la luminanza dei colori di brand, non lo sfondo.

### Stati = inchiostri, non semafori

Non seguono il dual-theme (un errore è terracotta sia per worker che per employer).

| Stato | Token | Prima era |
|---|---|---|
| Assunto | `--success` `#337154` verde bosco | `#22C55E` (contrasto 1,87) |
| Rifiutato | `--danger` `#AD3E2A` terracotta | `#EF4444` |
| In attesa | `--warning` `#A57727` ocra | `#FFC105` (contrasto 1,45) |
| Concluso | `--neutral` `#8C7D69` grigio caldo | `#6B7280` freddo |

**`src/components/ui/StatusBadge.tsx` è la sorgente unica.** Regola: **pieno** = stato
attivo (Assunto, Accettato), **contorno** = in sospeso o concluso. Prima ogni schermata
se li ridisegnava e "Concluso" era verde nei messaggi e grigio nelle candidature.

### Altre regole

- **NON hard-codare colori** Tailwind grezzi (`orange-500`, `green-600`) né hex. Usare
  `useAppTheme()` o i token. Attenzione alle varianti direzionali: `border-t-blue-600`
  sfugge ai grep fatti su `border-`.
- Ombre **brune, corte e strette** (`--shadow-*`): il nero sfocato faceva sembrare le
  card rettangoli sospesi invece che fogli appoggiati.
- **Grana/texture: decisa NO** — vedi il commento in `index.css`, che elenca i cinque
  tentativi falliti. Il gancio `--grana` resta ma è `none`.
- **`.card-tilt`** sul contenitore di una lista, **`.tilt-l`/`.tilt-r`** sulla singola
  card: rotazione minima alternata + raggi irregolari. È una `transform` (GPU) e
  rispetta `prefers-reduced-motion`.
- Bug ricorrente da evitare: pulsante "indietro" arancio in contesto employer.

## Stato attuale (aggiornato: agosto 2026)

**Piano di esecuzione a 10 fasi:**
1. ✅ Bug fix (commit `bf51341`)
2. ✅ Logo e brand identity
3. ✅ Redesign icone (set completo custom theme-aware)
4. 🔄 **Applicazione brand identity / UX — IN CORSO**, vedi sotto
5. Illustrazioni custom (empty states, splash, onboarding)
6. Miglioramenti UX/UI
7. Animazioni (Framer Motion ora; After Effects + Lottie poi)
8. Pagamenti Stripe
9. Gamification
10. Conversione app nativa con Despia

---

## 🔄 HANDOFF — Fase 4 (leggere per riprendere in nuova chat)

### Fatto in questa sessione (TUTTO DA COMMITTARE, ~25 file)

**Blocco funzionale** (da `brand/POLITASK-audit-ux.md`, punti 1-7):
- **Messaggi**: aggiunta anteprima ultimo messaggio + orario; il badge contatore
  mostrava `0` per un classico di JS (`{n && n > 0 && ...}` con `n=0` **stampa lo zero**
  — serve `n > 0`); conversazioni concluse compresse invece che sbiadite.
- **Date**: `getTimeAgo` era duplicato in 4 file con gli stessi difetti ("0 min fa",
  "1 ore fa", relativo infinito fino a "187 giorni fa"). Ora `src/lib/dates.ts` è la
  sorgente unica: relativo sotto i 30 giorni, assoluto sopra. Testato su 23 casi.
- **Candidature**: regola unica delle affordance — chevron se la riga porta da qualche
  parte, icona chat se la conversazione esiste, niente cursore se non porta da nessuna
  parte (prima c'erano righe con `cursor-pointer` che al tap non facevano nulla).
- **Esci** rimosso dal Profilo (era duplicato con Impostazioni).
- `.single()` → `.maybeSingle()` in `useChats.ts` (stesso bug 406 già visto).
- **AvatarPreview**: l'anteprima appariva tutta scura perché `DialogOverlay` è `z-[80]`
  e il contenuto era `z-50`; e cliccando fuori si apriva la chat perché **React propaga
  gli eventi lungo l'albero dei componenti, non del DOM** (il portal non isola).
  Aggiunta una X esplicita. ⚠️ Escape non chiude: il componente non usa `DialogContent`.

**Palette carta** — vedi la sezione "Sistema di temi" sopra. Sweep completo: **zero**
colori Tailwind grezzi rimasti nell'app.

**Mappa** (`src/lib/mapPaperStyle.ts` + `InteractiveMap.tsx`) — PROTOTIPO a runtime:
- base **`outdoors-v12`** e non `streets-v12`, perché ha curve di livello e rilievo,
  che sono il segno grafico della cartina;
- la terra prende lo stesso avorio del fondo app: la mappa non è un riquadro estraneo;
- si RICOLORA, non si toglie. Primo tentativo: avevo nascosto i POI e schiacciato
  l'hillshade a 0.06 → mappa grigia e triste, l'opposto del brand. POI e nomi delle
  attività **sono informazione utile** e restano;
- a Genova il centro storico è quasi tutto pedonale e Mapbox lo classifica `path`:
  dipingerlo come i sentieri di montagna anneriva ogni caruggio → le pedonali sono
  chiare come le strade;
- POI sotto zoom 15,5 e curve di livello sotto 13: la confusione veniva dalla **densità**
  delle etichette, non dal colore;
- zoom control nascosti (su mobile si pizzica).

⚠️ È un prototipo: **nasconde invece di eliminare**, quindi Mapbox scarica comunque tutti
i layer. Da congelare in uno stile pubblicato da Mapbox Studio. In dev stampa in console
`[Politask] stile cartina: N proprietà su M layer`.

### Decisioni di brand prese

**Font — ibrido.** Outfit resta per il testo (legge bene a 12px). Per il display:
- Gabarito ha vinto il confronto a 4 (`brand/confronto-font.html`), ma Tommaso ha
  ridisegnato il logo con **Shinjo** (Creative Market, hand-drawn, un solo peso, set
  accentato italiano completo);
- **Shinjo va usato SOLO per i titoli grandi**, mai sotto i ~18px: l'irregolarità
  diventa rumore;
- ~12 stringhe fisse (titoli pagina, empty state, onboarding) saranno **lettering
  disegnato da Tommaso** come SVG; il dinamico resta su font.

**⚠️ LICENZA FONT — da chiudere PRIMA del deposito EUTM.** I termini di Creative Market
permettono l'uso di un font in un logo *solo se* l'asset è modificato **e** non è
l'elemento dominante, e in caso di registrazione come marchio impongono di **disconoscere
il font**. Nel wordmark le lettere SONO dominanti → la condizione non è soddisfatta così
com'è. Via d'uscita: usare Shinjo come base e **ridisegnare le lettere** finché sono
originali. Serve Desktop (~$17) + Webfont (~$14); la licenza App (~$133) riguarda
l'embedding nel binario, cioè la Fase 10 con Despia.
Nota: negli USA il disegno di un carattere non è protetto da copyright, ma **nell'UE sì**
(design comunitario anche NON registrato, 3 anni, senza depositi) — quindi il "ricalco in
Illustrator" è molto più rischioso qui che nella giurisdizione da cui viene quella prassi.

**Logo.** Tommaso ha tolto le ventose dalla P e ridisegnato il tentacolo a spirale, con
il contorno esterno dell'icona che diventa un **pin** (sintesi riuscita). ⚠️ Parere non
recepito: togliere le ventose costa distintività proprio ora che le lettere sono di una
foundry e vanno disconosciute — tutta la distintività del marchio si concentra sulla P.
Proposta: rimettere 3-4 ventose grandi solo sull'arco esterno. Da verificare anche
l'occhiello centrale a 40px.

**Componenti hand-drawn — outline-forte.** Direzione scelta: contorni spessi, riempimenti
piatti, niente ombre. Tecnica validata in `brand/prototipo-cornici.html`: SVG montati con
`border-image` a **9 sezioni**, così gli angoli non si deformano mentre i lati si
allungano. Servono **3 cornici** disegnate da Tommaso (bottone primario, chip, contenitore
empty state) in **2 misure di tratto** — sotto i 40px di altezza la cornice grande non ci
sta. Vincolo: i 32px centrali di ogni lato devono restare quasi dritti, perché è la banda
che viene allungata. Tutto il resto (card lista, sezioni profilo, input) resta bordo CSS:
venti cornici disegnate in una lista sono rumore.

**Texture: NO, decisione chiusa.** Cinque tentativi, vedi il commento in `index.css`.

### Documenti in `brand/`
- `POLITASK-audit-ux.md` — **25 problemi UI/UX** su 11 schermate, per gravità. I punti
  1-7 sono fatti; **8-25 sono ancora aperti** ed è la lista da cui ripartire.
- `palette-carta.html`, `carta-tuner.html`, `texture-tuner.html`, `confronto-font.html`,
  `prototipo-cornici.html` — strumenti di scelta, non deliverable.

### ⚠️ Prossimi passi

1. **Committare** (~25 file modificati + `src/lib/dates.ts`, `src/lib/mapPaperStyle.ts`,
   `src/components/ui/StatusBadge.tsx`). Cancellare `public/textures/`.
2. **Audit punti 8-25**: tre stili di input diversi, gerarchia dei titoli rovesciata,
   header blu solo in CreateJob, logo `h-8` in Settings, gradiente nei bottoni di Auth,
   icone grigie in Settings, tag "Settimane" blu tra i ruoli, emoji 🌊 nel claim.
3. **Tre migration** rimandate: trigger su `chats.updated_at` (l'ordinamento delle chat
   è fatto client-side come rattoppo), colonna `is_system` su `messages` (ora i messaggi
   automatici sono riconosciuti per stringa in `dates.ts`), vista per l'N+1 di `useChats`
   (4 query per conversazione).
4. **Cornici e lettering** da Tommaso.
5. **Mappa** da congelare in Mapbox Studio.

### Punti aperti minori
- `variant="outline"` in hover diventa arancione anche in contesto employer.
- Soglia mezza-stella recensioni: 0.5.
- Teaser video (tentacolo che si arrotola) → Fase 7. Higgsfield: disdire il trial.
- Landing/waitlist su `politask.app`.
- Contrasti al limite: ink su blu employer **4,41** (serve 4,5) e tile accent **4,24**.

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

> Nota: la sezione "Prossimi passi immediati" che stava qui è stata assorbita
> nell'HANDOFF Fase 4 (agosto 2026) — quei punti erano tutti chiusi.

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

**Lezioni di metodo dalla sessione di agosto 2026** (costate tempo a Tommaso):
- **Verificare col comando giusto.** Vedi l'avvertenza sul typecheck sopra: un comando
  che esce in silenzio non è una conferma finché non si è visto fallire almeno una volta.
- **Giudicare alla scala d'uso.** La texture è stata tarata guardando uno zoom 4×, dove
  qualunque cosa sembra plausibile. Le anteprime vanno generate a dimensione reale
  (schermata da ~390px con i componenti veri).
- **Rinominare gli asset quando cambiano.** Il browser mette in cache per URL: un file
  sostituito senza cambiare nome fa sembrare che le modifiche non abbiano effetto.
- **Fermarsi dopo il secondo tentativo fallito** e chiedersi se lo strumento è quello
  giusto, invece di tarare parametri. Sulla texture ci sono voluti cinque giri per
  arrivare a "non serve".
- **Gli script di sostituzione automatica vanno verificati, non solo eseguiti.** Due
  guardie sbagliate hanno stampato "✓" senza fare nulla, e il risultato è stato un
  crash in produzione locale.

## Note & sicurezza

- **Attenzione**: il remote git contiene il Personal Access Token GitHub in chiaro
  (`git remote -v`). Non condividere l'output di quel comando né il file `.git/config`.
- `.env` presente in locale (non committato). Contiene le chiavi Supabase/Mapbox.
- GitHub: utente `tommybds06`, repo `genoa-gigs-map-40`.
- Migrations Supabase gestite localmente ma applicate spesso via Lovable (accesso diretto
  a Supabase non sempre disponibile).
