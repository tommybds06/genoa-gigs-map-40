# Politask — Specifiche dei disegni da fare in Illustrator

> Tutto quello che serve disegnare, con i vincoli tecnici che ne determinano la
> resa. Ogni vincolo qui dentro c'è perché senza si rompe qualcosa di preciso:
> l'ho scritto accanto, così sai cosa stai proteggendo.

**Regola che vale per tutto:** il tratto è **bruno `#382D24`**, mai nero. Il
colore lo passo io da codice dove serve (arancio worker / blu employer), quindi
disegna in bruno e non preoccuparti delle varianti.

---

## Riepilogo — 13 file

| # | Cosa | Tavola | Serve per |
|---|---|---|---|
| 1 | Onde — mare | 64 × 64 | mappa |
| 2 | Alberelli A — bosco fitto | 96 × 96 | mappa |
| 3 | Alberelli B — verde rado | 96 × 96 | mappa |
| 4 | Casette — edifici | 48 × 48 | mappa |
| 5-6 | Cornice **bottone** (2 misure) | 96 × 96 | UI |
| 7-8 | Cornice **chip** (2 misure) | 96 × 96 | UI |
| 9-10 | Cornice **contenitore** (2 misure) | 96 × 96 | UI |
| 11 | Linea divisoria | 240 × 12 | UI |
| 12 | Sottolineatura nav attiva | 48 × 12 | UI |
| 13 | *(opzionale)* Linea divisoria corta | 120 × 12 | UI |

---

## PARTE 1 — Motivi per la mappa

Vanno caricati in Mapbox Studio e usati come riempimento al posto del colore
pieno. Si ripetono a tappeto dentro la forma (il mare, un parco, un isolato).

### ⚠️ Il vincolo che conta: devono affiancarsi senza giunzione

Il disegno viene ripetuto a griglia. Se un elemento tocca il bordo destro deve
**continuare identico** sul bordo sinistro alla stessa altezza, e lo stesso
sopra/sotto. Due modi per essere sicuro:

- **il modo facile:** tieni tutto il disegno *dentro* la tavola, senza toccare i
  bordi. Nessuna giunzione da far combaciare.
- **il modo giusto per le onde:** l'onda deve attraversare, quindi deve entrare
  a sinistra e uscire a destra **alla stessa coordinata Y**, con la stessa
  inclinazione.

### ⚠️ Il secondo vincolo: la ripetizione non si deve notare

È l'errore che ho fatto con la texture di carta e che ci è costato cinque giri.
Su uno schermo la stessa piastrella compare decine di volte, e **il cervello
riconosce il motivo che si ripete** — a quel punto non legge più "disegno a
mano" ma "carta da parati". Quindi:

- niente elemento singolo vistoso al centro: diventa una griglia di punti
- distribuisci in modo **irregolare**, non simmetrico e non centrato
- **prova sempre affiancando 3×3 copie** prima di considerarlo finito. In
  Illustrator: seleziona tutto, `Object → Pattern → Make`, e vedi l'anteprima
  ripetuta. Se noti file, croci o allineamenti, sposta gli elementi.

### 1 · Onde — mare · tavola 64 × 64

Righe ondulate orizzontali, come le cartine nautiche.

- **4 onde** distribuite in verticale, spaziate ~16px
- ampiezza dell'ondulazione **±2,5px**, periodo ~32px (due gobbe per riga)
- tratto **1,5px**, estremità arrotondate
- ogni riga entra ed esce **alla stessa Y** sui due lati verticali
- sfalsa le righe orizzontalmente tra loro, così non si allineano in colonne

> Molto tenue: sotto ci va il colore dell'acqua e sopra ci vanno le etichette.
> Se guardando la mappa "vedi le onde", sono troppo marcate.

### 2 e 3 · Alberelli — verde · tavola 96 × 96 (due file)

Due densità diverse, stesso disegno di albero.

- **A — bosco fitto:** 5-6 alberelli
- **B — verde rado:** 2-3 alberelli, per parchi e prati

Per entrambi:

- albero alto **14-18px**, silhouette piena, non a contorno
- **due o tre sagome leggermente diverse** ripetute con rotazioni minime: tutti
  identici si notano subito
- distribuzione irregolare, **nessun albero tocca i bordi**
- tratto/riempimento in bruno al **35% di opacità** — o disegnalo pieno, la
  trasparenza la regolo io

### 4 · Casette — edifici · tavola 48 × 48

- 3-4 sagome minime di tetto o quadratini, **6-10px**
- molto più tenue degli alberi: gli edifici in città sono tantissimi e questo
  motivo si ripete su aree grandi
- niente dettagli interni (porte, finestre): a schermo spariscono e sporcano

### Come esportarli

SVG, oppure PNG a **due risoluzioni** (1× e 2×, cioè 64 e 128 per le onde) se
preferisci controllare la resa esatta. Sfondo **trasparente**: il colore di
fondo lo mette lo stile della mappa sotto il motivo.

---

## PARTE 2 — Cornici dei componenti

Tecnica già validata in `brand/prototipo-cornici.html`: la cornice viene
ritagliata in 9 sezioni, gli angoli restano fissi e solo i lati si allungano.
Così lo stesso disegno funziona su un bottone da 90px e su una card da 380px.

