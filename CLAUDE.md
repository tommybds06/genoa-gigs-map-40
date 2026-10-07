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
8. **`git pull --rebase` prima di ogni push.** Lovable committa da solo sullo
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
  `get-mapbox-token`
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
    bacheca/      Bacheca, CartellinoCard, SchedaCartellino,
                  AggiungiCartellino, PromemoriaScadenza (§16)
    chat/ applications/ jobs/ profile/ onboarding/ reviews/ tags/ skeletons/
    auth/ icons/  ui/ (shadcn)
  hooks/          useAppTheme (dual-theme), useAuth, useChats, useJobs,
                  useCartellini, useMapboxToken
  contexts/       UserContext (role: worker | employer) — il profilo dell'utente
                  sta QUI, già in memoria: non rileggerlo nelle pagine (§12)
  lib/            dates.ts, tagColors.ts, percorsoAccesso.ts, jobIcons.ts,
                  bacheca.ts (azioni e regole della bacheca, §16)
  integrations/   supabase/ (client, types generati), lovable/ (auto-generato)
supabase/
  migrations/     SQL + RLS — le versioni COMMENTATE, scritte da noi
  functions/get-mapbox-token/
drizzle/
  migrations/     quello che Lovable ha davvero eseguito (§13)
public/
  images/cornici/ le sagome e i bordi disegnati (§6)
  splash/         video e fotogrammi dello splash (§17)
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

⚠️ **Gli avatar tondi aspettano un disegno** (`sagoma-cerchio.svg`, 120×120,
spec in `brand/POLITASK-specifiche-disegni.md`): un cerchio **non** si ricava
dalle sagome esistenti, perché il 9 sezioni tiene gli angoli fissi e stira le
bande — una pillola stirata in un quadrato resta una pillola. Lì però il 9
sezioni non serve: un avatar è sempre quadrato, quindi basta `mask-image` con
`mask-size: 100% 100%` e un file solo copre tutte le misure.

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
- **Cancellate `.material-btn*` e `.material-input`**: non le usava nessuno ed
  erano un secondo sistema con raggi diversi, pronto a essere ripreso per errore.
- I campi usano `Input` / `Textarea` / `SelectTrigger`, che si generano il guscio
  da soli: i campi nuovi ereditano tutto senza toccare nulla.
- `senzaTratto` sull'`Input` toglie il contorno dove l'altezza non è quella
  standard (nessuno lo usa più, ma resta come via d'uscita).

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
è `currentColor`, l'**ago resta in inchiostro**.

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
  390px, non dedotto. Soluzione: disegno alla proporzione vera
  (`cartellino-tratteggiato.svg`, 176×248) e contenitore con `aspect-ratio`
  fisso + `background-size: 100% 100%`, così si scala in modo uniforme. Vale
  per qualunque tratteggio: il 9 sezioni va bene solo per tratti continui.
- **Radix `Select` dentro un drawer vaul**: combinazione nota per problemi di
  tocco e scorrimento. Nella scheda del cartellino l'unità di paga è fatta con
  chip, non con un menu.
- **I `Dialog` di Radix si chiudono al `pointerdown` sul document** («clic
  fuori») e mettono `pointer-events: none` sul `body`. Qualunque strato
  sopra un dialog aperto (lo splash, §17) deve fare `stopPropagation` sul
  `pointerdown` e dichiarare `pointer-events: auto`, se no il suo tocco
  chiude il dialog sotto, o non arriva affatto.
- **StrictMode chiama due volte l'inizializzatore di `useState`** (in
  sviluppo). Niente scritture lì dentro: lo splash scriveva la data di
  «visto oggi» nell'inizializzatore, e la seconda chiamata leggeva «già
  visto» → in locale non compariva mai. Le scritture vanno in un effetto.
- **Chromium mette in pausa i video senza audio nelle schede non visibili**
  (`play()` → `AbortError: video-only background media was paused to save
  power`). Nel pannello browser di Claude, se è nascosto, il video dello
  splash non parte mai: non è un bug dell'app. Stesso motivo per cui lì
  `requestAnimationFrame` non scatta: per misurare usare i timer.
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
- **Splash d'apertura** col video del logo — vedi §17. Anticipa un pezzo della
  Fase 5.
