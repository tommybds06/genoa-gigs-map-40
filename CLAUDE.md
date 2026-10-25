# Politask — Memoria di progetto

> Letto automaticamente a ogni avvio nella cartella del progetto. È la memoria
> persistente: va aggiornato quando cambia lo stato del lavoro o quando si
> impara qualcosa che costerebbe tempo riscoprire.

---

# 1. Che cos'è Politask, e perché

**Un marketplace di lavoretti per Genova**, che mette in contatto studenti in
cerca di occasioni con chi le offre — bar, negozi, privati. L'esperienza è
**mobile-first e centrata sulla mappa**: apri l'app e vedi *dove* ci sono
lavori, non una lista.

Il target sono studenti universitari genovesi, Gen Z. Da lì discendono la
navigazione a swipe, la bottom bar, i drawer, e il tono: diretto, senza gergo
da risorse umane.

Il nome gioca su due piani: **poli-** come molteplicità, e il **polpo** —
intelligenza pratica, tentacoli che arrivano dappertutto. È anche un animale
che a Genova significa qualcosa.

**Sistema a due ruoli**, presente ovunque nel codice: **worker** (arancio) e
**employer** (blu). Non è solo un colore: cambiano campi, schermate, testi e
permessi.

## Direzione estetica

**Hand-drawn ma pulito.** Non "sciatto per sembrare umano": i tratti sono
disegnati a mano da Tommaso in Illustrator, ma il sistema sotto è rigoroso.
Palette morbida, icone e illustrazioni custom, niente stock.

Il modello mentale è **inchiostro su cartoncino avorio**, non "UI su bianco".
Vedi la sezione 5.

---

# 2. Come si lavora qui

Tommaso è **già esperto di Adobe** (Illustrator quotidiano, After Effects in
pipeline) e disegna lui gli asset. Il ruolo di Claude è: capire il vincolo
tecnico, tradurlo in una specifica disegnabile, montare, e dire onestamente
quando qualcosa non funziona.

**Dal 4 ottobre 2026 il progetto si lavora in Claude Code** (prima in Cowork).

**Preferenze esplicite:**

- **Critica diretta, non validazione.** Se una cosa non va, dirlo e spiegare
  perché — meglio se con un numero.
- **Pianificazione per fasi**, con piani precisi prima di partire.
- **Iterazione visiva round-by-round** su logo, icone, componenti.
- Commit message **in italiano**, stile `tipo: descrizione` (`fix:`, `feat:`,
  `chore:`).

**Metodo di revisione (settembre 2026 in poi).** Si va **schermata per
schermata**. Tommaso manda uno screenshot annotato:

- **testo rosso senza punto interrogativo** = decisione presa, si esegue;
- **testo rosso con punto interrogativo** = dubbio, e vuole un parere
  argomentato basato su principi di UI/UX e su cosa fanno le app di successo,
  non un "come preferisci".