### ⚠️ Il vincolo: le bande centrali devono restare quasi dritte

I **32px centrali di ogni lato** sono la parte che viene **stirata**. Un
ricciolo lì dentro, su una card larga, diventa una gomma tirata. Tutto il
carattere va **negli angoli**, che non si deformano mai.

### Specifiche comuni

| Parametro | Valore |
|---|---|
| Tavola | **96 × 96** (quadrata, viewBox uguale) |
| Zona angolo | **32px** per lato |
| Inset dal bordo | **4-5px** (o il tratto viene tagliato) |
| Tratto misura grande | **5px** → resa 2,5px |
| Tratto misura piccola | **3,5px** → resa ~1,8px |

### Perché due misure di ogni cornice

Il bordo occupa spazio interno: sotto i ~40px di altezza la cornice grande non
ci sta e il testo non ha più posto. Quindi:

- **misura grande** → bottoni, contenitori (altezza ≥ 44px)
- **misura piccola** → chip, badge, elementi bassi

### 5-6 · Cornice bottone

Rettangolo arrotondato, raggi **irregolari tra loro** (es. 22 / 26 / 20 / 25):
è l'irregolarità che fa il lavoro, non l'ampiezza. Chiusa e continua.

### 7-8 · Cornice chip

Molto più arrotondata, quasi una pillola. Raggi grandi e diversi tra loro.
Attenzione: qui la banda centrale è corta, quindi tieni gli angoli più stretti
— 24px invece di 32 — così resta banda da allungare.

### 9-10 · Cornice contenitore (empty state)

La più libera: è grande e si vede. Qui puoi permetterti un tratto più mosso e
un'apertura, se ti piace l'idea del riquadro non perfettamente chiuso.

---

## PARTE 3 — Linee irregolari

Le tue prove sulla nav sono la strada giusta. Servono due pezzi.

### 11 · Linea divisoria · tavola 240 × 12

La linea sotto l'header, sopra la nav, tra le sezioni.

- linea orizzontale che oscilla di **±2px** attorno alla mezzeria (Y = 6)
- tratto **2,5px**, estremità arrotondate
- ⚠️ **deve entrare e uscire esattamente a Y = 6** sui due lati, altrimenti
  ripetendola si vedono i gradini
- ondulazione **non periodica**: se le gobbe sono regolari, affiancando due
  copie si vede il ritmo. Falla irregolare, con una gobba più larga

> 240px è largo abbastanza da coprire quasi tutto uno schermo da 390 con una
> ripetizione sola. Se ti viene comodo farla più lunga, meglio ancora.

### 12 · Sottolineatura nav attiva · tavola 48 × 12

Il trattino sotto l'icona attiva, come nella tua prova.

- **un solo tratto** deciso, leggermente arcuato, **34-40px** di lunghezza
- tratto **3px**, estremità arrotondate, un'estremità più sottile se ti piace
  l'effetto pennello
- centrato nella tavola, **non** deve affiancarsi: è un pezzo singolo

> Questa mi piace molto come idea: è il tipo di dettaglio che si nota senza
> essere invadente, e costa un file solo.

---

## Come consegnarli

- **SVG**, uno per file, nomi in minuscolo con trattino:
  `motivo-onde.svg`, `motivo-alberi-fitto.svg`, `motivo-alberi-rado.svg`,
  `motivo-case.svg`, `cornice-bottone-g.svg`, `cornice-bottone-p.svg`,
  `cornice-chip-g.svg`, `cornice-chip-p.svg`, `cornice-contenitore-g.svg`,
  `cornice-contenitore-p.svg`, `linea-divisoria.svg`, `linea-nav-attiva.svg`
- **`viewBox` uguale alla tavola** e nessun `width`/`height` fisso
- **niente colore hard-coded** dove possibile: se c'è, lo neutralizzo io
- tratto **espanso in tracciato** (`Object → Path → Outline Stroke`) oppure
  lasciato come stroke — funzionano entrambi, basta che sia coerente
- ⚠️ **Object → Artboards → Fit to Artwork Bounds** prima di esportare, e un
  giro in modalità contorno (`⌘Y`) per scovare oggetti vaganti

> Quest'ultimo punto non è teorico: nel logo che mi hai mandato c'era un
> puntino bianco da 5 unità nell'angolo, e faceva sì che il disegno occupasse
> il 21% della tela. Con le cornici a 9 sezioni un oggetto vagante è ancora
> peggio, perché sposta il ritaglio degli angoli e la cornice esce deformata.

---

## Ordine consigliato

1. **Linea divisoria** e **sottolineatura nav** — due file piccoli, effetto
   immediato, e ti fanno tarare quanto "mosso" ti piace prima di fare il resto
2. **Cornice bottone** nelle due misure — il componente più visibile
3. **Chip** e **contenitore**
4. **Motivi della mappa** — per ultimi, perché dipendono anche dalla risposta
   sulla licenza del font e da una sessione in Mapbox Studio

Mandameli anche uno alla volta: li monto man mano e vedi subito come stanno
nell'app, invece di scoprire alla fine che un tratto è troppo spesso.