- **Cambio tab più leggero**: istantaneo, Lista e Annunci senza ricaricare a
  ogni visita (§12, Prestazioni).

## Da fare

1. **Bacheca**: provarla con dati veri (appendere, assumere, terminare,
   l'avviso di scadenza) — scritta e verificata solo con dati finti. Poi la
   **versione worker** (la sua bacheca «al contrario»): la tabella è già
   pronta, il worker può leggere i propri cartellini.
2. **Pagine montate una volta sola** invece che a ogni cambio tab (§12,
   Prestazioni): il pezzo grosso rimasto sul lag.
3. **Revisione schermata per schermata** (in corso): fatte accesso,
   registrazione, onboarding, home, scheda annuncio. Restano lista, messaggi,
   chat, annunci, crea annuncio, profilo, profilo pubblico, modifica profilo,
   impostazioni.
4. **Tre migration rimandate**: trigger su `chats.updated_at`, colonna
   `is_system` su `messages` (ora i messaggi automatici si riconoscono per
   stringa in `dates.ts`), e `lm.is_system` + `j.tags` nella vista
   `chat_overview`.
5. **Disegni mancanti**: sagoma del pin, cornici di chip e contenitore, eventuali
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

Ora il pin apre direttamente la scheda, che si ferma a **320px** (`ALTEZZA_MINIMA`,
`snapPoints={[ALTEZZA_MINIMA, 0.92]}`): la mappa resta visibile sopra, il pin non
viene coperto, e per il resto si trascina in su. È Apple Maps e Google Maps.

Conseguenze strutturali, tutte obbligate:

- **Il bottone «Candidati» sta nella testa, non in fondo.** Con gli agganci il
  fondo della scheda è sotto la piega: un footer là sotto sarebbe invisibile
  finché non trascini, e l'azione principale non si merita un trascinamento.
- **I 320px non sono un numero a caso**: maniglia 24 + titolo su due righe 62 +
  paga 38 + orario 33 + chip 47 + bottone 80 = **284**. I 36 di margine fanno
  vedere la divisoria e l'inizio della riga employer — l'indizio che sotto c'è
  dell'altro.
- ⚠️ **Gli agganci vaul si calcolano sull'altezza della FINESTRA**, non su quella
  della scheda: perché a tutta altezza arrivi in fondo, il contenuto deve essere
  `h-[92vh]`. L'altezza in eccesso sta sotto la piega, quindi il vuoto in fondo
  non si vede più.
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

## Ancora da decidere

- **La paga in Shinjo**: è un valore, e la regola dice che i valori stanno in
  Outfit (il select del quartiere). Qui è però un uso da *display* a 28px, che è
  esattamente ciò per cui Shinjo esiste. Se stona, è una riga da cambiare.
- All'aggancio alto, un annuncio corto lascia carta vuota sotto il contenuto.
  Non è più il difetto di prima (lo stato di riposo ora è giusto), ma se dà
  fastidio serve un secondo aggancio misurato sul contenuto.
- Manca la **distanza** («a 800 m da te»), che su un'app centrata sulla mappa
  sarebbe il secondo dato più utile dopo la paga. Servono le coordinate
  dell'utente nella scheda: oggi non ci arrivano.

---

# 16. La bacheca dell'employer — ottobre 2026

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
- **La paga si precompila dal testo dell'annuncio** («9€/h» → 9, ora) con
  `leggiPagaDaTesto`, ma **non si salva** finché l'employer non preme Salva.
- **Nessun totale della paga**: servirebbero le ore a settimana, che non
  chiediamo. Mostrarlo sarebbe un numero inventato.

## La «notifica» di fine lavoro

Non ci sono push (arrivano con Despia, Fase 10). `PromemoriaScadenza`,
montato in `App.tsx` accanto a `ReviewPrompt`: all'avvio, **dal giorno dopo**
la data di fine (l'ultimo giorno il lavoro c'è ancora), propone +1 settimana,
+1 mese, Concludi (o «Chiudi la prova»), Più tardi. Più un **pallino** sulla
scheda «Bacheca» finché c'è qualcosa da decidere.

## Il disegno

- **Cartellino** = `.material-card` (sagome a–d alternate come nelle liste)
  con **proporzione fissa 176:248**, foto con `.sagoma-foto`. Dentro: foto,
  nome, mestiere, poi DUE righe sole — paga, e o l'avviso di scadenza (ha la
  precedenza) o i giorni. Una terza riga a 360px non entra.
