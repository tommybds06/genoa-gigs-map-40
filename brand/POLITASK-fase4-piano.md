# Politask — Piano per chiudere la Fase 4

> Stato verificato sul codice il 6 agosto 2026, non ricopiato dall'audit.
> Legenda proprietà: **[C]** lo faccio io · **[T]** serve Tommaso · **[CT]** insieme.

---

## Blocco 0 — Committare quello che c'è

Prima di tutto, perché ~25 file modificati e 3 nuovi non sono mai stati salvati e un
incidente qui costa una giornata.

- [ ] **[C]** tre commit separati: `fix:` blocco funzionale · `feat:` palette carta +
      StatusBadge · `feat:` stile mappa prototipo
- [ ] **[T]** cancellare `public/textures/` (texture scartata)
- [ ] **[C]** aggiungere `"typecheck": "tsc -p tsconfig.app.json --noEmit"` a `package.json`

---

## Le tre decisioni che bloccano il resto

Vanno chiuse per prime perché il resto del lavoro estetico dipende da loro. Tutto ciò
che sta nel Blocco A invece **non dipende da queste** e può partire subito in parallelo.

### D1 · Logo — ventose sì o no, e licenza Shinjo

Due questioni diverse che si sono intrecciate.

**Distintività.** Togliendo le ventose la P diventa una spirale, forma comune nei loghi.
Il problema è il tempismo: adottando Shinjo le lettere non sono più originali e in sede
di deposito vanno disconosciute, quindi tutta la distintività si concentra sulla P.
→ *Proposta: rimettere 3-4 ventose grandi solo sull'arco esterno, tenendo la nuova
geometria (che riempie meglio il quadrato) e il contorno a pin.*

**Licenza.** I termini di Creative Market permettono un font nel logo solo se l'asset è
modificato **e** non dominante. Nel wordmark le lettere sono dominanti.
→ *Serve ridisegnare le lettere partendo da Shinjo finché sono originali.*
→ **Da chiudere PRIMA del deposito EUTM.** È l'unica voce con una scadenza esterna.

- [ ] **[T]** decidere sulle ventose e riverificare l'occhiello centrale a 40px
- [ ] **[T]** acquistare Desktop (~$17) + Webfont (~$14)
- [ ] **[T]** ridisegnare le lettere del wordmark

### D2 · Font dei titoli

| Opzione | Pro | Contro |
|---|---|---|
| **Shinjo** | coerente col logo, hand-drawn vero | un solo peso, licenza da chiudere, mai sotto 18px |
| **Gabarito** | gratis, licenza aperta, ha vinto il confronto a 4 | meno carattere, non è il font del logo |
| **Ibrido** (raccomandato) | lettering tuo sulle ~12 stringhe fisse + font per il dinamico | serve che tu disegni |

Nota: qualunque cosa si scelga, **Outfit resta per il testo**. La decisione riguarda
solo i titoli.

- [ ] **[T]** scegliere
- [ ] **[T]** se ibrido: disegnare le ~12 stringhe fisse come SVG *(elenco nel Blocco B)*
- [ ] **[C]** montarle come componenti theme-aware, come già fatto per le icone

### D3 · Cornici hand-drawn

Tecnica già validata (`brand/prototipo-cornici.html`). Servono **3 cornici** in **2
misure di tratto**: bottone primario, chip, contenitore empty state. Tavola 96×96,
zona angolo 32px, tratto 5px, e **i 32px centrali di ogni lato quasi dritti**, perché
è la banda che viene allungata.

- [ ] **[T]** disegnare i 6 SVG
- [ ] **[C]** montarli con `border-image` e sostituire i bordi CSS sui 3 componenti

---

## Blocco A — Componenti unici *(nessuna dipendenza, si parte subito)*

Risolve i punti 8, 13, 14, 15, 16 dell'audit. È il blocco con il miglior rapporto
resa/tempo: elimina la sensazione che l'app sia stata scritta da tre persone.

- [ ] **[C]** **Un solo stile di input** (audit 8). Oggi ce ne sono quattro: Auth grigio
      pieno, CreateJob crema con bordo, TagSelector pillola bianca, e il select
      "Seleziona quartiere" con icona arancio. È il componente che l'utente tocca di
      più. → estendere `.material-input` e applicarlo ovunque.
- [ ] **[C]** **Appiattire i gradienti di Auth** (audit 13) — `bg-gradient-to-r
      from-primary to-secondary` in due punti, unico gradiente dell'app.
- [ ] **[C]** **Icone di Impostazioni** (audit 14): sono grigie mentre nel resto
      dell'app sono del colore del ruolo. Regola da fissare: *icona di intestazione =
      colore di brand, icona inline accanto a testo attenuato = attenuata.*
- [ ] **[C]** **Tag durata fuori dalle preferenze** (audit 15): "Settimane" blu tra i
      ruoli arancioni in Profilo. `TagSelector` mostra ancora `TYPE_TAGS`.
- [ ] **[C]** **Emoji 🌊 nel claim** (audit 16) — cambia disegno tra iOS e Android e
      stona con un set di icone custom.
- [ ] **[C]** **Card ruolo non selezionata** (audit 25): in registrazione "Offro
      Impiego" con opacità ridotta legge come *disabilitato*, non come *non scelto*.

---

## Blocco B — Tipografia e gerarchia *(D2 blocca solo l'ultimo punto)*

- [ ] **[C]** **Raddrizzare la gerarchia** (audit 10): oggi «Impieghi per Te» è
      `text-lg` e l'empty state sotto è `text-lg` uguale — il titolo di sezione non
      domina. Serve una scala: sezione > empty state > corpo.