Ha chiesto esplicitamente di **non assecondare**: se una sua proposta ha un
difetto, va detto (è successo col pin coi prezzi — proposta mia, bocciata da lui
con un'obiezione giusta che non avevo considerato).

## ⚠️ Lezioni di metodo pagate care

Sono qui perché sono costate ore, non per completezza.

1. **Verificare col comando giusto.** Un comando che esce in silenzio non è una
   conferma finché non lo si è visto fallire almeno una volta. Vedi il typecheck
   in §3.
2. **Giudicare alla scala d'uso.** La texture è stata tarata a zoom 4×, dove
   tutto sembra plausibile. Le anteprime vanno generate a **390px reali**.
3. **Rinominare gli asset quando cambiano.** Il browser mette in cache per URL:
   un file sostituito senza cambiare nome fa sembrare che non succeda niente.
   Da qui `logo-*-v2.svg`, `shinjo-v1.woff2`.
4. **Fermarsi dopo il secondo tentativo fallito** e chiedersi se lo strumento è
   sbagliato, invece di tarare parametri. Sulla texture ci sono voluti cinque
   giri per arrivare a "non serve".
5. **Gli script di sostituzione vanno verificati rileggendo il file.** Due
   guardie sbagliate hanno stampato "✓" senza fare niente → crash in locale.
6. **Leggere il valore vero invece di dedurlo.** Il callback di Google l'avevo
   dedotto dal pannello Lovable: era sbagliato, e bastava leggere la barra degli
   indirizzi.
7. **Un valore di ripiego può essere una scrittura distruttiva.** `?? "worker"`
   sembrava innocuo e sovrascriveva il ruolo vero (§9).
8. ⚠️ **Un'anteprima con dati finti non deve MAI toccare oggetti globali.**
   Il 22–23 ottobre le anteprime della chat e del profilo sostituivano
   `window.fetch` per rispondere con dati finti, e lo facevano **al livello
   del modulo**. Ma l'anteprima era importata in `App.tsx`, quindi quel codice
   girava appena si apriva l'app, su qualunque pagina: per Tommaso, entrato
   col suo account worker, il profilo era «Masetto», gli annunci veri erano
   spariti dalla mappa, le recensioni pure. Il database non è mai stato
   toccato (la sostituzione inghiottiva anche le scritture) e cancellare i
   file non bastava: nelle schede già aperte la sostituzione restava in
   memoria fino a un ricaricamento completo. Regola: i dati finti si mettono
   nella **cache di react-query** o in un **Provider** dentro il componente
   dell'anteprima, mai in `window`, `fetch`, `localStorage` o simili; e se
   proprio serve intercettare la rete, dentro un `useEffect` del componente,
   rimettendo l'originale nel cleanup.
9. **`git pull --rebase` prima di ogni push.** Lovable committa da solo sullo
   stesso `main` (§12): pushare senza prima riallinearsi vuol dire farsi
   rifiutare il push, o peggio fare un merge che riporta indietro un suo fix.
   ⚠️ Fino a settembre la regola era «niente comandi git da parte di Claude»,
   ma era un limite dell'ambiente **Cowork**: lì `git status` lasciava un
   `.git/index.lock` che il sandbox non riusciva a cancellare, e ha bloccato due
   commit. In Claude Code quel problema non c'è e git si usa normalmente.

---

# 3. Stack e comandi

- **Frontend**: React 18 + TypeScript + Vite 5 (SWC)
- **UI**: Tailwind 3 + shadcn/ui (Radix) + `lucide-react` (in via di sostituzione
  con le icone custom)
- **Animazioni**: `framer-motion`, `canvas-confetti`
- **Mappa**: `mapbox-gl` + `react-map-gl`, token via edge function
  `get-mapbox-token`; `supercluster` per le zone (§6)
- **Backend**: Supabase (auth, Postgres, RLS, edge functions, Storage)
- **Data**: `@tanstack/react-query` · **Form**: `react-hook-form` + `zod`
- **Routing**: `react-router-dom` v6
- **Piattaforma**: **Lovable**, con commit automatici bidirezionali sul repo
- **Drizzle** (`drizzle-kit`, `drizzle-orm`, `postgres`, `drizzle.config.ts`):
  **aggiunto da Lovable** a ottobre 2026 per registrare le migration che
  applica (§13). Non lo usa il codice dell'app. ⚠️ Lovable aggiorna solo
  `bun.lock`, non `package-lock.json`: dopo un suo commit che tocca le
  dipendenze, `npm i` in locale.

```sh
npm i
npm run dev      # → http://127.0.0.1:8080   (vedi §10: NON localhost)
npm run build
npm run lint
```

## ⚠️ TYPECHECK — il comando ovvio non controlla niente

```sh
npx tsc --noEmit                       # ❌ compila ZERO file, esce in silenzio
npx tsc -p tsconfig.app.json --noEmit   # ✅ questo
npx tailwindcss -i src/index.css -o /dev/null   # il CSS il typecheck non lo vede
```

`tsconfig.json` ha `"files": []` e solo `references`. Quel silenzio è stato letto
come "tutto a posto" per ore, e sono passati due errori veri: un componente usato
senza import (crash della sezione Messaggi) e un `e.target` inesistente nei tipi
di react-map-gl.

---

# 4. Struttura

```
src/
  pages/          Index (mappa), Lista, Annunci, CreateJob, Messaggi, Profilo,
                  PublicProfile, Settings, EditProfile, Auth, ScegliRuolo,
                  Onboarding, NotFound
  components/
    map/          InteractiveMap, SearchBar, JobDetailsSheet,
                  EmployerJobsDrawer, EmployerGroupMarker, LocationMiniMap
    layout/       Header, MainLayout, PageTransition, BottomNav, SwipeNavigator,
                  SplashScreen (§17)
    bacheca/      employer: Bacheca, CartellinoCard, SchedaCartellino,
                  AggiungiCartellino, PromemoriaScadenza, SagomaCartellino ·
                  worker: BachecaWorker, LavoroCard, SagomaNegozio (§16)
    chat/         MessageBubble (§18)
    applications/ jobs/ profile/ onboarding/ reviews/ tags/ skeletons/
    auth/ icons/  ui/ (shadcn)
  hooks/          useAppTheme (dual-theme), useAuth, useChats, useJobs,
                  useCartellini, useLavoriWorker, useMisure, useMapboxToken
  contexts/       UserContext (role: worker | employer) — il profilo dell'utente
                  sta QUI, già in memoria: non rileggerlo nelle pagine (§12)
  lib/            dates.ts, tagColors.ts, percorsoAccesso.ts, jobIcons.ts,
                  bacheca.ts (azioni e regole della bacheca, §16),
                  tratto.ts + formaCartellino.ts + formaNegozio.ts (le sagome
                  calcolate), recensione.ts (aprire la recensione a richiesta)
  integrations/   supabase/ (client, types generati), lovable/ (auto-generato)
  assets/         politask-logo-animato.json — il Lottie dello splash (§17)
supabase/
  migrations/     SQL + RLS — le versioni COMMENTATE, scritte da noi
  functions/get-mapbox-token/
drizzle/
  migrations/     quello che Lovable ha davvero eseguito (§13)
public/
  images/cornici/ le sagome e i bordi disegnati (§6)
  fonts/          shinjo-v1.woff2 / .woff  (§13)
brand/            audit, specifiche disegni, guide, strumenti HTML
```

Rotte con bottom nav (`TAB_ROUTES` in `App.tsx`): `/ /lista /annunci /messaggi
/profilo`. Tutte tranne `/auth` sono dietro `ProtectedRoute`.

⚠️ **`PageTransition` mette `pb-16`** sulle pagine con tab: lo spazio per la
bottom nav è già riservato lì. Non ricompensarlo altrove — è successo due volte
con l'attribuzione Mapbox, finita a metà schermo.

⚠️ **`MainLayout` mette `overflow-hidden`**: una pagina con `min-h-screen` viene
**tagliata** invece di scorrere, e il bottone in fondo diventa irraggiungibile.
Le pagine lunghe usano `h-full overflow-y-auto` (Onboarding, ScegliRuolo).

---

# 5. Design system — la palette CARTA

Token in `src/index.css`, dual-theme in `src/hooks/useAppTheme.tsx`.

Le superfici sono **carta** (fondo) e **foglio** (le card, appena più chiare);
la gerarchia la fa il **bordo**, non un salto di tono. Il "nero" è un **bruno**.

| Token | Valore | Uso |
|---|---|---|
| `--paper` | `#F4EEE2` | fondo app |
| `--paper-sheet` | `#FAF5E9` | card |
| `--paper-sunken` | `#E8E1D1` | incavi, tab inattive |
| `--paper-line` | `#DACFB8` | bordi CSS da 1px |
| `--paper-edge` | `#9C8B74` | il filo **disegnato** delle card, 1,1px |
| `--field` | `#F7E7D6` / `#E4EBF5` | fondo dei campi, **segue il ruolo** |
| `--ink` | `#382D24` | testo — 11,6 su carta |
| `--ink-soft` | `#746759` | testo secondario — 4,9 |

## ⚠️ LA REGOLA CHE SPIEGA TUTTO IL RESTO

**Arancio e blu di brand sono pastello e non reggono testo bianco.** Bianco su
arancio = **2,07:1** (serve 4,5); bianco su blu = **3,03**. Con `--ink` sopra
danno **6,45** e **4,41**.

- colori pieni → **campiture con testo scuro**
- per testo e tratti sottili esistono `--brand-orange-ink` `#A7531B` (4,66) e
  `--brand-blue-ink` `#355D8D` (5,86)
- le campiture blu che portano testo o icone usano **`--employer-700`** `#4075B5`
  (bianco: 4,74), **non** il pastello

⚠️ **Nessuna scelta di fondo risolve il problema.** Desaturando la crema il
contrasto passa da 1,89 a 1,84. Provato anche a **scurire** il fondo (86%): il
margine tagliato delle card si vedeva, ma la carta si avvicinava in luminanza
all'arancione e i due si impastavano. È la luminanza dei colori di brand.
**`--paper` non si tocca.**

## 🧪 Esperimento in corso: la gerarchia SCURA (23 ottobre)

Tommaso: gli piacciono gli inchiostri di ruolo (`#A7531B`, `#355D8D`) e ha
chiesto di provare a **invertire la gerarchia**: pieni scuri col foglio
sopra (4,95 e 6,22:1), pastello come evidenza. Un interruttore solo:
`data-gerarchia="scura"` su `<html>` in `index.html` (toglierlo = si torna
com'era). Token in `index.css` («la gerarchia»): `--su-ruolo`,
`--evidenza-*`, `--su-evidenza`, `--letto-su-worker`, e `--secondary`
(l'ambra: barra in basso, «Registrati»). Ciò che è un FILE col colore
dentro ha la sua copia scura: il logo (`logo-*-scuro-v1.svg`, scelto da
`srcLogo` in `lib/gerarchia.ts`) e il tratto del campo attivo
(`bordo-campo-attivo*-scuro-v1.svg`, girato nel CSS). ⚠️ Avevo escluso i
profili leggendo «tieni i profili così» come «lasciali chiari»: voleva dire
che lì gli scuri sono GIÀ i colori principali. Rotellina e freccia del
profilo pubblico restavano pastello. Esclusione tolta. ⚠️ Non è
un'inversione pura: testi e icone su carta restano scuri, il pastello come
testo non si legge. Resta pastello il Lottie dello splash (file di Tommaso).
**Committata e pushata il 24 ottobre** come base («si parte da qui»).

⚠️ **Google e Apple in Auth sono `ghost`, SENZA contorno**: a schermo non
l'hanno mai avuto (la classe c'era, ma senza `relative` il disegno non si
vedeva). Quando il contorno è diventato di serie sugli `outline` è comparso
anche lì, e Tommaso non l'aveva chiesto.

## Il bug ricorrente numero uno

**Il fondo segue il ruolo, il testo no.** Successo su: pulsante indietro, icona
mail in Impostazioni, marker della mappa, punta del pin, badge del gruppo, pin
del LocationPicker, tessere dei ruoli, sottotitolo e bottone in Onboarding.

Il sintomo è sempre lo stesso: `text-primary-foreground` (che è l'inchiostro)
su un fondo `employer-700` → nero su blu scuro. Quando si tocca un componente,
vale la pena controllare che la coppia fondo/testo segua entrambe il ruolo.

Aggiunti a settembre: la **freccia di invio** in Messaggi (`bg-employer-700`
scritto a mano, testo lasciato al `variant` → freccia bruna su blu) e lo stato
**evidenziato dei marker**, che è lo stesso difetto al rovescio — tratto da 3px
e icona in `primary`, cioè l'arancio pastello a **1,9:1** su `bg-card`, e
arancione anche in un'app blu.

**La regola pratica**: non scrivere `bg-<colore-ruolo>` in un `className`.
`theme.btnFilled` porta la coppia fondo+testo insieme ed è l'unico modo di non
rifare questo errore; sui fondi chiari vanno gli inchiostri
(`primary-strong` / `employer-800`), mai i pastelli.

## ⚠️ Il blu non è un colore libero: i tag di durata

I tag sono di due famiglie — **ruolo** ("Cameriere") e **durata** ("Una
tantum"). La durata era **blu**, e il blu in questa app è l'identità
dell'employer: un worker si trovava sulla stessa riga un chip arancione e uno
blu, cioè tutti e due i colori di ruolo insieme, su una schermata dove il blu
significa «l'altra parte». Una dimensione tassonomica si era presa un colore che
nel sistema ha già un significato.

Ora la distinzione la fa la **superficie**, non la tinta (`lib/tagColors.ts`):

| Famiglia | A riposo | Selezionato |
|---|---|---|
| Ruolo | `bg-accent` + `accent-foreground` — **segue il ruolo** | pieno di ruolo |
| Durata | `bg-paper-sunken` + `text-ink` — **10,3:1** | `bg-ink text-paper` |

Effetto collaterale utile: i chip adesso leggono uguale nei due temi, mentre
prima il blu restava blu anche in un'app tutta arancione.

## Stati = inchiostri, non semafori

Non seguono il dual-theme: un errore è terracotta per tutti.

| Stato | Token | Prima era |
|---|---|---|
| Assunto | `--success` `#337154` | `#22C55E` (1,87) |
| Rifiutato | `--danger` `#AD3E2A` | `#EF4444` |
| In attesa | `--warning` `#A57727` | `#FFC105` (1,45) |
| Concluso | `--neutral` `#8C7D69` | `#6B7280` freddo |

**`ui/StatusBadge.tsx` è la sorgente unica.** Regola: **pieno forte** = attivo,
**pieno tenue** = in sospeso o concluso. Erano a contorno, ma un filo da 1px
accanto a una card tagliata a mano era la cosa più "fatta col CSS" della
schermata: convertiti ai fondi `-soft`.

## Tipografia

- **Shinjo** (hand-drawn, un peso solo) su **titoli, etichette dei form e
  bottoni**. Mai sotto i ~18px: l'irregolarità diventa rumore.
- **Outfit** per il testo di lettura. ⚠️ Provato **Gabarito** al suo posto e
  riportato indietro: vince come display, ma sul testo minuto è meno neutro.
- Classi: `.titolo-sezione`, `.titolo-vuoto`, `.titolo-mini`.
- `font-synthesis: none` — con un peso solo, il finto grassetto imbratta.

## Altre regole

- **Niente colori Tailwind grezzi** (`orange-500`) né hex nei componenti. Solo
  token o `useAppTheme()`. ⚠️ Le varianti direzionali sfuggono ai grep:
  `border-t-employer` non compare cercando `border-employer`.
- Ombre **brune, corte, strette**. Il nero sfocato faceva sembrare le card
  rettangoli sospesi invece che fogli appoggiati.
- **Texture/grana: NO, decisione chiusa.** Cinque tentativi documentati nel
  commento in `index.css`. Il gancio `--grana` resta ma è `none`.
- `.card-tilt` sul contenitore di una lista, `.tilt-l`/`.tilt-r` sulla singola
  card: rotazione minima alternata. È una `transform` (GPU) e rispetta
  `prefers-reduced-motion`.

---

# 6. Le sagome disegnate — il cuore visivo

Tommaso disegna in Illustrator, Claude monta con **ritaglio a 9 sezioni**: i
quattro angoli restano in scala uniforme, solo le bande centrali si allungano.
**Un disegno copre tutte le larghezze.**

| File | Tavola | Dove |
|---|---|---|
| `sagoma-bottone.svg` | 323×99, pillola | bottoni pieni |
| `sagoma-chip.svg` | 161×49, pillola | chip, tag, badge di stato |
| `sagoma-tag.svg` | 120×100 | tessere quadrate con icona |
| `sagoma-quartiere.svg` | 250×56 | righe larghe e basse |
| `sagoma-card-{a,b,c,d}.svg` | 360×121 | tutte le `.material-card` |
| `bordo-card-{a,b,c,d}.svg` | 360×121 | il filo sopra le card |
| `bordo-bottone.svg` | 323×99 | contorno dei bottoni **vuoti** |
| `bordo-campo*.svg` | 250×56 | tratto dei campi, riposo e attivo |
| `linea-divisoria.svg` | 241×3,5 | separatori |

Le **foto** (carosello del profilo, griglia della gallery) non hanno un file
proprio: `.sagoma-foto` rilegge `sagoma-card-a.svg`, e `.sagoma-foto-b` la `c`
per alternare nelle griglie. Un secondo disegno solo per le foto darebbe due
angoli diversi a due oggetti che stanno uno sotto l'altro nella stessa
schermata. ⚠️ Sulle foto la maschera **è** il contenitore: niente `border`,
niente `rounded-*`, niente ombra.

⚠️ La maschera taglia anche l'**anello di focus** (è un `box-shadow`). Nella
griglia della gallery la maschera sta sul div interno e il focus sul bottone
esterno, se no il bersaglio da tastiera sparisce.

## Le due forme piccole: il CERCHIO IMPERFETTO e la TESSERA (dal 20 ottobre)

Nate nella scheda del lavoro del worker, piaciute a Tommaso, estese al resto.

**Cerchio imperfetto — TUTTI gli avatar** (`ui/avatar.tsx` →
`hooks/useCerchioImperfetto` → `lib/formaCerchio.ts`). Un cerchio a mano con
lo stesso tratto delle sagome della bacheca (vertice ogni ~5,5 px, ±0,5 px;
lo scarto si riduce sotto i 40 px), calcolato dal diametro vero e applicato
con `clip-path: path()`. Prop **`seme`** sull'`Avatar`: in una lista ognuno
il suo (l'id della persona), se no tremolano tutti uguali.

- ⚠️ **Non `.sagoma-foto`**: quella ha angoli da 28 px e su 56 px sembra un
  cerchio solo perché i quattro angoli si toccano; da 80 px in su diventa un
  quadrato smussato. Verificato a 16, 44, 56, 80 e 128 px.
- ⚠️ **Niente `border`, `ring`, `shadow` sugli avatar**: il ritaglio li taglia
  a tratti. Tolti da Profilo pubblico (bordo bianco + ombra), Annunci, scheda
  annuncio, drawer dei gruppi, anteprima chat (anello di pressione).
- Il disegno `sagoma-cerchio.svg` che si aspettava da Tommaso **non serve
  più**; resta una possibilità se si vuole un tracciato disegnato invece che
  calcolato.

**Tessera — i contenitori di icone** (`ui/Tessera.tsx`: `Tessera` bottone,
`TesseraIcona` solo disegno, `TesseraIndietro` la freccia; misure `md` 48 e
`lg` 56). È `.sagoma-tag` su un quadrato PICCOLO: gli angoli del disegno sono
da 33 px, su 48–56 non ci stanno (33+33 = 66), il browser li riduce e il
quadrato diventa un «sasso». ⚠️ Sopra ~66 px compaiono i lati dritti: per
questo le misure sono solo due.

- ⚠️ **Colori: PIENO CHIARO del ruolo + icona in INCHIOSTRO** (`bg-primary` /
  `bg-employer` + `text-ink`), come i giorni selezionati nella scheda lavoro.
  Prima era fondo `accent` con l'icona in `primary-strong` (`#A7531B`):
  Tommaso ha visto due arancioni nella stessa scheda e ha chiesto «tutto tono
  worker chiaro». L'arancio chiaro non può stare sull'icona (su accent ~1,6:1,
  sparisce), quindi va sul fondo. Inchiostro su arancio 6,45, su blu 4,41.
- **Una sola freccia indietro in tutta l'app**: `TesseraIndietro`, senza
  scritta. Erano sei diverse (chat, profilo pubblico con «Indietro» a pillola,
  Impostazioni, Modifica profilo, Crea annuncio, dettaglio Annunci). Resta a
  parte solo «Torna indietro» nella pagina d'errore del profilo, che è un
  bottone d'azione, non navigazione.
- **Invio in chat**: tessera con `InvioIcon` (con `Loader2` +
  `classeIcona="animate-spin"` durante l'invio), per worker ed employer.
- **Ruoli in MODIFICA profilo** (`TagSelector` con `roleLayout="grid"`): una
  tessera da 56 col nome sotto, 4 per riga — al posto dei «rettangolini
  storti» (la stessa sagoma stirata a ~100×95). Selezionata: pieno chiaro +
  inchiostro; no: `accent` + `ink-soft`. ⚠️ **In LETTURA i ruoli restano i
  chip di testo** (`TagBadges`): una prima versione li aveva fatti tessere
  anche lì, ed era sbagliato — Tommaso voleva la tessera solo in modifica.
- Altri posti: anteprima profilo in chat (Messaggio/Profilo con didascalia),
  testa delle schede cartellino e lavoro (Chat/Profilo), ruolo nella scheda
  lavoro, icona in Impostazioni, icone degli stati vuoti (Lista ×3,
  Messaggi, bacheca worker). Restano tondi i contatori e la X di chiusura:
  sono segnali o comandi, non contenitori.

## Il PIN della mappa — disegnato (dal 22 ottobre)

`pinmappa2.svg` di Tommaso (la seconda versione, più tonda: la prima,
`pinmappa.svg`, era 48×64) al posto del cerchio + triangolo CSS, su **tutti e
quattro** i pin: annuncio, gruppo (`EmployerGroupMarker`), selettore di
posizione (`LocationPicker`) e minimappa della scheda (`LocationMiniMap`).
Forma in `lib/formaPin.ts`, componente `map/PinMappa.tsx` (la minimappa crea
il marker senza React e usa `pinSvg()`).

- **Solo la forma è cambiata**: colori, larghezze (48 / 40) e stati sono
  quelli di prima, tradotti da `bg-`/`border-` a `fill-`/`stroke-`. Alto 59,5
  su 48 (la proporzione della tavola, 447×554).
- **L'icona sta nel centro del cerchio superiore, calcolato**: il cerchio più
  grande inscritto nella forma, campionando il tracciato → (224, 220), raggio
  219. Non il centro della tavola, che cadrebbe più in basso. Se il disegno
  cambia, va ricalcolato (lo script è nella storia della sessione: campiona
  le curve e cerca il punto più lontano dal contorno).

## Le ZONE della mappa — annunci vicini in un pin solo (dal 22 ottobre)

Tommaso: «quando si fa dezoom… si sovrappongono creando un brutto effetto».
`lib/zoneMappa.ts` + `map/ZonaMarker.tsx` + `map/ZonaAnnunciDrawer.tsx`.

- **Due livelli.** Gli annunci dello stesso LOCALE restano un gruppo
  (`groupJobsByEmployer`, `EmployerGroupMarker`): hanno le stesse coordinate,
  nessuno zoom li separerebbe. I gruppi VICINI si uniscono in ZONE con
  **supercluster** (la libreria di Mapbox, 8.0.1 — era già dentro
  mapbox-gl, ora dichiarata con `@types/supercluster`).
- **Raggio 48 px = la larghezza di un pin**, sullo zoom INTERO per difetto.
  Oltre lo zoom 17 niente zone.
- ⚠️ **Il raggio da solo NON basta**: è un cerchio, il pin no (48 × 60, più
  6 px di numero in alto e a destra). Due pin uno sopra l'altro a 50–60 px
  si accavallavano (screenshot di Tommaso). Dopo supercluster c'è
  `separaSovrapposti`: confronta i RETTANGOLI veri a coppie (il numero solo
  dove c'è — darlo a tutti univa pin singoli a 55 px che non si toccavano) e
  unisce chi si toccherebbe, con 3 px d'aria. Misurato allo zoom intero per
  difetto, dove i pin sono più vicini: avvicinando le distanze crescono, quindi
  vale a ogni zoom. Verificato misurando i rettangoli a schermo su 14 livelli
  di zoom: zero coppie che si toccano, aria minima 4 px.
- **Pin di zona**: la VALIGETTA (`GenericoIcon`: dentro ci sono mestieri
  diversi) + il numero di ANNUNCI (non di locali). Toccandolo: la lista della
  zona, con le card della Lista (`JobsList`); se il quartiere è uno solo è il
  titolo, e sotto ogni annuncio c'è l'attività (`sottoTitolo="attivita"`)
  invece del quartiere ripetuto.
- **Con una ricerca o un filtro attivo**, nelle due liste che si aprono dalla
  mappa (zona e locale con più annunci) chi corrisponde va **in cima** (sort
  stabile: dentro i due gruppi resta l'ordine dal più recente) e la sua
  tessera è **evidenziata**: pieno `primary-strong` / `employer-800` con
  l'icona `paper-sheet` — i colori del pin evidenziato sulla mappa, così il
  legame tra mappa e lista si vede. `TesseraIcona evidenziata`. Il drawer del
  locale usava ancora l'icona pastello su `accent` (~1,6:1): ora è la tessera.
- **Il numero** è `NumeroPin`, in **Shinjo**, uguale per zone e gruppi di un
  locale: un numero sopra un pin vuol dire sempre «N annunci». Cifra a 18 px
  (la regola: Shinjo mai sotto i ~18), tondo da 26.
- **La chiave di un marker dipende dagli annunci che contiene** (primo id +
  numero), non dall'id di supercluster, che cambia a ogni livello di zoom:
  una zona con gli stessi annunci resta lo stesso marker e non si rianima.
- **Animazione: due metà che si incrociano**, 240 ms, curva ease-out
  «quint» (`DURATA_PIN`, `CURVA_PIN`), rispetta «riduci movimento».
  - chi ENTRA (`IngressoPin`) parte trasparente: zoom avanti → dal punto
    della zona da cui esce; zoom indietro → la zona nuova si gonfia da 0,8;
  - chi ESCE (`PinUscente`) resta per la durata dell'animazione: se si unisce
    scivola dentro la zona sfumando, se si divide sfuma sul posto.
  ⚠️ La prima versione animava solo chi entrava: i pin vecchi sparivano di
  colpo («scattosa», Tommaso). Gli uscenti nascono in un `useLayoutEffect`,
  non `useEffect`: così compaiono nello stesso fotogramma in cui spariscono
  quelli veri, mai un fotogramma vuoto. Da dove
  veniva un annuncio lo dice `posizioniPrima`, aggiornato in un EFFETTO e non
  nel `useMemo` (StrictMode calcola i memo due volte: al secondo giro il ref
  sarebbe già aggiornato). Verificato misurando le animazioni attive sui pin
  appena nati durante un pizzico vero, non a occhio.
- **Evidenziato** = `stroke` da 6 px con `vector-effect: non-scaling-stroke`,
  tagliato sulla forma con un `clipPath`: ne resta la metà interna, 3 px
  DENTRO il pin, come il `border` del cerchio di prima.
- L'ombra era un `box-shadow` sul cerchio: sulla forma è un `drop-shadow`.
- La punta è in basso al centro: l'`anchor="bottom"` dei Marker resta giusto
  senza spostamenti.
- La **minimappa** (23 ottobre) ha i colori del pin della mappa grande, per
  ruolo, passati come variabili CSS perché il marker nasce fuori da React.
  Prima: arancio scritto a mano con l'icona BIANCA (2,07:1) e arancione
  anche per l'employer. Il riquadro è ritagliato come le foto
  (`.sagoma-foto`), senza bordo CSS.

## Le schede dal basso: bordo a mano e FESSURA (dal 21 ottobre)

Ogni `DrawerContent` (scheda annuncio, cartellino, lavoro, gruppo, ricerca…)
disegna la sua carta con **`ui/SagomaScheda.tsx`** → `lib/formaScheda.ts`:
bordo in alto e angoli (18 px) con lo stesso tratto delle card
(`lib/tratto.ts`), e al posto della maniglia grigia una **fessura 56×12
tagliata nella carta**, come la presa di una scatola di cartone — vuota
davvero (`evenodd`): ci si vede la mappa sotto. Un'ombra sottile in
inchiostro sul bordo alto, dentro il buco, la fa leggere come un taglio.

- Il drawer ha `bg-transparent`, niente `border`/`rounded-t`: il disegno sta a
  `-z-10` dentro DrawerContent (che è `fixed z-50`, quindi fa da contesto).
- Si trascina dalla fessura come prima: l'elemento c'è, è il disegno a essere
  vuoto. Lo spazio in testa è `TESTA_SCHEDA` (28 px).
- ⚠️ Il tremolio spostava i lati fino a 1,1 px dentro lo schermo, e da lì si
  vedeva la mappa: due fasce piene sui lati (`fasce`) sotto gli angoli.
- ⚠️ vaul allunga la scheda in basso con un `::after` a `background:
  inherit`: con la scheda trasparente diventava trasparente anche lui. Regola
  in fondo a `index.css`, con un attributo in più del selettore di vaul.

## Il punto che decide tutto: MASCHERA, non bordo

Il colore del componente viene **ritagliato** sulla forma
(`mask-border` / `-webkit-mask-box-image`). Il margine è tagliato a mano e **non
c'è nessuna linea sopra**. Il colore resta quello del tema, quindi hover e
dual-theme continuano a funzionare da soli.

Provato prima come `border-image`, cioè un contorno bruno: **bocciato**, leggeva
neobrutalista — tratto uniforme + riempimento piatto + niente ombra è
letteralmente la definizione di quello stile. Provato anche il filo tenue
nell'`-ink` del ruolo: bocciato uguale. **La forma va bene, la linea sopra no.**

## ⚠️ Trappole del montaggio

- **`fill` nello slice è obbligatorio**: senza, viene mascherato solo il bordo e
  il centro del componente sparisce.
- **La fetta verticale non può superare metà altezza** dell'immagine, se no il
  browser la ridimensiona da solo e la forma cambia.
- **`mask-border` è Blink/WebKit.** Tutto dentro `@supports`: altrove resta il
  raggio CSS e non si rompe niente. Con Despia si finisce su WebKit.
- **Niente `box-shadow` sui componenti mascherati**: la maschera taglia anche
  l'ombra. Coerente con la direzione outline-forte.
- **Su `<input>` e `<textarea>` la maschera NON viene dipinta** — sono elementi
  rimpiazzati. Serve un contenitore.
- **Quattro varianti ribaltate** per le card, alternate ogni quattro
  (`nth-of-type`): cinque copie identiche di fila leggono come fotocopia.
- Se il componente ha una maschera, un `::after` con `border-image` viene
  **tagliato a metà**: resta solo la metà interna del tratto. È voluto — serve a
  ottenere un filo sottile da un disegno più spesso.

## Regola generale: OGGETTI disegnati, INCAVI lisci… con un'eccezione

Card, bottoni, chip e tessere hanno il margine tagliato. I campi **all'inizio
no**, poi Tommaso ha voluto riprovare e con un tratto **molto sottile** funziona:
adesso i campi hanno il contorno disegnato su un **guscio sovrapposto**
(`.campo-guscio`, generato da `ui/input.tsx`, `ui/textarea.tsx`, `ui/select.tsx`).

⚠️ Il bordo va sul guscio e non sul campo: su un `<input>` alto 48px servirebbero
24px di bordo per rendere l'angolo alla misura vera, e non resterebbe spazio per
il testo. Primo tentativo fatto così → rettangoli squadrati.

⚠️ Il guscio è `position: relative`, quindi entra nello strato degli elementi
posizionati e **copre le icone `absolute` messe prima nel DOM**. A quelle serve
`z-10` (è successo in Auth e nella barra di ricerca).

## Il filo delle card: conta lo spessore più della tinta

Quattro giri. A **2,3px** un tratto chiaro è troppo largo per leggere come linea
e troppo chiaro per leggere come contorno → qualunque colore sembra beige o
grigio. A **1,1px** il problema sparisce e resta solo da tarare il buio:
`#CBB284` beige, `#7C6A55` troppo scuro, **`#9C8B74` quello attuale**. Il colore
sta nei file e nel token `--paper-edge`, **da tenere in sincrono**.

---

# 7. Bottoni, campi, chip

- **`ui/button.tsx` è la sorgente unica.** Raggio `xl` come i campi, altezze
  36/44/56 con `default` a 44 (minimo per un bersaglio di tocco).
- Sagoma solo su `default` e `destructive` — i pieni. Su `ghost` e `link` non
  c'è niente da ritagliare; su `outline` c'è invece il **contorno disegnato**
  (`bordo-bottone.svg`), perché senza linea un bottone vuoto non esisterebbe.
  ⚠️ **Fino al 23 ottobre questo era vero solo sulla carta**: il contorno
  ce l'avevano i due bottoni di Auth, con le classi scritte a mano; gli
  altri 15 `outline` avevano il bordo CSS da 1 px. Ora sta nei
  `compoundVariants` (`default` → `bordo-btn-md`, 21 px; `lg` →
  `bordo-btn`, 27 px). Su `sm` no: su 36 px il tratto sparisce. Un
  `border-*` passato nel `className` rimette il bordo CSS SOTTO il disegno:
  non passarlo. Fuori da `@supports` (Firefox desktop) il bottone vuoto
  resta senza contorno: accettato, l'app gira su WebKit.
- **Cancellate `.material-btn*` e `.material-input`**: non le usava nessuno ed
  erano un secondo sistema con raggi diversi, pronto a essere ripreso per errore.
- I campi usano `Input` / `Textarea` / `SelectTrigger`, che si generano il guscio
  da soli: i campi nuovi ereditano tutto senza toccare nulla.
- `senzaTratto` sull'`Input` toglie il contorno dove l'altezza non è quella
  standard (nessuno lo usa più, ma resta come via d'uscita).
- **Date → `ui/CampoData.tsx`**, mai `<Input type="date">` nudo. Il calendario
  «spostato a destra» che si vedeva era l'**indicatore nativo** del browser,
  non il nostro: `.campo-data::-webkit-calendar-picker-indicator` (in fondo a
  `index.css`, fuori dai layer) lo rende trasparente ma lo lascia cliccabile,
  sopra c'è la nostra `CalendarioIcon` a `right-4`, allineata al padding del
  campo. Su Safari/WebKit l'indicatore nativo non c'è e resta solo la nostra.

---

# 8. Icone

Set custom in `components/icons/uiIcons.tsx` e `roleIcons.tsx`, mono e
`currentColor`, quindi seguono il tema da sole.

Aggiunte a settembre: `GloboIcon`, `InstagramIcon`, `HashtagIcon`, `PiuIcon`.

**Le uniche icone non nostre sono i marchi Google e Apple** nei bottoni di
accesso: vanno riprodotti come sono, ridisegnarli nel nostro stile sarebbe un
uso scorretto.

⚠️ Un simbolo dev'essere **lo stesso ovunque**: il pin generico di lucide era
rimasto in cinque punti diversi mentre altrove c'era il nostro. Se cambia
disegno da una schermata all'altra smette di essere un simbolo.

Ripescate dopo: la **`Briefcase`** nel marker di gruppo (un locale con due
annunci mostrava un'icona di libreria mentre quello con un annuncio mostrava la
nostra — il simbolo cambiava in base al *numero* di annunci) e l'**orologio** nel
drawer del gruppo. Il marker di gruppo ora mostra l'icona del mestiere se i
lavori sono tutti uguali, il generico se sono mischiati.

⚠️ Restano lucide in `MapPlaceholder.tsx`, che però si vede solo se il token
Mapbox non arriva.

Aggiunte a ottobre: **`EuroIcon`** (in `uiIcons.tsx`) e le **tre puntine**
della bacheca in `icons/puntine.tsx` (§16). Le puntine non sono mono: la testa
è `currentColor`, l'**ago resta in inchiostro**. Poi **`SalvaIcon`** (il
dischetto) accanto a ogni «Salva»: Profilo, Modifica profilo, cartellino.
`CuoreIcon` e `CalendarioIcon` sono già i disegni di Tommaso (confrontati
con gli SVG che ha mandato il 21 ottobre: identici).

---

# 9. `data-ruolo` sulla radice — e la trappola del ripiego

`UserContext` scrive `document.documentElement.dataset.ruolo`, e `index.css`
ribalta `--ring`, `--accent` e `--field` sotto `[data-ruolo="employer"]`. Serve
per i token che non passano dal tema JS.

⚠️ **`UserContext` riscrive solo QUANDO IL RUOLO CAMBIA.** Quindi chiunque altro
scriva quell'attributo con un valore di ripiego lo rompe in modo permanente:
`Auth` faceva `= selectedRole ?? "worker"`, e in accesso (o al ritorno da Google,
dove nessun ruolo è stato scelto lì) sovrascriveva il ruolo vero. Il ruolo non
era cambiato → nessuno rimetteva a posto → campi arancioni in un'app blu per
tutta la sessione.

Regola attuale: `Auth` e `ScegliRuolo` scrivono **solo dopo una scelta
esplicita**; `Auth` rimette `worker` **solo a sessione chiusa** (se no chi era
employer si ritrova la schermata di accesso in blu).

---

# 10. Accesso — email, Google, Apple

## Il percorso

Con OAuth **entrare e iscriversi sono la stessa chiamata**: Supabase crea
l'utente se non c'è. La differenza la fa il profilo.

**`src/lib/percorsoAccesso.ts` è la sorgente unica** dello smistamento, usata da
`Auth`. Tre uscite: `/scegli-ruolo`, `/onboarding`, `/`.

## ⚠️ Perché non basta guardare il ruolo

Nel database c'è un trigger **`handle_new_user`** che crea la riga in `profiles`
appena nasce l'utente e, se nei metadati non trova un ruolo, ci mette
**`'worker'` d'ufficio**. Con l'email il ruolo lo passiamo noi; con Google non
arriva mai. Quindi chi entra con Google si ritrova già etichettato worker senza
aver scelto niente, e un controllo del tipo "manca il ruolo?" non scatta mai.

Il segnale vero è il **quartiere**: viene chiesto sia nell'iscrizione via email
sia in `ScegliRuolo`. Se un utente arrivato dai social non ce l'ha, quella
schermata non l'ha mai vista.

## ⚠️ NON aggiungere la guardia in `ProtectedRoute`

Provato e rimosso subito: mandava alla scelta ruolo **tutti**, anche chi entrava
con email e aveva il profilo completo da mesi. In `UserContext`, `hasLoaded`
diventa `true` anche senza utente e da lì resta `true` per sempre, mentre
`profile` torna `null` a ogni cambio di sessione finché la nuova lettura non
finisce. La coppia "caricato sì, profilo nullo" sembra "non ha un profilo" ma
vuol dire "sto aspettando".

## ⚠️ Chiamata diretta a Supabase, non l'helper di Lovable

`src/integrations/lovable/index.ts` è auto-generato e **non va usato**:

1. porta il browser su `/~oauth/initiate`, un endpoint dei server di Lovable: in
   locale non esiste → 404 dopo un accesso riuscito;
2. il giro passa da `oauth.lovable.app`, quindi l'utente vede un dominio Lovable
   durante l'accesso. In un prodotto che deve sembrare suo, no.

Per lo stesso motivo in Lovable va scelto **«Your own credentials»** e non
«Managed by Lovable»: con le credenziali di Lovable, Google mostra il nome di
*Lovable* nella schermata di consenso.

## Configurazione — guida in `brand/POLITASK-guida-accesso-social.md`

I punti che fanno perdere tempo:

- **Il callback da registrare su Google è quello di Supabase**:
  `https://cggwpktrbsphwvkrnrvj.supabase.co/auth/v1/callback`. Il pannello
  Lovable mostra `oauth.lovable.app/callback`, che vale solo con le credenziali
  condivise. Se sbagli: `redirect_uri_mismatch`.
- **Lovable rifiuta `localhost`**: negli indirizzi ammessi va `127.0.0.1`, e
  l'app va aperta su `http://127.0.0.1:8080` — se apri `localhost` l'origine non
  combacia e Supabase **ripiega sul Site URL**, che è l'anteprima di Lovable. È
  la causa del "dopo l'accesso mi riporta alla versione di Lovable".
- Per pubblicare l'app su Google servono home page, privacy e termini su un
  **dominio verificato**. Finché non ci sono, si resta in **Test** — che funziona
  benissimo, fino a 100 account.
- Il logo caricato su Google **obbliga alla verifica** e blocca la pubblicazione.
- Finché l'app non è verificata, la schermata di consenso mostra il dominio
  tecnico (`cggwpktrbsphwvkrnrvj`) invece di «Politask». Normale, si risolve al
  lancio con la verifica del marchio.

---

# 11. La mappa

Base **`streets-v12` standard**. Nessuno stile custom.

## ⚠️ Due tentativi di "mappa disegnata", entrambi abbandonati

1. **Ricolorazione nella palette carta** → grigia e triste; e i sentieri chiari
   annerivano ogni caruggio, perché a Genova il centro storico è classificato
   `path` da Mapbox.
2. **Motivi disegnati come `fill-pattern`** (onde, alberelli, casette registrate
   a runtime con `addImage`) → «fa schifo».

**La lezione:** una mappa vera è **densa di informazione** — strade, nomi, POI.
Riempirla di motivi decorativi la rende illeggibile senza renderla più bella. Il
carattere hand-drawn va messo in ciò che sta **sopra** la mappa: marker, sheet,
bottoni. `src/lib/mapPaperStyle.ts` resta nel repo ma non è importato da nessuno.

⚠️ Se si riprova: **non leggere `e.target`** in `onLoad`/`onStyleData` — i tipi
di react-map-gl non lo dichiarano e il typecheck fallisce (successo due volte).

## Altre cose imparate sulla mappa

- **`initialViewState` vale solo al primo montaggio.** La posizione GPS arriva
  dopo, e la mappa è già disegnata su Genova: per questo spesso non era centrata.
  Ora c'è un `easeTo` quando la posizione arriva, **una volta sola** — se
  l'utente ha già trascinato, un secondo aggiornamento non deve riportarlo
  indietro sotto le dita.
- **Tornando sulla mappa si riparte da DOVE SI ERA** (`vistaRicordata` in
  `InteractiveMap.tsx`, 23 ottobre). Ogni cambio di pagina rimonta la mappa:
  tornando dalla scheda o dal profilo di chi aveva pubblicato, ripartiva dal
  centro di default e saltava sul GPS — chi esplorava un'altra zona si
  ritrovava a casa. Ora a ogni `onMoveEnd` si salvano centro e zoom in una
  variabile del modulo (non `window`, §2 lezione 8), e al ritorno si parte da
  lì senza il salto sul GPS. Solo la prima apertura della sessione si centra
  sull'utente. Verificato rimontando la mappa: il punto «tu sei qui» torna
  allo stesso pixel, ferma, trascinata e allontanata col pizzico.
  - ⚠️ Anche `zoomIntero` nasce dalla vista di partenza: partendo da
    `initialZoom` (13) con una vista ricordata a 14, le zone erano calcolate
    come a 13 finché non si toccava la mappa.
  - ⚠️ Il centramento sul GPS si tenta anche in `onLoad`: se il GPS
    rispondeva PRIMA che la mappa esistesse (prima apertura, token ancora in
    arrivo), lo spostamento non trovava la mappa e nessuno lo ritentava.
  - `reuseMaps` riapplica `initialViewState` quando riusa la mappa: letto nel
    sorgente di react-map-gl 7.1.9 (`mapbox.js`, `static reuse`).
- **L'attribuzione Mapbox non va spostata**: `PageTransition` riserva già `pb-16`,
  quindi la nav non la copre. Provato due volte a compensare e ogni volta il logo
  finiva a metà schermo.
- **Il font della mappa lo disegna Mapbox**, non il browser: per usare Shinjo
  bisogna caricarlo su Mapbox Studio, cioè su server di terzi. **Bloccato dalla
  licenza** — vedi §13.
- **Niente nuvoletta sull'annuncio.** Il `Popup` di Mapbox è stato tolto: il pin
  apre direttamente la scheda, che si ferma bassa. Vedi §15.
- Marker con prezzo (stile Airbnb): **proposto e bocciato**, giustamente. Il
  campo della paga è libero ("9€/h", "150/settimana"), quindi la larghezza del
  marker sarebbe imprevedibile. Airbnb può farlo perché il prezzo ha un formato
  imposto.

---

# 12. Trappole tecniche ricorrenti

- **`.single()` su zero righe → 406.** Usare `.maybeSingle()`. Incontrato quattro
  volte: storico candidature, `useChats`, profilo in `EditProfile`, e il
  controllo dopo il login (dove per un utente Google la riga non c'è ancora).
- **Tailwind elimina le classi che non trova nei sorgenti.** Le classi iniettate
  a runtime dalle librerie (`.mapboxgl-ctrl-*`) dentro `@layer components`
  **spariscono in silenzio**. Vanno scritte **fuori da ogni `@layer`**, in fondo
  al file. Stesso trucco per vincere sulle utility senza `!important`: gli stili
  non incapsulati in un layer battono i layer per costruzione.
- **In `.gitignore` i commenti stanno solo su una riga propria**: in fondo alla
  riga vengono presi come parte del percorso e la regola non fa niente.
- **React propaga gli eventi lungo l'albero dei componenti, non del DOM**: un
  portal non isola i click.
- ⚠️ **`AnimatePresence mode="wait"` fa SFARFALLARE il cambio pagina.** Con
  `wait` la pagina vecchia completa l'uscita (opacità → 0) e solo *dopo* monta
  la nuova: fra le due c'è un fotogramma in cui non c'è nessuna pagina, si vede
  il fondo nudo di `MainLayout` e poi ricompare tutto. Due dissolvenze in fila
  con un buco in mezzo, a 0,1s l'una: l'occhio legge un lampo, non una
  transizione. Senza `mode` (default `sync`) le due pagine si incrociano.
  Qui è sicuro perché `PageTransition` è `absolute inset-0`. `wait`
  contraddiceva anche le varianti di swipe, scritte perché una esca *mentre*
  l'altra entra.
  ⚠️ **Da ottobre il tap sulla bottom nav non anima più niente**: anche la
  dissolvenza incrociata `sync` da 0,1s era un difetto, perché a metà ci sono
  DUE pagine intere al 50%, cioè due header e due contenuti sovrapposti, e il
  browser compone due schermate mentre React monta la nuova. Ora il cambio è
  istantaneo, come nelle tab bar native (iOS, WhatsApp, Instagram). Restano
  animati solo lo swipe tra tab e i dettagli che entrano da destra, dove
  l'animazione accompagna un gesto.
- **vaul e `shouldScaleBackground`**: non fa niente se nel DOM non c'è un
  elemento `[data-vaul-drawer-wrapper]` — c'è un `if (!wrapper) return;` nel
  suo sorgente. Qui non c'è, quindi non è mai stato lui a far lampeggiare
  niente. Verificato leggendo `node_modules/vaul/dist/index.mjs`, non dedotto.
- **`{n && ...}` con `n = 0` stampa lo zero.** Serve `n > 0`.
- **`.safe-top` annulla `pt-*`**: imposta `padding-top: env(safe-area-inset-top)`,
  che nel browser vale 0 e arriva dopo nel CSS. Usare
  `pt-[max(1rem,env(safe-area-inset-top))]`.
- **`preserveAspectRatio="none"`** sulle linee da stirare: senza, allungando la
  divisoria da 241 a 390px il browser la ingrassa da 3,5 a 5,7px.
- **Deadlock auth Supabase**: mai chiamate supabase dentro il callback di
  `onAuthStateChange` — tiene un lock e l'app si freeza in silenzio. Le chiamate
  vanno differite con `setTimeout(..., 0)`. Test: `await navigator.locks.query()`
  da freezata mostra `held`/`pending` popolati.
- **Lovable committa da solo.** Se ricompare un difetto già chiuso, spesso è un
  suo commit. Prima di dare la colpa a un bug, rileggere i file.
- ⚠️ **Il rettangolo azzurro intorno ai drawer è l'outline di sistema.** Radix
  sposta il fuoco sul contenuto appena il drawer si apre e Chrome ci disegna
  intorno il suo anello. Non è un bordo nostro: si toglie con `outline-none` su
  `DrawerContent` (shadcn ce l'ha di serie sul Dialog, sul Drawer no).
- ⚠️ **Un tratteggio col ritaglio a 9 sezioni non regge in verticale.** Il
  bordo tratteggiato delle card (360×121) montato su un rettangolo verticale
  176×248: **i lati sparivano**, sia con `stretch` sia con `round`. Provato a
  390px, non dedotto. Prima soluzione: un disegno alla proporzione vera
  (176×248) scalato in modo uniforme. Dal 20 ottobre, con la forma a
  cartellino da pacco, anche quello è stato sostituito da un tracciato
  calcolato in pixel (§16). Vale per qualunque tratteggio: il 9 sezioni va
  bene solo per tratti continui.
- **Radix `Select` dentro un drawer vaul**: combinazione nota per problemi di
  tocco e scorrimento. Nella scheda del cartellino l'unità di paga è fatta con
  chip, non con un menu.
- **I `Dialog` di Radix si chiudono al `pointerdown` sul document** («clic
  fuori») e mettono `pointer-events: none` sul `body`. Qualunque strato
  sopra un dialog aperto (lo splash, §17) deve fare `stopPropagation` sul
  `pointerdown` e dichiarare `pointer-events: auto`, se no il suo tocco
  chiude il dialog sotto, o non arriva affatto.
- **StrictMode chiama due volte l'inizializzatore di `useState`** (in
  sviluppo). Niente scritture lì dentro: lo splash col video (prima del
  Lottie) scriveva la data di «visto oggi» nell'inizializzatore, e la seconda chiamata leggeva «già
  visto» → in locale non compariva mai. Le scritture vanno in un effetto.
- **Chromium mette in pausa i video senza audio nelle schede non visibili**
  (`play()` → `AbortError: video-only background media was paused to save
  power`). Nel pannello browser di Claude, se è nascosto, il video del
  vecchio splash non partiva mai: non era un bug dell'app. Stesso motivo per cui lì
  `requestAnimationFrame` non scatta: per misurare usare i timer.
- ⚠️ **Un flexbox a altezza fissa non fa uscire il contenuto: lo SCHIACCIA.**
  Nel cartellino a proporzione fissa, aggiungendo 44 px sopra, nome e mestiere
  si sono ristretti fino a sparire, e la misura «l'ultimo elemento sta dentro?»
  diceva sì. Per sapere se un testo entra si confronta `offsetHeight` con
  `scrollHeight` di ogni testo, non la posizione dell'ultimo figlio.
- **Screenshot a misura vera**: Chrome headless su Mac non scende sotto ~500 px
  di finestra, quindi `--window-size=390,…` non dà 390 — e fissare la
  larghezza del contenitore non basta per drawer e overlay, che prendono
  tutta la finestra. Si usa **`node brand/scatta-telefono.mjs <url>
  <file.png>`**: pilota Chrome via DevTools Protocol ed emula un telefono
  vero (390×844, 2×, touch). Per pagine dietro login si monta un'anteprima
  temporanea con dati finti, fuori da `ProtectedRoute`, e poi si toglie.
  ⚠️ Lanciava Chrome con `--disable-gpu`: niente WebGL, quindi **Mapbox non
  partiva** e la mappa restava vuota. Ora usa SwiftShader (WebGL software).
  Opzioni: `POSIZIONE=lat,lng` finge il GPS (la mappa worker si centra
  sull'utente), `PIZZICO=0.74` fa un pizzico vero col dito (anche in fila:
  `PIZZICO=0.55,1.9 ATTESA_DOPO=5000,600`), `PRIMA="js"` esegue codice prima
  dei pizzichi (es. un registratore di eventi), `ESEGUI="js"` dopo, e ne
  stampa il risultato (anche una Promise).
  `CPU=4` rallenta il processore come un telefono di fascia media;
  `IPHONE=1` si presenta come Safari su iPhone (per le librerie che si
  comportano diversamente lì). Per misurare un'animazione: in `PRIMA` un
  ciclo `requestAnimationFrame` che registra posizione o durata di ogni
  fotogramma, in `ESEGUI` la lettura.
  Il pannello browser di Claude, se nascosto, non scarica le piastrelle:
  per la mappa usare questo.
- ⚠️ **`<AnimatePresence initial={false}>` in App.tsx spegne le animazioni
  d'ingresso di TUTTI i `motion.*` dentro le pagine.** Serve a non animare
  la pagina al primo caricamento, ma framer passa quell'`initial={false}`
  per contesto a ogni discendente: un `motion.div` con `initial`/`animate`
  nasce già alla fine. Successo coi pin della mappa: componente montato, zero
  animazioni, `transform: none`. Per animare un ingresso dentro una pagina:
  `element.animate()` nativo in un `useLayoutEffect` (vedi `IngressoPin`),
  o un `AnimatePresence` nuovo attorno.
- **Nel pannello browser con l'emulazione mobile i clic a coordinate
  sbagliano bersaglio** (il viewport emulato viene rimpicciolito per entrare
  nel pannello). Se un clic «non fa niente», riprovare senza emulazione prima
  di cercare il bug nel codice.

---

## ⚠️ Prestazioni: il conto lo fa il RIMONTAGGIO

`PageTransition` smonta e rimonta la pagina intera a **ogni cambio di tab**.
Quindi qualunque `useEffect` che va in rete riparte da zero ogni volta, e
l'utente rivede lo spinner e il salto del contenuto su una schermata che ha
appena visto. **Ogni lettura da Supabase va in react-query**, che ha già
`staleTime: 60s` globale: dalla seconda visita entro un minuto il contenuto c'è
al primo fotogramma.

Casi chiusi a settembre, con i numeri:

- **Token Mapbox** (`hooks/useMapboxToken.ts`): lo chiedevano `InteractiveMap`
  e `LocationMiniMap`, ognuno per conto suo, senza cache. Ogni ritorno sulla
  home = una invocazione della edge function **prima** che la mappa potesse
  disegnarsi, cioè il quadrato grigio «Caricamento mappa...» ogni volta. Ora
  `staleTime: Infinity`, una volta per sessione.
- **Storico lavori del worker**: era un **N+1** — una query per le candidature
  più **due per ognuna** dentro un `Promise.all`. Con 5 lavori completati sono
  **11 giri di rete**, rifatti a ogni apertura del profilo. Ora sono **3 fisse**
  (`.in()` sugli id) e zero se la cache è calda.
- **Media recensioni** in Profilo: stessa storia in piccolo, il numero compariva
  in ritardo e spostava la riga sotto il nome.
- **`backdrop-blur-md` tolto da tutti e 7 gli header e barre fisse.** Stava
  sotto `bg-background/95`, cioè un fondo opaco al 95%: si pagava un filtro a
  tutto schermo **a ogni fotogramma di scorrimento** per un effetto visibile al
  5%. Su mobile è una delle cose più care che esistano.

Casi chiusi a ottobre (Tommaso: «glitcha e lagga ogni volta che cambio
pagina»):

- **Lista rileggeva il profilo dal database a ogni visita**, con `useProfile()`
  (uno `useState` + `useEffect` senza cache). Intanto mostrava lo scheletro, e
  la query dei lavori — che dipende dai tag del profilo — partiva solo dopo.
  Ora legge da `UserContext`, che ce l'ha già. **`useProfile` è stato
  cancellato**: il profilo dell'utente si prende da `useUser()`.
- **Annunci faceva 1 + N query a ogni visita**: gli annunci, poi un conteggio
  per ognuno. Ora è **una query** con `applications(count)`, in react-query,
  con chiave sotto `['jobs', …]` (così la invalida anche chi crea un annuncio
  o assume) e `refetchOnMount: 'always'`: la lista compare subito dalla cache
  e si rilegge in background, perché le candidature le mandano altri in
  qualunque momento.
- **Il cambio tab non anima più** (vedi §12, `AnimatePresence`).

Resta aperto, ed è il pezzo grosso: **ogni cambio tab smonta e rimonta la
pagina intera**, mappa compresa (`reuseMaps` attenua, non risolve). Si risolve
tenendo montate le pagine già visitate invece di smontarle nella transizione.
È un lavoro di struttura, non una riga, e ha effetti da gestire: gli effetti
«al montaggio» non ripartono più, quindi il ritorno da un profilo con
`location.state.returnJob` (Index, Lista) e l'apertura di una chat da
`?chat=` vanno riscritti per reagire al cambio di indirizzo.

---

# 13. Licenze, sicurezza, account

## Font Shinjo — da chiudere prima del deposito EUTM

Creative Market permette l'uso di un font in un logo **solo se** l'asset è
modificato **e** non è dominante, e in caso di marchio impone di **disconoscere
il font**. In un wordmark le lettere *sono* dominanti → la condizione non è
soddisfatta. Via d'uscita: ridisegnare le lettere finché sono originali.

⚠️ Negli USA il disegno di un carattere non è protetto da copyright, **nell'UE
sì** (design comunitario anche non registrato, 3 anni, senza depositi). Il
"ricalco in Illustrator" è molto più rischioso qui che nella giurisdizione da cui
viene quella prassi.

Serve anche la licenza **App** per l'embedding nel binario (Fase 10, Despia), e
un chiarimento sul caricamento su **Mapbox** (hosting di terzi).

**Testo della mail pronto in `brand/POLITASK-mail-licenza-shinjo.md`.** Non c'è
un indirizzo pubblico: si passa dal bottone *Contact* sul profilo Creative
Market. Piano B se non rispondono: **Gabarito**, licenza SIL aperta.

## Sicurezza

- ⚠️ **Il remote git contiene il Personal Access Token in chiaro.** Non
  condividere l'output di `git remote -v` né `.git/config`.
- `.env` in locale, non committato: chiavi Supabase e Mapbox.
- I font **sono committati di proposito** perché il repo è **privato** e senza i
  file Lovable non li ha al build. ⚠️ Se il repo torna pubblico vanno tolti
  **prima**, e non basta cancellarli: restano nella storia.

## Account e infrastruttura

- GitHub: `tommybds06`, repo `genoa-gigs-map-40` (**privato**).
- ⚠️ **Il progetto Supabase è di Lovable, non di Tommaso.** È
  `cggwpktrbsphwvkrnrvj`, creato da **Lovable Cloud**: non compare nel suo
  pannello Supabase e non dà service role key né accesso diretto. Per questo le
  migration si applicano da Lovable. Si può migrare su un progetto proprio dalle
  impostazioni Lovable — **il momento buono è adesso**, con pochi dati dentro.
- Deploy: `git push origin main` → Lovable ricostruisce.

## ⚠️ Ordine di deploy obbligatorio per le migration

**Prima la migration su Supabase, poi il push del codice.** Il codice scrive
colonne che devono già esistere: al contrario, l'operazione fallisce in
produzione (successo con lo snapshot di `applications`).

## Come si applica una migration (da ottobre 2026)

1. Claude la scrive in `supabase/migrations/`, **commentata** e
   **rieseguibile** (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP … IF
   EXISTS`, `ON CONFLICT DO NOTHING`).
2. ⚠️ **Lovable non legge i file del Mac**: legge solo il repo su GitHub. Il
   testo SQL va **incollato** nella sua chat («Esegui questa migration così
   com'è»), oppure il file va pushato da solo prima del codice. La prima volta
   è stato incollato solo il messaggio senza l'SQL, e Lovable ha risposto che
   il file non c'era.
3. Lovable la esegue e la **registra a modo suo** in
   `drizzle/migrations/NNNN_nome.sql`: lo stesso SQL senza commenti, a volte
   con aggiunte (per `cartellini`, due `GRANT` espliciti). **Riportare le
   aggiunte nel file commentato**, così il repo dice cosa c'è nel database.
4. Lovable rigenera `types.ts` e committa. Prima di committare sopra:
   `git pull --rebase`. Se avevamo scritto i tipi a mano, si tiene il suo file.
5. **Verificare che la tabella esista davvero**, senza fidarsi del «fatto»:
   una GET a `<VITE_SUPABASE_URL>/rest/v1/<tabella>?select=id&limit=0` con la
   chiave pubblica del `.env` risponde **404 `PGRST205`** se la tabella non
   esiste e **401** se esiste (all'anonimo è negata, come deve).

---

# 14. Stato attuale — ottobre 2026

**Piano a 10 fasi:**

1. ✅ Bug fix
2. ✅ Logo e brand identity
3. ✅ Icone custom
4. 🔄 **Applicazione brand identity / UX — IN CORSO**
5. Illustrazioni custom (empty state, splash, onboarding)
6. Miglioramenti UX/UI
7. Animazioni (Framer Motion → After Effects + Lottie)
8. Pagamenti Stripe
9. Gamification
10. App nativa con Despia

## Fase 4 — fatto

- **Blocco funzionale** dell'audit (punti 1-7): anteprima messaggi, badge zero,
  date, storico, affordance, doppio Esci.
- **Palette carta** applicata ovunque: zero colori Tailwind grezzi rimasti.
- **Audit punti 8-25**: chiusi tutti tranne il 22 (sezioni del profilo tutte
  uguali), che Tommaso ha bocciato.
- **Sagome disegnate** su card, bottoni, chip, tessere, righe e campi.
- **Accesso con Google e Apple** + schermata `ScegliRuolo`.
- **Onboarding** rifatto: icone custom, titoli in Shinjo, tag durata rimossi,
  avviso foto riscritto, colori employer corretti.
- **Linea divisoria disegnata** sopra la bottom nav.
- **Scheda annuncio (`JobDetailsSheet`) rifatta** — vedi §15.
- **Bacheca dell'employer** in Messaggi, con migration `cartellini` applicata
  — vedi §16. È una **funzione nuova**, non solo restyling.
- **Splash d'apertura** col logo animato in Lottie (prima era un video) — vedi
  §17. Anticipa un pezzo della Fase 5.
- **Cambio tab più leggero**: istantaneo, Lista e Annunci senza ricaricare a
  ogni visita (§12, Prestazioni).

## Da fare

⚠️ **PRIMA DEL LANCIO: togliere i dati di esempio.** Il 21 ottobre sono stati
preparati 12 annunci finti (12 account employer senza password, email su
`@demo.politask.invalid`, tutto `is_demo = true`) per una presentazione.
Stanno in `supabase/demo/` — **fuori dal repo** di proposito (`.gitignore`):
`dati-demo.json` (i dati), `genera-demo.mjs` → `carica-demo.sql`, e
**`cancella-demo.sql`** (toglie account, annunci e tutto ciò che vi è
collegato a cascata, poi le colonne `is_demo`). Si eseguono incollandoli in
Lovable: `LC_ALL=en_US.UTF-8 pbcopy < supabase/demo/cancella-demo.sql` (⚠️ senza `LC_ALL` pbcopy legge il file come MacRoman e «Caffè» arriva a Lovable come «Caff√®»: successo il 22 ottobre). Provati su PGlite
(Postgres vero): caricare due volte dà sempre 12 e 12, e la pulizia toglie
anche la candidatura di un utente vero a un annuncio demo senza toccare
l'utente. Se la cartella va persa: basta `DELETE FROM auth.users WHERE email
LIKE '%@demo.politask.invalid'` (cascata) e togliere le colonne `is_demo` da
`profiles` e `jobs`. ⚠️ Se Lovable ha registrato il caricamento in
`drizzle/migrations/`, cancellare anche quel file.
- La mappa mostra solo annunci **non scaduti** (`scade_il > adesso`, §19).
  Prima della migration della scadenza i demo duravano ~1–2 giorni (48 ore
  da `created_at`, che è «adesso meno 1–30 ore»); dopo, `carica-demo.sql`
  non scrive `scade_il`, quindi prende il default: **48 ore dal
  caricamento**. ⚠️ Per rimetterli freschi usare **`rinfresca-demo.sql`**
  (24 ottobre): aggiorna solo date e stato. `carica-demo.sql` invece
  cancella e ricrea, e porta via in cascata candidature e chat fatte sugli
  annunci demo.
- Nomi delle attività cercati sul web: nessuna attività con quei nomi a
  Genova («Bar Il Gozzo Blu» scartato: esiste «Il Gozzo» al Porto Antico).
  Coordinate: strade vere geocodificate da Mapbox col solo nome della via.

0. **Applicare in Lovable, PRIMA del push**: `20261021120100_cron_chiusura_lavori.sql`
   (la `assunzione_cuore` è già applicata e verificata) e verificare che
   pg_cron ci sia (`select * from cron.job`); poi
   `20261023120000_scadenza_annunci.sql` (§19) — ⚠️ il codice nuovo filtra
   su `scade_il`: pushato prima, mappa e Lista restano VUOTE. Verifica: GET
   `/rest/v1/jobs?select=scade_il&limit=0` → 200, non 400/42703. Poi provare
   il flusso intero con dati veri.
   **Applicata il 23 ottobre** la scadenza (verificata via REST, pushato il
   codice). Restano: il cron, e `20261023130000_titolo_chat_annunci_chiusi.sql`
   (solo la vista, nessun codice dipende da lei: si può applicare quando si
   vuole).
1. **Bacheca, employer e worker**: provarle con dati veri (appendere,
   assumere, terminare, l'avviso di scadenza; lato worker gli stati e la
   recensione dalla card) — scritte e verificate solo con dati finti.
2. **Pagine montate una volta sola** invece che a ogni cambio tab (§12,
   Prestazioni): il pezzo grosso rimasto sul lag.
3. **Revisione schermata per schermata** (in corso): fatte accesso,
   registrazione, onboarding, home, scheda annuncio, messaggi e chat (§18).
   Restano lista, annunci, crea annuncio, profilo, profilo pubblico, modifica profilo,
   impostazioni.
4. **Due migration rimandate**: trigger su `chats.updated_at`, e
   `lm.is_system` + `j.tags` nella vista `chat_overview`. (`is_system` su
   `messages` invece C'È già e la chat lo usa: è l'anteprima in lista, che
   legge dalla vista, a riconoscere i messaggi automatici dal testo.)
5. **Disegni mancanti** (avatar e pin non più: §6): cornici di chip e contenitore, eventuali
   illustrazioni per gli empty state.
6. **Licenza Shinjo** — mail da mandare.
7. **Landing/waitlist** su `politask.app`, con privacy e termini (servono anche
   per pubblicare l'app Google e per il GDPR).

## Punti aperti minori

- Contrasti al limite: ink su blu employer **4,41** e tessera accent **4,24**
  (serve 4,5).
- Focus arancione dei campi a **2,46** contro i 3:1 raccomandati — limite dei
  colori di brand, compensato con un tratto più spesso.
- Soglia mezza stella recensioni: 0.5.
- In alto a destra nella home ci andrà qualcosa (premium?), da decidere.
- Higgsfield: disdire il trial.

---

# 15. La scheda annuncio — la gerarchia, e perché

`components/map/JobDetailsSheet.tsx`. Aperta dal pin sulla mappa, dalla lista e
dal profilo pubblico: è **la schermata su cui si decide**, quindi l'ordine degli
elementi non è una questione di gusto.

## L'ordine

Segue le domande che uno studente si fa, nell'ordine in cui se le fa:

1. **che lavoro è** → titolo, `titolo-sezione` 24px, riga intera
2. **quanto paga** → Shinjo 28px nell'inchiostro del ruolo
3. **quando** → orario, una riga con l'orologio
4. **che tipo è** → i tag, chip con la sagoma
5. **chi lo offre** → una riga alta 68px: avatar 44, nome in Shinjo, chevron
6. **i dettagli** → descrizione
7. **dove esattamente** → minimappa + indirizzo

Prima l'employer stava **in cima**, con un avatar da 56px: l'elemento più grande
della schermata era la risposta alla domanda che si fa per ultima. Indeed, Subito
e Airbnb mettono tutti l'oggetto prima di chi lo offre.

## Le quattro correzioni che contano

1. **La paga non è più un badge pieno.** Usava `theme.btnFilled`, cioè lo stesso
   riempimento del bottone «Candidati» sulla stessa schermata: sembrava
   premibile. Ora è un numero grande in `--brand-orange-ink` / `-blue-ink`
   (4,66 e 5,86) — peso visivo massimo, zero affordance. E avendo la riga tutta
   per sé regge i formati liberi («150/settimana»), che accanto al titolo
   mandavano a capo entrambi: era la causa delle «scritte che volano».
2. **Separatori → `.linea-divisoria-sopra`.** Erano quattro `border-t` da 1px,
   la cosa più «fatta col CSS» di una schermata in cui ogni altro margine è
   tagliato a mano.
3. **Le intestazioni erano illeggibili**, non solo brutte: `DESCRIZIONE` e
   `POSIZIONE` erano 14px in `text-primary`, cioè l'arancio pastello a **1,9:1**
   su carta — e in Shinjo sotto i 18px, che è l'altra regola violata. Ora sono
   `titolo-mini` (17px) in inchiostro, **11,6:1**, in tondo: «Descrizione»,
   «Dove».
4. **Due altezze, e la nuvoletta non c'è più.** Era `h-[90vh]` fissa con il
   footer in `absolute`: un annuncio da tre righe occupava comunque il 90% dello
   schermo, con ~350px di vuoto in fondo. Vedi la sezione qui sotto.

## I due agganci — e perché la nuvoletta è sparita

Sulla mappa c'era un `Popup` di Mapbox che mostrava titolo, paga, orario e tag;
toccandolo si apriva la scheda, che mostra le stesse cose **più** employer,
descrizione e posizione. Era l'anteprima di una cosa che stava a un tocco di
distanza: **due tocchi per lo stesso contenuto**, più un elemento in più da
mantenere e da disegnare.

Ora il pin apre direttamente la scheda, che si ferma bassa — **esattamente la
testa, bottone e il suo spazio sotto compresi, e niente dell'employer**
(Tommaso: «nell'anteprima non si deve intravedere l'employer») — la mappa resta visibile sopra,
il pin non viene coperto, e per il resto si trascina in su. È Apple Maps e
Google Maps.

Conseguenze strutturali, tutte obbligate:

- **Il bottone «Candidati» sta nella testa, non in fondo.** Con gli agganci il
  fondo della scheda è sotto la piega: un footer là sotto sarebbe invisibile
  finché non trascini, e l'azione principale non si merita un trascinamento.
- **L'aggancio basso si MISURA** (`refTesta` + ResizeObserver →
  `altezzaAggancio`), non si stima. Lo spazio sotto il bottone è il `pb-` del
  blocco azione (24 px + safe area), dentro la misura; l'arrotondamento è
  per difetto, così non spunta nemmeno un pixel della divisoria. L'indizio
  che sotto c'è dell'altro lo dà la fessura in testa, non un pezzo di riga.
  ⚠️ Era fisso a **320px**, contato sul caso peggiore, e il «Candidati» toccava
  il bordo **anche col titolo su una riga**: vaul trasla la scheda di
  `finestra − aggancio`, ma la scheda è alta **92vh**, quindi se ne vede
  `aggancio − 8vh` = 320 − 68 = **252px** su un 844. Qualunque aggancio in px
  su una scheda non a tutta altezza va sommato a quella differenza.
  Misurato a 390×844, titolo su una o due righe.
- ⚠️ Per questo l'aggancio attivo è uno stato **alta / bassa**, non il valore:
  il valore cambia con la misura e vaul vuole che `activeSnapPoint` sia uno
  degli `snapPoints`. Il ref è a callback (`useCallback`) perché il contenuto
  sta nel portal e nasce solo a scheda aperta: `useMisure` misurerebbe al
  montaggio, quando il nodo non c'è.
- ⚠️ **Gli agganci vaul si calcolano sull'altezza della FINESTRA**, non su quella
  della scheda: vaul trasla di `finestra × (1 − aggancio)`. La scheda è
  `h-[92vh]` (in cima resta un po' di mappa), quindi **l'aggancio alto è 1**,
  non 0,92 (`AGGANCIO_ALTO`). Con 0,92 la scheda «aperta tutta» scendeva
  dell'8%: fondo a 912 su 844, e negli annunci corti l'ultima parte era fuori
  schermo e non scorreva, perché entrava giusto nell'area (Tommaso, 22
  ottobre). Era lo stesso errore di conto dell'aggancio basso, corretto lì due
  giorni prima e non qui. Verificato trascinando col dito: scheda da 68 a 844,
  e il contenuto lungo scorre fino in fondo.
- **Anche l'aggancio alto si MISURA** (`refContenuto` → `fondoContenuto`):
  se il contenuto finisce prima della scheda, l'aggancio alto si ferma lì
  (con la stessa correzione degli 8vh); se è più lungo resta 1 e scorre. Un
  annuncio corto tirato su lasciava mezza scheda di carta vuota (Tommaso, 22
  ottobre). Misurato: annuncio corto → fine contenuto esattamente sul bordo,
  0 px di vuoto; medio e lungo → aperta tutta, scorre. ⚠️ `setActiveSnapPoint`
  confronta col valore dell'aggancio alto di quel giro, non con la costante.
- ⚠️ **Gli agganci vanno passati come LO STESSO array** (`useMemo` sui due
  valori). vaul, a ogni ridisegno con un array nuovo, rimette la scheda
  sull'aggancio corrente: alla chiusura la pagina ridisegna la scheda, e la
  scheda trascinata giù a 823 px saltava indietro a 568 in un fotogramma
  prima di scendere (Tommaso, 24 ottobre: «c'è un lag»). Misurato
  registrando la posizione a ogni fotogramma; ora scende dritta.
  Scartata prima un'altra ipotesi: su Safari vaul fissa il `body` in
  `position: fixed`, ma solo per le schede aperte da un SUO trigger
  (`hasBeenOpened`): le nostre le apre il codice, quindi non succede.
- ⚠️ **L'aggancio va CONTROLLATO** (`activeSnapPoint` + `setActiveSnapPoint`).
  Lo stato interno di vaul vive nella Root, che qui non si smonta mai: chi
  apriva la scheda, la trascinava in alto e la chiudeva, la ritrovava già aperta
  tutta al giro dopo. Si rimette basso a ogni chiusura.
- vaul inietta da sé il CSS degli agganci, quindi l'overlay nero è trasparente
  all'aggancio basso e sfuma entrando in quello alto: non serve aggiungere nulla.
- Vale anche in Lista e Profilo pubblico, dove una mappa dietro non c'è. È una
  scelta di coerenza — lo stesso oggetto si apre nello stesso modo — ma è
  discutibile e si può differenziare con un prop.

## Trappole incontrate qui

- ⚠️ **`DrawerTitle` porta di suo `text-lg leading-none font-semibold`**, e le
  utility di Tailwind battono `@layer components`: la sola classe
  `.titolo-sezione` restava a 18px. Le misure sono ripetute come utility di
  proposito.
- ⚠️ **`DrawerHeader` ha `p-4` suo**: sommato al `px-4` del contenitore faceva
  40px da sinistra, fuori dalla griglia a 16 del resto dell'app. Azzerato.
- ⚠️ **`LocationMiniMap` stampa quartiere e indirizzo CENTRATI** sotto la mappa.
  Non le si passano più: l'indirizzo lo stampa la scheda, allineato a sinistra.
- ⚠️ **Niente `.safe-bottom` sul footer**: azzera il `pb-3` nei browser dove
  l'inset vale 0, esattamente come `.safe-top` con `pt-*`. Si usa
  `pb-[max(0.75rem,env(safe-area-inset-bottom))]`.
- Il bottone usa `size="lg"`, non `h-14 rounded-xl` scritto a mano: è la **size**
  che accende la sagoma disegnata (`compoundVariants` in `ui/button.tsx`).
- ⚠️ `variant="default"` è **arancione anche per l'employer** — `--primary` non
  è ribaltato sotto `[data-ruolo]`. Serve `theme.btnFilled` nel `className`, che
  sovrascrive il fondo lasciando la sagoma.
- Tolto il ripiego con `theme.primary` + `text-primary-foreground` (inchiostro su
  blu scuro: il bug ricorrente numero uno) e il codice morto `categoryLabels` /
  `categoryColors`, calcolati e mai usati.

## La card in Lista — un indice, non un'anteprima

La card della Lista (`JobsList` in `pages/Lista.tsx`) ripeteva la scheda:
tag, orario, data, paga in un badge (con un «€» doppio: «€ 9€/h»). Tutto già
nella scheda che si apre al tocco. Ora: **tessera col mestiere + titolo + una
riga «zona · paga»**, la paga in `primary-strong`.

⚠️ La paga sta **a destra, in colonna sua**: con titolo e «zona · paga» tutti
a sinistra la card era piena da un lato e vuota dall'altro (Tommaso:
«sbilanciato»). A destra è anche dove l'occhio la cerca scorrendo, e i valori
si confrontano in colonna. Titolo fino a due righe, paga fino a due righe in
un massimo del 38% della larghezza («150/settimana» ci sta su una).

La stessa riga sta negli **Annunci attivi del profilo pubblico** (23
ottobre): prima erano card grigie con un bordo CSS da 1 px DENTRO la card
disegnata, l'icona in un quadratino pastello e «€ 9€/h». Lì la riga sotto il
titolo è l'orario (la zona è quella del locale, uguale per tutti), e le righe
sono divise dalla linea sottile — anche le recensioni sopra, che avevano un
`border-b` liscio: due separatori diversi nella stessa schermata non vanno.

Perché queste due e non solo il titolo: in una **lista**, senza mappa, il
«dove» non si vede altrimenti, e la paga è il dato con cui si sceglie se
aprire o no (Indeed, Subito, InfoJobs la tengono tutti nella riga). L'orario
e i tag di durata si leggono nella scheda; il mestiere lo dice già l'icona.

## Ancora da decidere

- **La paga in Shinjo**: è un valore, e la regola dice che i valori stanno in
  Outfit (il select del quartiere). Qui è però un uso da *display* a 28px, che è
  esattamente ciò per cui Shinjo esiste. Se stona, è una riga da cambiare.
- Manca la **distanza** («a 800 m da te»), che su un'app centrata sulla mappa
  sarebbe il secondo dato più utile dopo la paga. Servono le coordinate
  dell'utente nella scheda: oggi non ci arrivano.

---

# 16. La bacheca — employer e worker, ottobre 2026

**Cos'è.** In Messaggi, per l'employer, due schede **Chat | Bacheca** (le
stesse linguette di Lista). La bacheca mostra chi lavora con lui, o chi sta
provando, come **cartellini appesi**: due per riga, con una puntina, un po'
storti. Toccando un cartellino si apre una scheda con gli accordi e le azioni.
Il **«+»** (tratteggiato, sempre l'ultimo posto) appende una persona di cui ha
accettato la candidatura. Sotto, chiusa, la sezione **Conclusi**.

Idea e decisioni sono di Tommaso; la **versione worker** («al contrario») è il
prossimo passo e la tabella è già pronta per lei.

## Il modello — e le decisioni che lo reggono

- **Tabella `cartellini`**, una riga per persona appesa. Migration in
  `supabase/migrations/20261006120000_cartellini.sql` (commentata) e
  `drizzle/migrations/0000_cartellini.sql` (quella eseguita da Lovable).
- ⚠️ **Lo stato NON sta sul cartellino: si legge dalla candidatura.**
  `accepted` = in prova, `hired` = assunto, `completed` = concluso
  (`STATO_DA_CANDIDATURA` in `lib/bacheca.ts`). Così bacheca e chat non possono
  contraddirsi.
- **Il «+» appende IN PROVA, non assume.** Tommaso ha voluto poter appendere
  anche chi non è assunto (il turno di prova al bar). La candidatura resta
  `accepted`; dalla scheda si può poi **Assumere** (stesso effetto del bottone
  in chat, messaggio automatico compreso) o **Togliere dalla bacheca** (stacca
  solo il cartellino: candidatura e chat restano).
- **Chi viene assunto compare da solo**: trigger `appendi_assunto` sul
  passaggio a `hired`, da qualunque parte arrivi.
- **`employer_id`, `worker_id`, `job_id` li scrive il database** (trigger
  `compila_cartellino`), leggendoli dalla candidatura: il client non può
  appendere alla propria bacheca la candidatura di un annuncio altrui.
- **Permessi**: l'employer fa tutto sui suoi cartellini, il worker li **legge**
  soltanto (gli accordi li ha scritti l'employer).
- **Nella stessa migration è stata chiusa una falla**: la policy «Workers can
  update own applications» lasciava al worker **qualsiasi** colonna, `status`
  compreso — poteva darsi `hired` da solo. Ora il trigger
  `proteggi_candidatura` gli lascia solo `is_reviewed`, e una candidatura
  nasce sempre `pending`.

## Gli accordi NON sono un contratto

Tommaso: «sono cose che non influiscono un contratto reale, segnano solo
all'interno dell'app questi dati». Quindi:

- tutto **facoltativo**, nessuna validazione oltre il minimo (paga ≥ 0, fine
  dopo l'inizio);
- la sezione si chiama **«Accordi»**, mai «Contratto»;
- ⚠️ data di fine vuota = **«Nessuna data di fine»**, mai «a tempo
  indeterminato»: in Italia è un tipo di contratto preciso;
- niente riga di avviso «non ha valore di contratto»: proposta e scartata da
  Tommaso («anche senza»).

Campi: date di inizio e fine, **paga** come importo + unità (ora, giorno,
settimana, mese, forfait), **giorni** della settimana, **orari** in testo
libero.

- **I giorni sono uno SCHEMA settimanale, non un calendario.** Tommaso temeva
  non funzionassero per lavori di mesi: valgono uguale per due settimane o sei
  mesi. Il loro vero limite sono i turni variabili, per cui sono facoltativi
  e affiancati dal campo «Orari e turni».
- **Tre modi dei giorni, senza colonne nuove** (`modoGiorni` in `lib/bacheca.ts`):
  - **fissi** — i chip L…D (`giorni` = i giorni scelti, `null` se nessuno);
  - **«Variabili»** — `giorni = []` (array vuoto ≠ null: è una risposta);
  - **«Un giorno solo»** — `data_inizio = data_fine`: la sezione Date diventa
    «Il giorno» con un campo solo e spariscono +1 settimana / +1 mese.
  Lo leggono cartellino («Il 21/10», «Turni variabili») e scheda del worker.
- **La paga si precompila dal testo dell'annuncio** («9€/h» → 9, ora) con
  `leggiPagaDaTesto`, ma **non si salva** finché l'employer non preme Salva.
- **Nessun totale della paga**: servirebbero le ore a settimana, che non
  chiediamo. Mostrarlo sarebbe un numero inventato.

## Il flusso dell'assunzione (deciso da Tommaso il 21 ottobre)

annuncio → candidatura → l'employer **accetta** (si apre la chat) → accordi
in chat → l'employer **assume** → **compila il cartellino** → lavoro →
fine → recensione del worker + **cuore** dell'employer.

- **«Compila il cartellino» subito dopo «Assumi»**, dalla chat
  (`handleHireWorker` in Messaggi) e dal cartellino in prova. È
  `SchedaCartellino` con `compila`: titolo, invito, «Salva il cartellino», e
  in fondo l'interruttore **«Togli l'annuncio dalla mappa»** (acceso di
  default) — prima era una finestra separata dopo l'assunzione. Dalla chat
  si apre con `sopraChat` (drawer e overlay a `z-[70]`: la chat è
  `z-[60]`). ⚠️ L'assunzione dalla chat ora è **aspettata**, non più «fire
  and forget»: il cartellino lo crea il trigger proprio su quel cambio di
  stato, e il modulo deve trovarlo.
- **Data di fine, anche indicativa.** Dal giorno dopo, `PromemoriaScadenza`
  chiede estendi / concludi. Per gli **assunti** c'è il conto alla rovescia:
  **5 giorni pieni**, poi il lavoro **si chiude da solo** (fine 10 →
  domanda l'11 → chiusura il 16). La chiusura la fa il **server**:
  `chiudi_lavori_scaduti()` ogni giorno alle 03:15 UTC con **pg_cron**
  (migration `20261021120100_cron_chiusura_lavori.sql`, a parte apposta), e
  scrive in chat «Il lavoro si è chiuso automaticamente». I cartellini «in
  prova» non si chiudono da soli: non sono ancora un lavoro.
- **Senza data di fine: ogni 3 mesi dalla data di ASSUNZIONE** l'app chiede
  «è ancora attivo?». `assunto_il` lo scrive il trigger all'assunzione, non
  si vede in interfaccia; `ultimo_controllo` ricorda solo l'ultima risposta.
  ⚠️ **Senza risposta NON si chiude**: un lavoro può durare più di tre mesi.
- **Il cuore**: a lavoro concluso (da lui, dalla chat, o automaticamente)
  l'employer vede «Com'è andata con…?» → **Metti il cuore** o **Salta**.
  `cuore` true/false + `esito_il`; la card resta finché `esito_il` è NULL. I
  lavori già conclusi prima della migration non la chiedono (recupero).
  **Pubblico**: nello storico del worker, nel suo profilo e in quello
  pubblico, solo quando c'è (nessun cuore ≠ voto negativo). Si legge con la
  funzione `cuori_del_worker`, che restituisce solo gli id — il cartellino
  ha anche la paga, e le policy RLS sono per riga, non per colonna.
- L'employer può **concludere in qualunque momento** (chat, scheda).
- ⚠️ **I messaggi automatici si scrivono PER CHI LEGGE**
  (`lib/messaggiSistema.ts`). Quello d'assunzione era salvato con la voce
  del worker («🎉 Complimenti! Sei stato assunto…») e la chat lo stampava
  uguale per tutti: l'employer leggeva i complimenti per un'assunzione fatta
  da lui (Tommaso, 22 ottobre). Ora nel database va un testo NEUTRO
  («Assunzione confermata per questo incarico.») e chat e anteprima lo
  riscrivono: worker «Complimenti! Hai ottenuto questo lavoro.» (niente
  «assunto» al maschile), employer «Hai assunto {nome} per questo lavoro.».
  I vecchi con l'emoji si riconoscono e si mostrano uguale. Niente emoji nei
  messaggi automatici né nella finestra di recensione (Tommaso: via i
  coriandoli).
- `PromemoriaScadenza` mostra **una domanda alla volta**: scadenza → cuore
  → trimestrale (`prossimoPromemoria` in `lib/bacheca.ts`). La finestra è
  `FinestraPromemoria`, separata per poterla vedere con dati finti.
- Pallino sulla scheda «Bacheca» finché c'è una scadenza da decidere.

## Il disegno — cartellino da pacco (dal 20 ottobre)

Tommaso: «devono sembrare cartellini da pacco, in cartoncino con il foro e lo
spago». Cambiati solo contorno, foro e puntina; colori, contenuti, griglia e
dimensioni restano.

- **Forma**: angoli in alto **smussati in diagonale** (26×26 px), angoli in
  basso arrotondati (18 px, il raggio del disegno precedente), **foro** in alto
  al centro (centro a 22 px dal bordo, Ø 12) con **anello di rinforzo** (Ø 26).
  Costanti in `lib/formaCartellino.ts`.
- ⚠️ **Non è più `.material-card` né il ritaglio a 9 sezioni**: il 9 sezioni
  stirerebbe il foro (sta al centro di una banda) e fa sparire i tratteggi sui
  lati lunghi (§12). Il tracciato è **calcolato in pixel** dalle misure vere
  della card (`SagomaCartellino.tsx`, `offsetWidth/Height` + ResizeObserver —
  non `getBoundingClientRect`, che sul cartellino ruotato dà il riquadro
  ruotato).
- **L'irregolarità è quella del disegno di Tommaso, misurata** su
  `sagoma-card-a.svg`: un vertice ogni ~5,5 px spostato di ±0,5 px (dev 0,33).
  Rumore in pixel lungo il perimetro, **seme dall'id**: stesso disegno a ogni
  render, e una card più larga ha più vertici, non un tratto più slabbrato.
- ⚠️ **Il foro è vuoto davvero**: riempimento della card e dell'anello con
  `fill-rule: evenodd` che include il cerchio del foro. Verificato sui pixel:
  dentro il foro c'è `#F4EEE2`, la bacheca, non `#FAF6EB` della card.
- ⚠️ **Tinta dell'anello al 35% foglio / 65% incavo (~`#EEE8DA`)**. Al 60%
  veniva `#F3EDE1`, cioè il colore della BACHECA: anello e foro identici, il
  foro si leggeva solo dal tratto.
- **Contenuto da 44 px** (l'anello finisce a 35). ⚠️ Con la proporzione fissa
  questo toglie ~34 px all'interno, cioè tutto lo spazio libero che c'era:
  la **foto non ha più una proporzione sua**, prende lo spazio che resta
  (`flex-1 min-h-0`, ~137×67 a 360 px, ~152×88 a 390, `object-[center_30%]`
  per non tagliare i volti). I testi sono `shrink-0`, e la seconda riga ha
  **altezza fissa** (`h-4`) anche vuota, se no le foto di due card vicine
  avrebbero altezze diverse.
- **Puntina**: l'ago entra **esattamente nel centro del foro**. Le punte dei tre
  disegni sono misurate (`PUNTE_PUNTINE` in `icons/puntine.tsx`: punto più
  basso dell'ago, getPointAtLength in Chrome) e la puntina si posiziona da lì,
  larga 21 px come prima. Tolto lo spostamento casuale orizzontale. Testa nel
  colore del ruolo, ago in inchiostro; provate a 390px: arancio pastello e
  `employer-700` reggono. Stanno fuori dalla sagoma, sopra il contenuto.
- **«Aggiungi»**: stessa forma, **tratteggiata** (2,2 px, trattini 11/11, la
  cadenza del disegno di prima), col foro e l'anello, **senza puntina**: è un
  posto libero. `cartellino-tratteggiato.svg` è stato cancellato.
- **Inclinazione** fino a ±1,9°, più delle liste (±0,5°): una bacheca non è un
  elenco ordinato. Inclinazione e puntina derivano dall'**id** (`varieta`),
  così riordinare non le rimescola. Rispetta `prefers-reduced-motion`.
- **Il chip «In prova» sta in basso al centro della foto**: negli angoli la
  maschera della foto lo tagliava.
- **Unità di paga a chip, non un menu**: Radix `Select` dentro vaul, vedi §12.

## Codice

- `lib/bacheca.ts` — **sorgente unica delle azioni**: `assumi`,
  `terminaLavoro`, `appendi`, `stacca`, `salvaAccordi`, più date, paga e
  varietà. La chat usa le stesse funzioni.
- ⚠️ **`chiudiAnnuncioSeNessunoResta`**: prima «Concludi» in chat chiudeva
  SEMPRE l'annuncio — con due persone assunte, terminarne una lo toglieva di
  mezzo anche per l'altra. Ora lo chiude solo se non resta nessuno assunto o
  in prova.
- ⚠️ **Le date sono colonne `DATE`**: si confrontano come stringhe locali
  (`oggiISO`), mai con `new Date("2026-10-06")`, che le legge come mezzanotte
  UTC e a Genova sposta il giorno.
- `hooks/useCartellini.ts` — letture in react-query: la bacheca e i candidati
  da appendere (accettati non ancora appesi). La chat per il tasto «Chat» si
  legge con una query sola per tutti i cartellini, non una a testa.
- La scheda attiva sta nell'URL (`/messaggi?vista=bacheca`): tornando da un
  profilo aperto dal cartellino si ritrova la bacheca.

## La versione worker — «al contrario» (dal 20 ottobre)

In Messaggi anche il worker ha **Chat | Bacheca**. Ci vede i lavori in cui è
stato preso: **solo** quelli che un employer ha appeso alla sua bacheca. Le
candidature restano in Lista → Candidature.

- **Legge gli stessi cartellini** dell'employer (`hooks/useLavoriWorker.ts`,
  RLS: il worker legge, non scrive). Tre query fisse: cartellini con
  candidatura, annuncio e attività dentro; recensioni; chat.
- **Gli stati, tutti da dati esistenti** (`statoLavoro` in `lib/bacheca.ts`),
  nessuna colonna nuova:

  | Stato | Regola | Badge |
  |---|---|---|
  | In prova | candidatura `accepted` + cartellino | `warning-soft` |
  | Assunto | `hired` | `success` pieno |
  | Finito | `accepted`/`hired` ma `data_fine` passata | `paper-sunken` + ink |
  | Da recensire | `completed`, nessuna recensione | **pieno di ruolo** (l'unico che chiede un'azione) |
  | Concluso | `completed`, recensione fatta | `neutral-soft`, card al 60% |

- ⚠️ **«Recensito» = esiste una riga in `reviews`** per quel lavoro e quel
  worker, **non** `applications.is_reviewed`: quel campo `ReviewPrompt` lo
  mette a `true` anche quando la finestra viene chiusa o saltata senza
  recensire. Usarlo avrebbe mostrato «Concluso» a chi non ha mai recensito.
- **La card dice poco, la scheda dice tutto** (Tommaso, 20 ottobre). Fuori
  solo foto con lo stato, attività e ruolo. Toccandola si apre
  **`SchedaLavoro`** (drawer, sola lettura): attività con lo stato, due
  tessere-icona (**Messaggi** → chat diretta con l'attività, **Profilo** →
  profilo dell'attività), il **ruolo con l'icona del mestiere** (dai tag
  dell'annuncio, `getJobIconFromTags`), poi righe con linea disegnata:
  **Paga**, **Periodo** (dal–al + quanto manca, solo se il lavoro è in
  corso), **Giorni e orari** (le 7 lettere come chip, quelle concordate piene
  nel colore del ruolo). In fondo «Recensisci …» se è da recensire, o una
  nota se è finito o concluso.
- ⚠️ **Il tocco sulla card NON apre la chat.** Era così nella prima versione:
  bocciato («non ha senso, è un bottone di distanza»). La chat è la tessera
  Messaggi dentro la scheda.
- ⚠️ **Card DRITTE**, non storte come i cartellini: un cartellino è appeso e
  può pendere, una vetrina no (non si imposta `--storto`).
- **«Recensisci»** apre la **stessa** finestra di `ReviewPrompt` per quel
  lavoro (`apriRecensione` in `lib/recensione.ts`, un evento che
  ReviewPrompt ascolta) — niente seconda schermata di recensione. La scheda
  si chiude prima, perché la recensione è un Dialog. Dopo l'invio
  ReviewPrompt invalida `['applications']`, e la chiave della bacheca worker
  sta lì sotto: la card passa a «Concluso» da sola.
- **Ordine**: le attive nell'ordine di arrivo, le concluse in fondo.
- ⚠️ `DrawerDescription asChild` sopra un `<p>` fonde le sue classi
  (`text-sm text-muted-foreground`) con quelle del figlio: il ruolo usciva
  piccolo e grigio. La descrizione accessibile è un `sr-only` a parte.
- **Pallino sulla scheda Bacheca** se c'è almeno un lavoro da recensire.
- **Vuota**: «Qui troverai i lavori in cui sei stato preso» + «Vai alla mappa».

### La forma a NEGOZIO

È la sagoma di `AnnunciIcon`, il negozio della barra in basso
(`lib/formaNegozio.ts`, `SagomaNegozio.tsx`): **tenda** con bordo alto dritto
e angoli arrotondati (8 px), **4 festoni** sotto (3 se la card è sotto i
150 px), che **sporge di 4 px** oltre i lati; sotto il **corpo**, angoli in
basso da 18 px. Solo contorno, niente strisce. Stesso tratto delle card
employer: `lib/tratto.ts`, condiviso col cartellino (stessi numeri casuali:
verificato che il cartellino è rimasto identico su 16 combinazioni).

- **Due tracciati**: il corpo prima, chiuso; la tenda sopra, riempita, gli
  copre il lato alto e il pezzo dei fianchi sopra i festoni — così i fianchi
  «escono» da sotto la tenda senza calcolare gli incroci.
- ⚠️ **Festoni profondi 12 px, non 9.** A 9 px su archi da ~43 la tenda
  leggeva come il coperchio di un barattolo; a 12 come una tenda (confronto
  fatto a 390 px). Fondo della tenda a 32 px, contenuto da **43 px**: la foto
  parte 11 px sotto i festoni.
- Il contenuto è lo stesso del cartellino (foto che prende lo spazio che
  resta, testi `shrink-0`, seconda riga a altezza fissa). Verificato senza
  testi schiacciati a 360, 390 e 430 px.
- Niente puntine, niente «Aggiungi»: da qui il worker non appende niente.

---

# 18. I messaggi — ottobre 2026

Tommaso (22 ottobre): «poco responsiva e poco caratteristica», lista e chat.
Rifatti in tre fasi, tutte e tre approvate.

## Reattività
- **Invio istantaneo** (`handleSendMessage` in `Messaggi.tsx`). Prima il
  messaggio compariva dopo DUE viaggi di rete (salvataggio + ritorno col tempo
  reale), col testo fermo nel campo e la rotellina. Ora compare subito,
  il campo si svuota, l'orologio sulla bolla dice «in invio». ⚠️ **L'id lo
  genera il client** (`crypto.randomUUID()`): quando il messaggio torna col
  tempo reale ha lo stesso id e prende il posto di quello istantaneo invece di
  raddoppiarlo (`inserisciMessaggio`). La policy di insert controlla solo
  mittente e partecipanti, quindi l'id scelto da noi passa. Se fallisce:
  «Non inviato · Tocca per riprovare»; un 23505 al secondo tentativo vuol dire
  che il primo era arrivato, e conta come riuscito.
- **Messaggi in react-query** (`hooks/useMessaggi.ts`), il tempo reale scrive
  nella cache. Prima la chat si svuotava e si ricaricava a ogni apertura.
- ⚠️ Riga che torna dal database senza `stato`: lo spread lascerebbe il
  vecchio «in invio» appiccicato, quindi `stato` si riscrive esplicito.
- **La chat è un pannello SOPRA la lista** (che resta montata), entra da
  destra (280 ms, decelera) ed esce dallo stesso lato (200 ms, accelera).
  Animazione nativa: framer qui non anima gli ingressi (§12). Misurato: 390 →
  0 px in entrata, 0 → 339 in uscita, lista ancora lì sotto.
- **Conversazione in fondo** (`mt-auto`), non in alto con mezzo schermo vuoto.
  Si scorre in fondo anche quando l'ultimo messaggio NON parte, se no la riga
  «Non inviato» restava sotto il bordo.

## Struttura
- **Lista: righe piatte, non card**, divise dalla linea disegnata in versione
  SOTTILE (`.linea-divisoria-sottile`, 2,5 px invece di 4: a 4 px, ripetuta
  ogni riga, era «cicciona»). Il disegno si stira libero in altezza, quindi
  schiacciarlo assottiglia il tratto senza cambiarlo. Tre righe:
  nome + stato + ora · **titolo dell'annuncio** (l'unica cosa che distingue
  due chat con la stessa persona) · ultimo messaggio + non letti. Ora dei non
  letti nell'inchiostro del ruolo; il contatore era `text-white` sull'arancio
  pastello (2,07:1), ora inchiostro.
- **In chat: separatori di giornata** («Oggi», «Ieri», giorno della settimana,
  poi la data: `etichettaGiorno`) e **solo l'ora** sulle bolle. **Gruppi**:
  stessa persona, stesso giorno, meno di 5 minuti → bolle strette.
- ⚠️ **Il titolo in lista viene dalla vista `chat_overview`, che legge coi
  permessi di chi guarda** (`security_invoker`). Il worker non legge gli
  annunci CHIUSI (la policy che glielo permetteva è stata tolta ad aprile
  per una ricorsione RLS fra `jobs` e `applications`), quindi nelle chat dei
  lavori conclusi la riga del titolo era vuota. Migration
  `20261023130000_titolo_chat_annunci_chiusi.sql`: `COALESCE(j.title,
  a.job_title)`, il titolo salvato nella candidatura. Provata su PGlite.
- **Testata**: il titolo dell'annuncio sotto il nome riapre la scheda
  (`JobDetailsSheet sopraChat`, a `z-[70]`: la chat è `z-[60]`).

## Carattere
- **Bolle a mano** (`lib/formaBolla.ts`): rettangolo arrotondato col tratto
  delle card, come RITAGLIO (`clip-path`), niente filo (§6). Scarto dimezzato
  (±0,3 px): sulle bolle piccole quello delle card si leggeva come sporco.
  Angolo dal lato di chi parla piccolo sull'ultima del gruppo, e in alto su
  quelle che lo continuano. La citazione di una risposta sta DENTRO la bolla.
- **Messaggi automatici = timbri**, non bolle (`tipoDiSistema`): l'assunzione
  nel verde di «Assunto» con la valigetta, la chiusura con l'orologio. Testo
  scritto per chi legge (§16).
- **Doppia spunta «letto» nel colore dell'ALTRO ruolo** (Tommaso): blu sulla
  bolla arancione del worker, arancio su quella blu dell'employer. Tinte
  scelte sul contrasto da icona (3:1): `employer-800` sull'arancio fa 3,29,
  il blu pastello 1,46; sul blu `employer-700` l'arancio di brand fa solo
  2,30, quindi c'è un token nuovo, `--brand-orange-chiaro` (#FBCB94, 3,18).
  Non letto: la spunta tenue nel colore del testo.
- **Allegato e invio, due tessere gemelle** ai lati del campo. L'invio a campo
  vuoto è `Tessera spenta` (carta incavata + icona tenue), non il pastello al
  40% che sembrava rotto.

# 17. Lo splash d'apertura — ottobre 2026

Il **logo animato in Lottie** all'apertura, a **ogni avvio a freddo**.
`components/layout/SplashScreen.tsx`, file in
`src/assets/politask-logo-animato.json`: 1080×1920, **16 fps, 64 fotogrammi
= 4 s**, 74 KB, senza immagini né font né espressioni, fondo `#F3EFE3`. Parte
da carta **vuota**: le lettere scorrono nelle loro finestre da sinistra a
destra (l al fotogramma 19 … k al 25, tutte a posto entro il 39), poi la «o» a
pin cade al suo posto (36 → 44, con un piccolo rimbalzo).

⚠️ **Il 9 ottobre ha sostituito lo splash col video** (`.webm`/`.mp4`,
cancellati). Cambiato anche il «quando»: prima **una volta al giorno**
(`localStorage`), ora **a ogni avvio a freddo**, come da richiesta di Tommaso.
Il parametro `?splash` non c'è più: basta ricaricare.

- **Libreria: `lottie-web`, renderer SVG**, importata come
  `lottie-web/build/player/lottie_light` — stesso pacchetto, senza motore
  delle espressioni (il file non ne usa), circa metà del peso. ⚠️ **Verificato
  che è identico al lottie completo**: su tutti i 64 fotogrammi l'SVG prodotto
  dalle due versioni coincide. Se un file futuro usasse espressioni, va
  cambiato l'import con `lottie-web`. **Niente altre librerie Lottie senza
  chiedere a Tommaso.**
- **Libreria e JSON in import dinamico**: nella build finiscono in pezzi
  propri (48 KB e 10 KB compressi) e non pesano sul bundle principale.
- **È uno strato sopra l'app, non un cancello prima**: montato per ultimo in
  `App.tsx`, fuori dal router, vive una volta per caricamento della pagina —
  cambiare pagina o tornare indietro non lo rifà comparire (verificato).
- **Dimensioni**: `preserveAspectRatio: "xMidYMid meet"`, cioè contain. Sui
  telefoni (più alti di 9:16) occupa tutta la larghezza e resta centrato in
  verticale, senza tagli. Su schermi più larghi (desktop) si ferma all'altezza
  invece di uscire.
- **Si chiude**: fine animazione + **0,5 s** di logo fermo · al **tocco** ·
  **logo statico per 1 s** se libreria o file non arrivano entro 2,5 s o danno
  errore · comunque dopo **7 s** (verificato: chiuso a 7,4 s). Dissolvenza di
  300 ms.
- **Con «riduci movimento»**: `goToAndStop` sull'ultimo fotogramma, fermo 1 s.
- **Il ripiego** è `logo-worker-v2.svg` al **79% della larghezza**: misurato,
  è quanto occupa il logo nell'ultimo fotogramma (852 su 1080, centrato a metà
  altezza). ⚠️ **L'arancio del Lottie è `#E9A55C`, quello del logo dell'app
  `#F6A24D`**: un arancio più spento (R 233 contro 246). Da decidere quale è
  quello giusto.
- ⚠️ **Il tocco non deve chiudere i dialog sotto**: all'avvio si aprono proprio
  lì il promemoria recensioni e l'avviso di fine lavoro. `stopPropagation` sul
  `pointerdown` + `pointer-events: auto` esplicito (§12). Verificato: si chiude
  in ~315 ms e il tocco non arriva al document.
- **`index.html`**: `theme-color` e fondo di `html, body` a `#F3EFE3`, in uno
  `<style>` nell'head, così non c'è lampo bianco prima del primo fotogramma.
  Dopo, `index.css` riporta il `body` su `--paper` (`#F4EEE2`): una unità per
  canale, invisibile. **`--paper` non è stato toccato.**
- **Schermata nativa di Despia**: deve avere lo **stesso fondo `#F3EFE3` e
  nessun logo**, perché il Lottie parte vuoto. ⚠️ La configurazione di Despia
  **non sta nel repo** (vive nel suo pannello): va impostata e controllata lì.
- **Nel pannello browser di Claude**, se è nascosto, `requestAnimationFrame` non
  scatta e l'animazione resta al primo fotogramma fino alla rete di sicurezza
  (§12): non è un bug dell'app.

---

# 19. La scadenza degli annunci — 23 ottobre 2026

Decisa da Tommaso: **48 ore gratis, nessuna ripubblicazione gratuita**. Allo
scadere l'employer riceve l'avviso e gli si chiede di **pagare per estendere
a 7 giorni** (Fase 8, Stripe), altrimenti l'annuncio resta scaduto. Proposta
mia «48+48 con un tocco», bocciata: «rende un annuncio pubblicabile per 4
giorni».

- **Colonna `jobs.scade_il`** (migration `20261023120000_scadenza_annunci.sql`).
  Prima la scadenza era `created_at` + 48 ore calcolata in ogni query: per
  estendere bisognava falsificare la data di creazione. Ora l'estensione sarà
  solo spostare `scade_il`.
- ⚠️ **La scadenza la decide il DATABASE**: trigger
  `proteggi_scadenza_annuncio`. Alla creazione da utente `scade_il` = adesso
  + 48 h qualunque cosa mandi il client; in modifica da utente non cambia.
  Senza, la policy «Owners can update» permetteva di ripubblicare gratis da
  sé. Il server (auth.uid() NULL: SECURITY DEFINER, pg_cron, il pagamento)
  può spostarla.
- **Candidature rifiutate dal database** su un annuncio scaduto o chiuso
  (trigger `candidatura_su_annuncio_attivo`, errore `annuncio_non_attivo`):
  la scheda si apre ancora da chat e profili, e il bottone si potrebbe
  chiamare a mano.
- **`lib/scadenzaAnnunci.ts` è la sorgente unica**: `annuncioScaduto`,
  `testoScadenza` («Scade tra 5 ore»), `adessoISO` per le query,
  `ORE_GRATUITE`, `GIORNI_A_PAGAMENTO`. Un oggetto senza `scade_il` né
  `created_at` (select parziale) NON è dato per scaduto.
- **Dove si vede**:
  - mappa, Lista, profilo pubblico → filtrano `scade_il > adesso`;
  - **Annunci** (chi l'ha pubblicato) → TUTTI i suoi annunci, con
    `StatusBadge` «Scaduto» (`warning-soft`) o «Chiuso» (`neutral-soft`),
    oppure «· scade tra N ore» accanto a quelli attivi;
  - **scheda annuncio** → al posto di «Candidati», «Annuncio scaduto»;
  - **Crea annuncio** → «Resta visibile sulla mappa per 48 ore» sotto
    «Pubblica»: detto prima, non scoperto dopo;
  - **l'avviso** → in `PromemoriaScadenza`, PRIMA dei promemoria della
    bacheca: «"X" è scaduto», «Estendi a 7 giorni · presto» SPENTO (la
    scelta che verrà si vede già) e «Ho capito», che scrive
    `scadenza_vista = true`. Chiuso col tocco fuori = rimandato a questa
    sessione. Gli annunci già scaduti prima della migration hanno
    `scadenza_vista = true`: niente raffica di avvisi vecchi.
- ⚠️ **I bottoni di STATO** nella scheda (verifica, «Candidatura inviata»,
  «Annuncio scaduto») sono `STATO_SPENTO`: incavo + inchiostro pieno,
  `disabled:opacity-100`. Col grigio e l'opacità 50% del `disabled` il
  testo stava a ~2:1 — difetto che c'era già su «Candidatura inviata».
- Quando arriva Stripe: una funzione SECURITY DEFINER (o un webhook) che
  porta `scade_il` a adesso + 7 giorni e rimette `scadenza_vista = false`;
  il bottone spento diventa vero. Niente altro da cambiare.

---

# 20. I link social del profilo — 23 ottobre 2026

Prima si scrivevano **solo nell'onboarding** (poi non si potevano più
cambiare), si vedevano **solo nel proprio Profilo** (icone lucide, «Sito
Web» generico) e il profilo pubblico non li mostrava affatto — proprio dove
servono: per un'attività sito e Instagram sono il modo di capire chi è
prima di candidarsi.

- **`lib/social.ts` è la sorgente unica**: `leggiSocial` pulisce e controlla
  i due campi; nel database va la forma pulita — Instagram solo il nome
  («@mario», «instagram.com/mario/?igsh=…» → «mario»), il sito con
  `https://`. ⚠️ Prima si salvava il testo così com'era e il profilo apriva
  `instagram.com/` + quel testo: chi incollava il link intero finiva su un
  indirizzo rotto. `linkInstagram` / `etichettaSito` reggono anche i dati
  vecchi non puliti.
- Un sito senza punto nel dominio («ciao») o con un altro protocollo
  (`javascript:`) è un errore sotto il campo, non viene salvato in silenzio.
- **`components/profile/LinkSocial.tsx`**: icone nostre, testo
  nell'INCHIOSTRO del ruolo del profilo mostrato (non di chi guarda), il
  sito col suo dominio, bersagli da 44 px. In Profilo allineati a sinistra,
  nel profilo pubblico centrati sotto l'indirizzo.
- **Modifica profilo**: i due campi in fondo. Nello stesso giro il bottone
  «Salva» era `bg-employer` (blu PASTELLO) con testo bianco, 3,03:1: ora
  `theme.btnFilled` + `size="lg"`, e via `safe-bottom` (§15).

---

# 21. La pulizia del 23 ottobre — cosa è cambiato e perché

Dall'audit «difetti evidenti» (punti 5–8), dopo scadenza, titolo in chat e
link social.

- **Icone lucide → nostre** dove il disegno c'è: orologio del caricamento
  mappa, euro in Crea annuncio, fumetto in candidature e recensioni vuote,
  profilo e «+» nella galleria, «+» in Annunci, e tutte le X (`XIcon`).
  Restano lucide di proposito: rotelline (`Loader2`), frecce di navigazione
  (`Chevron*`), spunte (`Check`, `CheckCheck`), `Reply`, la maniglia della
  galleria, `AlertTriangle`, `Users`: non abbiamo un disegno per loro.
- **Pastelli come testo o icona → inchiostri del ruolo**: le icone delle
  etichette di Crea annuncio (blu pastello, 2,6:1 sulla carta, sotto il 3:1
  di un'icona) e tutto il profilo pubblico (badge del ruolo, iniziali,
  stelle, icone delle sezioni: 1,8 e 2,6:1). Il badge «Concluso» del
  profilo pubblico ora è `StatusBadge`.
- **Maiuscole all'italiana**: 37 scritte in «Title Case» all'inglese
  («Pubblica Annuncio», «Storico Lavori», «Sono uno Studente») → maiuscola
  solo all'inizio. In italiano la maiuscola a ogni parola non si usa.
- **Via i coriandoli** da `ReviewPrompt` (Tommaso li aveva bocciati; usavano
  i colori Tailwind grezzi). ⚠️ Il pacchetto `canvas-confetti` resta in
  `package.json`: toglierlo cambia anche `bun.lock`, che aggiorna Lovable.
- **«Concludi» in chat** gemello di «Assumi»: chip ritagliato, pieno tenue
  nel verde di «Assunto». Era un contorno CSS verde accanto a un chip
  disegnato.

---

# 22. Lo scotch — 23 ottobre 2026 (pushato il 24)

Idea di Tommaso: pezzetti di scotch disegnati sulle card che NON si toccano,
come se tenessero su dei foglietti, con un easter egg al tocco.

- **Il significato**: puntina = appeso, si stacca, interattivo (cartellini
  della bacheca); scotch = attaccato fisso, da leggere (sezioni del
  profilo). Per questo non va sulle card cliccabili.
- **Disegni di Tommaso**, quattro (originali in `brand/scotch/`, tracciati in
  `icons/scotch.tsx`): `corto`, `cortoB`, `lungo`, `strappato`, disegnati a
  grandezza reale. **Semitrasparente ma disegnato** (Tommaso): il pastello
  del ruolo al 50% con il contorno nel suo inchiostro al 75%, 1,1 px. Si
  vede il bordo della card sotto, come su uno scotch vero. Il colore segue
  il ruolo del PROFILO mostrato, non di chi guarda.
- **`ui/Foglietto.tsx`**: avvolge UNA card e restituisce due fratelli, uno
  `span` alto zero con lo scotch e la card. ⚠️ Non dentro la card (la
  maschera lo taglierebbe proprio dove esce dal bordo) e non un contenitore
  attorno (le sagome si alternano con `nth-of-type` fra i `div` fratelli:
  tornerebbero tutte uguali; uno `span` non conta).
- **Posizioni**: `centro` (in alto, quasi dritto) o `sx`/`dx` (in diagonale
  a ±38°, centro a 18 px dentro e 6 px giù). ⚠️ Misurato a 390 px: conta
  l'ingombro del pezzo ruotato (~55 px), non il centro. A 10 px dentro
  arrivava al bordo dello schermo.
- **L'oscillazione**: attorno allo scotch (`transform-origin` lì), spinta
  dal lato in cui si tocca. Con uno scotch è un pendolo (2,4° → −1,8° → …,
  7 pose); con due il foglio non può girare e si solleva dal basso (scala
  verticale 0,972 → …). **Stop motion vero**: 12 fps, ogni posa ferma per un
  fotogramma (`steps(1, end)` su ogni chiave), 500 ms in tutto. Anima le
  proprietà `rotate`/`scale`, separate da `transform`: si sommano
  all'inclinazione `.tilt-l`/`.tilt-r` invece di cancellarla.
- **Cautele, verificate**: niente effetto «premuto»; non parte se il dito
  si sposta oltre 8 px, su `pointercancel` (lo scorrimento sul telefono),
  su link e bottoni dentro la card, con del testo selezionato, con «riduci
  movimento».
- **Dove**: Profilo (la card con nome e foto a sinistra, Presentazione/
  Descrizione al centro, Esperienze/Chi cerco sugli angoli, Informazioni lo
  strappato a destra), Profilo pubblico (Presentazione, Esperienze, Chi
  siamo, Chi cerchiamo, il riquadro delle foto, le recensioni, un
  pezzettino al centro sull'avatar), Impostazioni (il riquadro della mail).
- ⚠️ **LE REGOLE DELL'ORDINE** (Tommaso, 23 ottobre: con due pezzi per
  card e le diagonali sugli angoli il profilo era «troppo incasinato»):
  - **UN pezzo per oggetto**, sempre sul bordo ALTO e quasi dritto (±4°);
  - **foto** → il pezzo `lungo`, al centro (sulle miniature a scala 0,6);
  - **card** → `corto`/`cortoB` alternati `sopraSx` / `sopraDx` (al 22% e al
    78% del bordo) scendendo la pagina: il ritmo della bacheca, ma ordinato;
  - **oggetti piccoli** (avatar, riquadro della mail) → lo `strappato`, al centro;
  - **niente diagonali sugli angoli**: escono dalla sagoma e pesano più di
    tutto il resto. Le posizioni `sx`/`dx`/`…Basso` restano nel codice ma
    non le usa nessuno;
  - le sezioni con bottoni dentro (Interessi) e lo storico: niente scotch;
  - **un'eccezione voluta**: la card Descrizione/Presentazione del Profilo
    ha il pezzo sull'ANGOLO in alto a destra (`dx`), su richiesta di Tommaso.
  - Esperienze (Profilo) ha il pezzo DRITTO (`dritto: true`, 0°) e
    Informazioni sta sul bordo alto a destra (`sopraDx`): scelte di Tommaso
    del 24 ottobre. Nel profilo employer così Recensioni e Informazioni
    hanno tutte e due il pezzo a destra, una dopo l'altra.
- **`ui/Scotch.tsx`** è il pezzo da solo (va in un genitore `relative`),
  con gli angoli anche in basso (`sxBasso`, `dxBasso`) e una `scala` per le
  foto piccole. `Foglietto` lo usa per le card. ⚠️ Sull'avatar è un fratello
  del cerchio: il cerchio imperfetto è un ritaglio e lo taglierebbe.

## Le FOTO STAMPATE (23 ottobre)

Tommaso: le foto come stampe fisiche, stile Polaroid (reference: polaroid
con due pezzi di scotch agli angoli), angoli arrotondati come le card e il
bordo con lo stesso tratto. **`ui/FotoStampata.tsx`** + `lib/formaStampa.ts`.

- Cornice di carta `--carta-foto` (#FDFCF6, più bianca del foglio: le foto
  stanno anche DENTRO le card, e col colore del foglio la cornice si
  leggerebbe solo dal filo), margine basso più alto. Lì vanno la didascalia
  («Foto profilo» in Modifica profilo), i pallini del carosello, «1 / 5»
  nella galleria.
- ⚠️ La cornice è un SVG calcolato SOTTO il contenuto, non una maschera né il
  9 sezioni: gli angoli delle card (28 px) su una miniatura da ~110 px
  taglierebbero la foto, che sta a 5 px dal bordo; e una maschera
  taglierebbe lo scotch. Raggio 9 px sulle miniature, 16 sulle grandi.
- La finestra della foto ha gli angoli vivi, con un filo appena più scuro:
  in una stampa vera è la carta ad essere arrotondata.
- Storte dal seme (±1,8° piccole, ±0,8° grandi), con `rotate` e non
  `transform`, così dentro un `Foglietto` le oscillazioni si sommano.
- **Tutte QUADRATE**, come una Polaroid (Tommaso): il carosello del Profilo
  era 4:3, la galleria a tutto schermo mostrava la foto intera. Ora la
  galleria la RITAGLIA al centro (`object-cover`): il prezzo della
  Polaroid, una foto molto larga o molto alta perde i bordi.
- Dove: carosello del Profilo, griglia del profilo pubblico, galleria a
  tutto schermo, Modifica profilo («Aggiungi» è una stampa VUOTA
  tratteggiata). Su tutte il pezzo lungo in alto al centro.
- ⚠️ Modifica profilo: la X per togliere una foto era `opacity-0
  group-hover:opacity-100`, cioè sul telefono non si vedeva. Ora è sempre
  visibile. (Il riordino col trascinamento è HTML5 drag and drop, che sul
  telefono non va: da rifare con i tocchi, se serve.)
- ⚠️ Galleria: il `DialogContent` di shadcn aggiunge sempre la sua X, e la
  galleria ne disegnava un'altra: se ne vedevano due sovrapposte. Ora
  `DialogContent` ha `senzaChiudi`.

## I TOAST — lo scotch lungo, allungato (24 ottobre)

- Il riquadro di ogni toast è il pezzo `lungo` come MASCHERA a 9 sezioni
  (`public/images/cornici/scotch-lungo-v1.svg`, fette `0 48`, rese `0 28px`):
  le estremità strappate restano in scala, si allunga solo il nastro. Regole
  in fondo a `index.css` («I TOAST»), fuori dai layer: lo stile di sonner
  arriva a runtime e vincerebbe.
- Colore dello scotch delle card (pastello del ruolo al 55%) ma su fondo di
  FOGLIO, opaco: il toast passa sopra mappa e foto. Inchiostro sopra (8,7 /
  7,3), anche la descrizione (in grigio stava a ~3:1). Errori in terracotta
  per tutti (7,8).
- Il filo disegnato sta sul CONTENITORE dei toast (quattro `drop-shadow`
  senza sfocatura a 0,8 px): sul toast la maschera lo taglierebbe.
- ⚠️ sonner impone il carattere di sistema: `body [data-sonner-toaster] {
  font-family: inherit }` rimette Outfit.
- **Durate −25%** (Tommaso: «leggermente» più brevi): di serie 3 s invece di
  4; nelle chiamate 2000 → 1500, 2500 → 1900, 3000 → 2300, 4000 → 3000.
- L'unico toast dell'altra libreria (Radix, in `ApplicationCard`) è passato a
  sonner: tutti i toast hanno lo stesso nastro. `ui/toaster.tsx` resta
  montato in App ma non lo usa più nessuno.

## Scorrere le foto col dito (24 ottobre)

Tommaso: «non c'è un movimento naturale per scorrere», si cambiava foto solo
coi pallini (Profilo) o con le frecce (galleria del profilo pubblico).

- **`profile/CaroselloFoto.tsx`** (Profilo): una striscia che segue il
  dito; al rilascio va alla foto accanto se spinta oltre un quinto della
  larghezza o con un colpo veloce (400 px/s), se no torna. A molla, fluida:
  è un gesto. `touch-action: pan-y`, quindi la pagina scorre ancora in
  verticale. Verificato con tocchi veri: un trascinamento → foto 2, due →
  foto 3, uno da 40 px → resta.
- **Galleria**: la stampa intera si trascina e, lasciata oltre 80 px, vola
  via e arriva la prossima. Prima c'era uno swipe a soglia senza che la foto
  si muovesse.
- ⚠️ **Lo swipe fra le schede** (`SwipeNavigator`) ascolta i tocchi di tutta
  la pagina con listener NATIVI: uno `stopPropagation` di React arriverebbe
  tardi. Ignora i gesti che partono dentro `[data-senza-swipe-tab]`, che il
  carosello mette su di sé. Chiunque aggiunga un gesto orizzontale in una
  pagina con le schede deve mettere quell'attributo.
- I colori di card e campi NON sono cambiati con la gerarchia scura
  (misurati: card `#FAF5EC`, campo `#F3EADD`): sembrano più bianchi per
  contrasto con i pieni scuri. La Polaroid invece è davvero più chiara
  (`--carta-foto` `#FDFCF6`), scelta apposta.

## Le recensioni dell'attività (24 ottobre)

- **Tre alla volta** (Tommaso): `reviews/RecensioniRicevute.tsx` mostra le
  ultime tre, «Mostra altre N recensioni» ne aggiunge tre, alla fine «Mostra
  meno». Prima il profilo pubblico di un'attività recensita era un lungo
  scorrimento.
- **Anche nel proprio profilo dell'employer** («Le tue recensioni», dopo
  «Chi cerco»): prima non poteva vederle. I worker no: ricevono i cuori.
- **`hooks/useRecensioni.ts`**, una lettura sola per i due profili (chiave
  `['recensioni', id]`, invalidata da ReviewPrompt dopo l'invio).
  ⚠️ Prende TUTTE le recensioni: il profilo pubblico ne leggeva 10 e da
  quelle calcolava media e numero in testa al profilo, sbagliati oltre la
  decima. Quante se ne mostrano lo decide l'elenco.

## L'intestazione del profilo pubblico: tre righe (24 ottobre)

Erano cinque righe centrate, una per dato (nome, pillola del ruolo,
indirizzo, sito, cinque stelle): un elenco, non un'intestazione (Tommaso).
Ora: **nome** · **«★ 3,5 (6) · zona»** in una riga (come Airbnb e Google
Maps) · **i link**.
- Via la pillola «Employer»/«Worker»: a un profilo si arriva da un annuncio
  o da una candidatura, il ruolo lo si sa già, e lo dice il colore.
- Una stella sola col numero: la fila di cinque ripeteva il dato. Il voto è
  un bottone che scorre alle recensioni (`#recensioni`).
- Decimali con la virgola («3,5»), anche nel proprio profilo.

## Le tessere dei ruoli in registrazione (24 ottobre)

- **`auth/TesseraRuolo.tsx`**, una sola per Auth e Scegli ruolo (erano due
  copie). Contorno disegnato delle card (`.material-card`) al posto del
  bordo CSS; scelta, il fondo tenue del ruolo (`employer-50` / `accent-worker`).
- ⚠️ La tessera scelta aveva un fondo grigio-verde: `bg-employer/15` con la
  gerarchia scura è il 15% del blu SCURO sulla carta. Anche il pastello
  velato si spegneva in grigio: servono le tinte pensate per i fondi.
- ⚠️ **`--accent-worker`**: la stessa tinta di `--accent` ma FISSA. `--accent`
  sotto `[data-ruolo="employer"]` diventa azzurro, e scegliendo «Offro
  impiego» la valigetta del worker diventava blu.
- Al posto del pallino, le **puntine della bacheca**, fuori dalla maschera:
  grigie (`paper-line`) finché la tessera non è scelta; scelta, nel colore
  del ruolo, e si piantano con uno scatto a 12 fps (si alza, si pianta, torna).
- In Annunci il titolo è «I tuoi annunci» (era «I Tuoi Annunci Pubblicati» e
  toccava il bottone «Crea»), con `gap-4` e il bottone `shrink-0`.

## La scelta del quartiere: una scheda con la ricerca (24 ottobre)

`ui/NeighborhoodSelect.tsx` (registrazione, Scegli ruolo, Modifica profilo).
Era il menu a tendina generico di Radix: riquadro col bordo CSS e l'ombra di
serie, e su 39 quartieri si scorreva con la freccetta in fondo (Tommaso:
«poco personalizzata e responsiva»).
- Ora il campo apre una **scheda dal basso** (quella dell'app, bordo a mano
  e fessura), come Google Maps e le app di consegna: ricerca in cima, righe
  da 44 px che scorrono col dito, lettere dell'alfabeto come titoletti,
  scelta nell'inchiostro del ruolo con la spunta. Si chiude da sola alla
  scelta.
- La ricerca ignora accenti, apostrofi e maiuscole: «sant i» trova
  Sant'Ilario, «pra» trova Prà.
- La tastiera NON si apre da sola: coprirebbe mezzo elenco.
- Le righe hanno `sagoma-quartiere`, tarata proprio su 44 px (22 + 22).
- Il campo è un bottone con `campo-guscio`, come gli altri campi; l'icona è
  la nostra `MappaIcon` (era il pin di lucide, §8).

---

# 23. Attività o privato, età, verifiche — 24 ottobre 2026

Specifica di Tommaso. Migration `20261024120000_attivita_privato.sql`
(provata su PGlite, 12 casi), edge function `verifica-partita-iva`. **Applicata
il 25 ottobre** (verificato via REST; `profili_riservati` all'anonimo
risponde 200 ma con `[]`: le RLS non gli danno righe).

## Il modello
- `profiles.tipo_employer` ('attivita' | 'privato'; NULL per i worker). Gli
  employer di prima → 'attivita', nessun altro dato toccato.
- ⚠️ **`profili_riservati`, letta SOLO dal proprietario**: data di nascita,
  conferma dei 18 anni, partita IVA (e il nome su VIES), il centro VERO
  dell'area del privato e lo spostamento. Le policy di `profiles` fanno
  leggere ogni colonna a qualunque utente autenticato: lì questi dati
  sarebbero pubblici.
- **L'area del privato**: si sceglie un cerchio (300 m, `RAGGIO_AREA`) in
  configurazione; il centro va nei riservati, e il trigger
  `pubblica_riservati` scrive in `profiles.lat/lng` (e negli annunci) il
  centro SPOSTATO: fino a 100 m, uniforme sul disco (`sqrt(random())`),
  generato una volta e poi fisso (`prepara_riservati` lo protegge anche da
  chi provasse a scriverlo). Così anche un cerchio centrato su casa non dice
  dov'è la casa.
- ⚠️ **Protezioni nel database** (`proteggi_profilo`): l'utente non si dà i
  badge, non cambia il tipo una volta scelto, e per un privato non può
  scrivere `lat`/`lng`/`area_raggio` in `profiles`. Gli annunci di un privato
  prendono SEMPRE l'area pubblica (`posizione_annuncio`), qualunque cosa
  mandi l'app; quelli delle attività hanno `area_raggio` NULL. I trigger
  riconoscono il database stesso da `set_config('politask.server','on')`.
- **Età**: `prepara_riservati` rifiuta una data di nascita da minorenne
  ('minorenne'); l'app lo dice prima con `MESSAGGIO_MINORENNE`.

## Le verifiche (facoltative, anche dopo da Modifica profilo)
- **Partita IVA** → edge function `verifica-partita-iva`: controlla le 11
  cifre e la cifra di controllo, poi VIES (REST, provato: Poste valida,
  12345678903 non valida). Accende `piva_verificata` con la chiave di
  servizio. ⚠️ VIES dice che la partita IVA ESISTE, non che è di chi la
  scrive: una partita IVA già verificata su un account non ne verifica un
  altro, e il nome VIES si salva nei riservati per i controlli a mano.
  VIES a volte non risponde: «riprova», non «non valida». Cambiando la
  partita IVA il badge si spegne.
- **Identità del privato**: solo interfaccia e stato
  (`identita_verificata`, lo accende solo il server). Il bottone apre una
  scheda «Arriva presto». Il servizio si sceglie con l'avvocato.
- Etichette in `StatusBadge`: `attivita_verificata` (verde tenue),
  `privato_non_verificato` (neutra). Nel profilo pubblico sotto il nome.
  Nella scheda annuncio SOLO «Attività verificata» (Tommaso, 25 ottobre:
  «Privato non verificato» sotto il nome pesava come un avvertimento; lo si
  legge entrando nel profilo).
- Il selettore del pin dell'attività (`LocationPicker`) e l'avviso «fuori
  Genova» hanno la stessa veste dell'area del privato: mappa `.sagoma-foto`
  senza bottoni dello zoom, avviso `sagoma-quartiere` + `danger-soft`.

## Dove nell'app
- Registrazione (Auth) e Scegli ruolo: «Offro impiego» → seconda scelta
  `SceltaTipoEmployer` (tessere piccole con puntina). Privato: niente
  indirizzo, «Nome e cognome», «In che zona ti trovi?». Worker:
  `CampoMaggiorenne` (data + «Confermo di avere almeno 18 anni»). Testi in
  `lib/registrazione.ts` (`testiEmployer`).
- Configurazione (Onboarding): titolo per tipo; riquadro colorato con il
  bordo basso tagliato a mano (`IntestazioneAMano`: tratto calcolato sulla
  larghezza vera, seme fisso, scarto 1,1 px perché su un bordo pieno senza
  filo ±0,5 non si vedrebbe); privato: `AreaPicker` (cerchio trascinabile,
  «Non mostreremo mai il tuo indirizzo»); foto con le stampe di Modifica
  profilo (`PhotoGalleryManager`) per tutti; sezione «Verifica (facoltativa)».
- Mappa: gli annunci dei privati sono **PIN come gli altri**, sul centro già
  spostato. ⚠️ Prima versione: cerchi sempre visibili — bocciati (Tommaso:
  «occupano troppo spazio e rendono la mappa confusionaria»). Ora il cerchio
  (tratteggiato, bordo a mano col seme del privato) compare sulla mappa SOLO
  a scheda aperta (`areaAperta` in `InteractiveMap`), e la scheda dice
  «Posizione approssimativa, entro 300 m». Minimappa (Lista, chat): il
  cerchio al posto del pin, niente indirizzo.
- ⚠️ Codice nuovo + database vecchio = **mappa VUOTA**: le letture degli
  annunci chiedono `profiles(tipo_employer, …)`, e una colonna che non c'è
  fa fallire tutta la lettura (42703). Successo il 24 ottobre in locale prima
  di applicare la migration: niente era stato cancellato.
- ⚠️ Non fatto: cambiare l'area da Modifica profilo (oggi solo in
  configurazione); il controllo dei 18 anni per chi non manda la data
  (chiamando le API a mano) — il database rifiuta solo una data da
  minorenne, non l'assenza della data.