- ⚠️ **Il chip «In prova» sta in basso al centro della foto**: negli angoli la
  maschera della foto lo tagliava.
- ⚠️ **`pb-4` sulla card**: col solo `p-2.5` l'ultima riga toccava il margine
  tagliato.
- **Inclinazione** fino a ±1,9°, più delle liste (±0,5°): una bacheca non è un
  elenco ordinato. Puntina e inclinazione derivano dall'**id** (`varieta`),
  così riordinare non le rimescola. Rispetta `prefers-reduced-motion`.
- **Puntine**: tre disegni di Tommaso (`icons/puntine.tsx`). Testa nel colore
  del ruolo, **ago in inchiostro** (tutto colorato leggeva come un
  giocattolo). Provate a 390px: **arancio pastello** e **`employer-700`**
  reggono; l'arancio-ink diventa marrone, il blu pastello sbiadisce. Stanno
  **fuori** dalla card mascherata, se no la maschera le taglia.
- **Il «+»**: `cartellino-tratteggiato.svg` (disegno di Tommaso, 176×248),
  ricolorato da nero a `#9C8B74` (`--paper-edge`): in nero pesava più dei
  cartellini veri. Perché non il 9 sezioni: vedi §12.
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

---

# 17. Lo splash d'apertura — ottobre 2026

Il video del logo animato all'apertura, **una volta al giorno**.
`components/layout/SplashScreen.tsx`, file in `public/splash/`
(`politask-splash.webm`/`.mp4`, `-inizio.png`, `-finale.png`): 720×1280,
5,6 s, senza audio, fondo `#F3EFE3`.

- **È uno strato sopra l'app, non un cancello prima**: montato per ultimo in
  `App.tsx`, fuori dal router. L'app sotto carica sessione, profilo e mappa
  mentre il video gira.
- **Si chiude**: a fine video · al tocco · dopo **1 s d'immagine finale** se il
  video non parte o dà errore (anche `play()` rifiutato: su iOS in risparmio
  energetico l'autoplay viene negato senza eventi) · comunque dopo **7 s**.
  Dissolvenza di 300 ms.
- **Con «riduci movimento»** solo l'immagine finale per 1 s.
- **Una volta al giorno**: data in `localStorage`, chiave
  `politask-splash-visto`, sempre in try/catch. Scritta in un effetto, non
  nell'inizializzatore di `useState` (StrictMode, §12).
- **Per rivederlo**: `?splash` nell'indirizzo lo forza; oppure in console
  `localStorage.removeItem('politask-splash-visto')`.
- ⚠️ **Il tocco non deve chiudere i dialog sotto**: all'avvio si aprono proprio
  lì il promemoria recensioni e l'avviso di fine lavoro. `stopPropagation` sul
  `pointerdown` + `pointer-events: auto` esplicito (§12).
- **`index.html`**: `theme-color` e fondo di `html, body` a `#F3EFE3`, in uno
  `<style>` nell'head, così non c'è lampo bianco prima del primo fotogramma.
  Dopo, `index.css` riporta il `body` su `--paper` (`#F4EEE2`): una unità per
  canale, invisibile. **`--paper` non è stato toccato.**
- ⚠️ **Nomi dei file in minuscolo col trattino.** Erano arrivati come
  `Politask_splash.webm`: sul Mac le maiuscole non contano, online sì — un nome
  scritto con la maiuscola sbagliata funziona in locale e dà 404 in produzione.
- **Non ancora visto girare fino in fondo** dal pannello browser di Claude (lì
  Chromium blocca i video quando il pannello è nascosto, §12). Verificati:
  tocco (si chiude in 315 ms senza arrivare al document), regola del giorno,
  ripiego sull'immagine.