- [ ] **[C]** **Header blu di CreateJob** (audit 11): unica schermata con un blocco
      pieno colorato che si interrompe sul crema. Uniformare alle altre.
- [ ] **[C]** **Logo `h-8` in Settings** (audit 12) → `h-14` come ovunque.
- [ ] **[T]** *(dopo D2)* le ~12 stringhe fisse da disegnare: **Messaggi · Profilo ·
      Annunci · Lista · Impostazioni · Impieghi per Te · Stato Candidature · I tuoi
      Annunci · Nessun messaggio · Nessuna candidatura · Nessun annuncio · Imposta i
      tuoi interessi**

---

## Blocco C — Mappa

- [ ] **[C]** **Mappa a filo** (audit 17): oggi ha `px-4` e `rounded-3xl`, cioè ~30px di
      margine su ogni lato. Su mobile lo spazio verticale è la risorsa più scarsa.
- [ ] **[CT]** **Congelare lo stile in Mapbox Studio.** Oggi è un prototipo a runtime che
      *nasconde* i layer: Mapbox li scarica comunque. In Studio si **eliminano**, e la
      mappa diventa più leggera di `outdoors-v12`, non uguale.
- [ ] **[C]** verificare in console `[Politask] stile cartina: N proprietà su M layer`

---

## Blocco D — Rifiniture

- [ ] **[C]** **Stato attivo della bottom nav** (audit 18): le icone sono tutte
      arancioni e l'attiva si distingue solo per pieno/vuoto. → inattive in bruno
      tenue, attiva nel colore del ruolo: è il **salto di colore** a fare il lavoro.
- [ ] **[C]** **Frecce del carosello foto** (audit 20): due cerchi arancioni sulla foto,
      inutili su mobile dove si scorre con lo swipe. Bastano i pallini.
- [ ] **[C]** **Densità delle card** (audit 21): ~5 per schermo con 4 informazioni
      ciascuna. Riducendo padding e icona se ne guadagnano 2.
- [ ] **[C]** **Sezioni del Profilo tutte identiche** (audit 22): stesso peso, stesso
      riquadro, stessa icona. «21 anni, esperienza nel delivery» occupa una card intera.
- [ ] **[C]** **«ZONA PERICOLO»** (audit 23): traduzione letterale di *Danger Zone*, che
      è una convenzione da pannello di amministrazione. In italiano suona minaccioso per
      un logout.

### Già chiusi, non rifare
Audit **1-4, 6, 7** (blocco funzionale) · **9** (`StatusBadge` unico) · **19** (zoom
Mapbox nascosti) · **5** (respinto da Tommaso: se non ci sono lavori nella tua zona è
logico navigare) · **24** (verificato: l'email **non** compare nel profilo pubblico).

---

## Blocco E — Le tre migration rimandate

Sono tutte toppe applicate lato client che vanno chiuse lato database.
⚠️ **Ordine di deploy obbligatorio: prima la migration su Supabase, poi il push del codice.**

| Cosa | Perché | Toppa attuale |
|---|---|---|
| trigger su `chats.updated_at` | la colonna non si aggiorna a ogni messaggio | ordinamento chat lato client |
| colonna `is_system` su `messages` | distinguere i messaggi automatici | riconosciuti **per stringa** in `dates.ts` |
| vista per `useChats` | N+1: 4 query per conversazione | nessuna |

- [ ] **[C]** preparare le tre migration in un file solo
- [ ] **[T]** applicarle da Lovable, poi push

---

## Blocco F — Revisione schermata per schermata

Da fare **per ultima**, quando i componenti sono unificati: se la fai prima, correggi a
mano cose che il design system sistemerebbe da solo.

Metodo: una schermata alla volta, screenshot worker **e** employer, e per ognuna le
stesse cinque domande.

1. La gerarchia è giusta? La prima cosa che l'occhio prende è la più importante?
2. Ogni elemento cliccabile lo sembra, e ogni elemento che lo sembra lo è?
3. Colori, input e badge passano dai token, o c'è un caso speciale?
4. Cosa si può **togliere** senza perdere niente?
5. Regge in employer come in worker?

| # | Schermata | Note aperte |
|---|---|---|
| 1 | Mappa (Index) | margine a filo, marker, densità etichette |
| 2 | Lista — Esplora | gerarchia titoli, densità card |
| 3 | Lista — Candidature | densità, affordance già sistemate |
| 4 | Annunci (employer) | empty state, bottone Crea |
| 5 | CreateJob | header blu, stile input, chip durata |
| 6 | Messaggi — lista | fatto, solo verifica |
| 7 | Messaggi — chat | messaggi di sistema (serve `is_system`) |
| 8 | Profilo | sezioni monotone, carosello, densità |
| 9 | PublicProfile | coerenza con Profilo |
| 10 | Settings | logo, icone, «ZONA PERICOLO» |
| 11 | Auth / Onboarding | gradienti, input, card ruolo, emoji |

---

## Ordine consigliato

1. **Blocco 0** — committare *(oggi)*
2. **Blocco A** in parallelo alle **tre decisioni** — io lavoro sui componenti mentre tu
   decidi logo e font. Nessuno aspetta l'altro.
3. **Blocco B** e **C** — tipografia e mappa
4. **Blocco D** — rifiniture
5. **D3 cornici** appena i tuoi SVG sono pronti *(può entrare in qualsiasi momento)*
6. **Blocco E** — migration
7. **Blocco F** — revisione finale schermata per schermata

Il percorso critico non è il codice: sono **le tue tre decisioni**, e in particolare la
licenza del font, che ha una scadenza esterna (il deposito del marchio). Il resto lo
posso portare avanti in parallelo senza aspettare.
