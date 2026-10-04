# Politask — Documento di prodotto

> Cos'è, per chi, perché ha senso, e cosa resta da decidere.
> Scritto a settembre 2026, in Fase 4 di 10. Da rileggere prima di ogni
> decisione grossa: metà di quello che c'è scritto qui è ancora un'ipotesi, ed è
> segnalato dove.

---

# 1. In una frase

**Politask è una mappa dei lavoretti di Genova**: apri l'app e vedi *dove*, in
città, qualcuno sta cercando qualcuno — non un elenco di annunci ordinati per
data.

---

# 2. Il problema

Il mercato dei lavoretti occasionali esiste da sempre e funziona quasi
interamente **fuori da qualunque piattaforma**: passaparola, gruppi WhatsApp
dell'università, cartelli sulla vetrina, «mia cugina conosce uno». Funziona, ma
male, e in modo diverso dai due lati.

## Dal lato dello studente

- **Non sa cosa c'è.** Le occasioni esistono a 300 metri da casa sua e non le
  vede. Il bar sotto casa cerca qualcuno per il weekend e lo scrive su un foglio
  A4 attaccato alla porta.
- **Cerca per prossimità, non per categoria.** Uno studente di Genova non pensa
  «voglio fare il cameriere»: pensa «voglio guadagnare qualcosa senza perdere
  un'ora di autobus». La distanza è il primo filtro, non il ruolo.
- **I portali generalisti non parlano a lui.** Indeed e Subito sono costruiti per
  contratti veri, con curriculum e lettere di presentazione. Per due sere in un
  locale sono uno strumento sproporzionato.
- **Non ha un curriculum da mostrare.** A vent'anni la reputazione è tutto quello
  che hai, e non esiste un posto dove accumularla per i lavoretti.

## Dal lato di chi cerca

- **Ha bisogno adesso, non fra tre settimane.** Un cameriere per sabato si trova
  giovedì o non serve più.
- **Pubblicare su un portale è troppo lavoro** per un impegno da 50 euro.
- **Non sa a chi rivolgersi** oltre alla propria rete personale, che si esaurisce
  in fretta.
- **Non ha modo di sapere se la persona è affidabile**, se non chiedendo a chi la
  conosce.

## Il punto comune

Tutti e due i lati **si perdono per mancanza di visibilità reciproca**, non per
mancanza di domanda o di offerta. È un problema di *coordinamento locale*, e i
problemi di coordinamento locale si risolvono con una mappa.

---

# 3. L'intuizione: la mappa come schermata principale

La scelta che definisce il prodotto è che **la home è una mappa**, non una lista.

Non è una decorazione. Cambia il modo in cui si cerca:

- **La distanza diventa visibile senza doverla chiedere.** In una lista devi
  filtrare per zona; su una mappa la vedi.
- **La città diventa il contesto.** «C'è roba a Sampierdarena» è
  un'informazione che una lista non riesce a dare.
- **Fa emergere la densità.** Se in un quartiere ci sono sei annunci, si vede.
- **Rende concreta un'offerta astratta.** Un annuncio in una lista è testo; lo
  stesso annuncio con un pin su una strada che conosci è un posto reale.

## ⚠️ E la mappa è anche il rischio più grosso

**Una mappa vuota sembra più vuota di una lista vuota.** Una lista con tre
annunci è una lista corta; una mappa di Genova con tre pin è un fallimento
visibile. Il formato che rende forte il prodotto quando funziona lo rende
fragile all'inizio.

Questo non è un dettaglio estetico: condiziona la strategia di lancio (§7) e va
tenuto presente ogni volta che si progetta uno stato vuoto.

---

# 4. A chi si rivolge

## Il worker — lo studente

Non «giovani in cerca di lavoro»: **studenti universitari a Genova, 19-26 anni**,
che vogliono qualche centinaio di euro al mese senza rinunciare a studiare.

Cosa gli importa davvero, in ordine:

1. **Quanto paga** — è il primo filtro mentale
2. **Quanto è vicino** — il secondo
3. **Quando** — se è compatibile con le lezioni
4. **Che lavoro è** — solo dopo i primi tre

Cosa lo blocca: la fatica di candidarsi, il timore di non ricevere risposta,
l'incertezza sul fatto che il posto sia serio.

**Non è il target:** chi cerca un impiego stabile, i professionisti con partita
IVA, chi cerca lavoro da remoto.

## L'employer — due profili diversi sotto lo stesso nome

⚠️ **Sono due utenti distinti, e il prodotto oggi li tratta come uno solo.** Vale
la pena chiedersi se sia giusto.

**L'attività** — bar, ristorante, negozio, palestra. Cerca in modo ricorrente,
ha un indirizzo fisso, gli interessa costruirsi un giro di persone affidabili da
richiamare. Per lui la mappa ha senso: è un posto.

**Il privato** — una famiglia che cerca babysitter o ripetizioni, qualcuno che
deve traslocare. Cerca una volta sola, ha bisogno di fiducia più che di
efficienza, e **non necessariamente vuole il proprio indirizzo su una mappa
pubblica**.

Il secondo caso è il più delicato: la geolocalizzazione che è un vantaggio per un
bar può essere un problema di privacy per una famiglia.

---

# 5. Come funziona, oggi

## Percorso dello studente

Registrazione (email, Google o Apple) → sceglie il ruolo, il quartiere e i tag
dei ruoli che gli interessano → **apre la mappa centrata su dove si trova** →
tocca un pin, legge l'annuncio, si candida → se l'employer accetta, si apre una
**chat** → a lavoro concluso, recensione reciproca.

La **Lista** è la stessa cosa filtrata sui suoi interessi, per chi preferisce
scorrere.

## Percorso di chi offre

Registrazione → indica dove si trova l'attività → pubblica un annuncio (titolo,
descrizione, orario, paga, durata, ruolo) → riceve candidature → guarda i profili
→ accetta, e si apre la chat.

## Cosa c'è già di costruito

Autenticazione a due ruoli · profili con foto, presentazione, esperienze e tag ·
pubblicazione e gestione annunci · candidature con stati · chat in tempo reale ·
recensioni · geofencing su Genova · sistema di design completo.

## Cosa manca (Fasi 5-10)

Illustrazioni · animazioni · **pagamenti Stripe** · gamification · app nativa.

---

# 6. Il brand

**Il nome** lavora su due piani: *poli-* come molteplicità (tanti lavori, tante
persone, tanti posti) e il **polpo** — intelligenza pratica, otto braccia che
fanno cose diverse insieme. A Genova il polpo è anche parte del paesaggio
mentale, e questo aiuta.

**L'identità visiva è hand-drawn ma rigorosa.** Tratti disegnati a mano, palette
di carta avorio e inchiostro bruno, icone custom, niente stock. Il motivo non è
estetico ma di posizionamento: le app di lavoro sono tutte blu, squadrate e
istituzionali, perché parlano a chi cerca una carriera. Politask parla a chi
cerca cinquanta euro per il weekend, e deve sembrare **un posto amichevole, non
un ufficio di collocamento**.

**Due colori, due ruoli**: arancio per lo studente, blu per chi offre. Non è
decorazione: cambiano le schermate, i campi e le azioni, e il colore dice sempre
in che parte dell'app sei.

I dettagli tecnici del sistema stanno in `CLAUDE.md`.

---

# 7. Perché Genova, e perché una città sola

Sembra una limitazione ed è la scelta strategica più importante.

**I marketplace muoiono di partenza a freddo.** Nessuno pubblica se non ci sono
candidati; nessuno si iscrive se non ci sono annunci. L'unico modo per uscirne è
raggiungere **densità sufficiente in un perimetro piccolo**, invece di spargersi.
Duecento annunci a Genova sono un prodotto vivo; duecento annunci in Italia sono
una mappa vuota.

Genova ha caratteristiche che aiutano:

- **Un'università concentrata** e un bacino di studenti fuori sede
- **Una geografia stretta e verticale**, dove la distanza conta davvero: a Genova
  «dall'altra parte» può voler dire quaranta minuti
- **Un tessuto di piccole attività** — bar, botteghe, ristoranti — che assumono
  in modo informale
- **Una dimensione in cui il passaparola funziona**: se l'app prende in una
  facoltà, si sa in giro

**La città è la prima funzionalità, non un limite.** «La mappa dei lavoretti di
Genova» è una promessa che si può mantenere; «l'app dei lavoretti» no.

---

# 8. Cosa esiste già, e perché non è la stessa cosa

| Chi | Cosa fa | Perché non copre questo |
|---|---|---|
| **Indeed, Subito, Jooble** | annunci generalisti | costruiti per contratti veri: curriculum, filtri, nessuna dimensione locale reale |
| **GoStudent, LeTueLezioni, Repetita** | ripetizioni | verticali su una materia sola, e sul lato tutor |
| **Sitly, Le Cicogne** | babysitter | verticali su una categoria, orientate alle famiglie |
| **Tabbid, Gogojobo, Taskhunters** | piccoli lavori | nazionali e generici, quindi sottili ovunque; nessuna mappa |
| **Gruppi WhatsApp e Telegram** | il vero concorrente | gratis, immediati, già pieni di gente |
| **Cartello in vetrina** | il secondo vero concorrente | costo zero, raggio dieci metri |

## ⚠️ Il concorrente da battere non è un'app

È il **gruppo WhatsApp della facoltà**. È gratis, ci sono già tutti, e non chiede
di registrarsi. Politask deve offrire qualcosa che quel gruppo non può dare:

- **si vede dov'è** il lavoro invece di leggerlo
- **resta** invece di scorrere via in mezz'ora
- **la reputazione si accumula** invece di ripartire da zero ogni volta
- **si cerca** invece di sperare di aver letto al momento giusto

Se non riesce a fare almeno due di queste cose in modo evidente, il gruppo
WhatsApp vince.

---

# 9. Le questioni aperte

Divise per tipo. Quelle segnate ⚠️ possono cambiare il prodotto.

## 9.1 Modello di ricavo — **non deciso**

Oggi Politask non guadagna. Le strade possibili, con i loro difetti:

- **Commissione sui pagamenti** (Fase 8, Stripe) — allinea i ricavi al valore
  creato, ma **incoraggia le persone a chiudere l'accordo fuori dalla
  piattaforma** appena si sono conosciute. È il problema classico di ogni
  marketplace di servizi locali.
- **Abbonamento per le attività** — chi assume spesso paga un canone. Più
  semplice, ma bisogna avere già volume perché valga la pena.
- **Annunci in evidenza** — facile, ma con pochi annunci non c'è niente da
  mettere in evidenza.
- **Premium per gli studenti** — in alto a destra nella home c'è uno spazio
  riservato a questo. ⚠️ Attenzione: far pagare il lato *debole* di un
  marketplace è quasi sempre un errore, perché è quello che devi attrarre.

**Domanda aperta:** conviene decidere adesso o dopo aver visto come si usa? La
scelta influenza il design, quindi non si può rimandare all'infinito.

## 9.2 ⚠️ Inquadramento legale — la questione più seria

**Non sono un avvocato e questa non è consulenza legale.** Ma è il punto su cui
serve un parere professionale prima del lancio, non dopo.

In Italia il lavoro occasionale ha regole precise. Per il 2026, con Libretto
Famiglia e Contratto di Prestazione Occasionale:

- **massimo 5.000 €** l'anno per ogni lavoratore, sommando tutti i committenti
- **massimo 10.000 €** l'anno per ogni committente (15.000 in alcuni settori)
- **massimo 2.500 €** fra la stessa coppia lavoratore-committente
- oltre i 5.000 € lordi scattano i contributi INPS in gestione separata

Da gennaio 2026 c'è un **nuovo portale INPS** dedicato a prestatori e
intermediari del Libretto Famiglia.

**Le domande da porre a un consulente del lavoro:**

1. **Politask è un intermediario o una bacheca?** Finché mette in contatto e
   basta, la posizione è più semplice. Con i **pagamenti** (Fase 8) il ruolo
   cambia, e va capito se serve un'autorizzazione all'intermediazione.
2. **Chi è responsabile se un lavoro non viene pagato**, o se qualcuno si fa
   male? La piattaforma dev'essere chiara su cosa garantisce e cosa no.
3. **Come si gestiscono i minorenni?** Molti studenti hanno 16-18 anni e per
   loro le regole sono diverse. ⚠️ Oggi l'app non chiede l'età.
4. **Ha senso mostrare il tetto dei 5.000 €?** Un contatore nel profilo sarebbe
   una funzione utile e distintiva — nessun concorrente lo fa — ma implica
   assumersi un ruolo di consulenza. Da valutare, non da improvvisare.

**Serve anche, e prima del lancio: informativa privacy e termini di servizio.**
Non è burocrazia rimandabile — l'app raccoglie nome, email, foto e **posizione
geografica**, quindi il GDPR si applica in pieno. Gli stessi documenti servono
anche a Google per pubblicare l'accesso social.

## 9.3 Fiducia e sicurezza — sottovalutata

Un marketplace locale mette in contatto **sconosciuti che poi si incontrano di
persona**, spesso a casa di qualcuno. È diverso dal vendere un divano.

Aperte:

- **Verifica dell'identità.** Oggi chiunque può registrarsi con un'email. Serve
  almeno per un lato?
- **Le recensioni funzionano solo con volume.** Con pochi scambi, un profilo con
  una recensione non dice niente. Nel frattempo, cosa costruisce fiducia? Foto
  reali, profili completi, il fatto che l'attività abbia un indirizzo verificabile.
- **Segnalazione e moderazione.** Non c'è modo di segnalare un annuncio o un
  utente. Serve prima di aprire al pubblico, non dopo il primo problema.
- **Sicurezza degli incontri.** Vale la pena scrivere qualche riga di consiglio
  pratico? Le app che lo fanno bene lo integrano nel flusso, non in una pagina
  d'aiuto.

## 9.4 Prodotto — decisioni ancora aperte

- ⚠️ **Attività e privati sono due utenti diversi** trattati come uno solo (§4).
  Un privato che cerca una babysitter potrebbe non volere il proprio indirizzo su
  una mappa. Forse serve un livello di precisione della posizione diverso.
- **Il campo della paga è libero.** «9€/h», «150/settimana», «da concordare» non
  sono confrontabili né filtrabili, e hanno già impedito una soluzione di design
  (i marker col prezzo). Un campo strutturato — importo + unità — sbloccherebbe
  filtri, ordinamenti e marker informativi. Il costo è un po' di attrito in più
  quando si pubblica.
- **Gli annunci non hanno una scadenza.** Un annuncio di sei mesi fa resta sulla
  mappa. Con pochi annunci fa comodo, con tanti diventa spazzatura.
- **Non esistono notifiche.** Uno studente non sa che è uscito un lavoro a due
  isolati da casa. È probabilmente **la funzione mancante che pesa di più**: senza
  un motivo per tornare, un marketplace giovane muore per abbandono.
- **Le candidature non scadono e non si possono ritirare.**

## 9.5 Andare sul mercato

- **Come si riempie la mappa il primo giorno?** L'unica strada realistica è
  raccogliere annunci a mano, uno per uno, andando a parlare con i bar. Non è
  scalabile ed è esattamente quello che va fatto all'inizio.
- **Da quale lato si parte?** Di solito conviene partire da quello **più difficile
  da attrarre**, che qui è chi offre lavoro. Gli studenti arrivano se ci sono
  annunci; gli annunci non arrivano se non c'è nessuno.
- **Quale facoltà per prima?** Concentrarsi su una zona sola — Balbi, o
  l'Albergo dei Poveri — dà densità visibile invece di puntini sparsi.
- **Come si misura se funziona?** Non il numero di iscritti. I numeri veri sono:
  quante candidature ricevono risposta, quanti scambi arrivano a una recensione,
  quanti studenti tornano dopo il primo lavoro.

## 9.6 Tecniche e legali di contorno

- **Licenza del font Shinjo** da chiarire prima del deposito del marchio
  (`brand/POLITASK-mail-licenza-shinjo.md`).
- **Il progetto Supabase è intestato a Lovable**, non a Tommaso: da migrare
  finché i dati sono pochi.
- **Deposito del marchio EUTM** — con le lettere del wordmark ridisegnate.
- **`politask.app`** da mettere online, almeno con una waitlist.

---

# 10. Cosa rende Politask difendibile, se funziona

Non la tecnologia: una mappa con dei pin la rifà chiunque in un mese.

1. **La densità locale.** Se a Genova ci sono tutti, un concorrente nazionale
   generico non è comunque un'alternativa.
2. **La reputazione accumulata.** Uno studente con venti recensioni non ricomincia
   altrove.
3. **Il rapporto diretto con le attività.** Costruito a piedi, non replicabile a
   distanza.
4. **Il marchio.** Se «Politask» diventa il modo in cui a Genova si dice
   «lavoretto», la partita è chiusa. È il motivo per cui vale la pena curare
   l'identità in Fase 4 invece di rimandarla.

---

# 11. Le tre cose da tenere a mente

1. **Il rischio non è tecnico.** L'app funziona già. Il rischio è che la mappa
   resti vuota, ed è un problema di persone, non di codice.
2. **La città sola è la strategia, non un ripiego.**
3. **Il vero concorrente è gratis e ci sono già tutti.** Ogni funzione va giudicata
   chiedendosi se dà qualcosa che un gruppo WhatsApp non può dare.

---

*Fonti sui limiti del lavoro occasionale: [Prestazioni occasionali 2026](https://centrofiscale.com/prestazioni-occasionali-2026/) · [Nuovo portale INPS PrestO](https://www.dottrinalavoro.it/notizie-c/inps-inps-presto-nuovo-portale-dedicato-ai-prestatori-e-intermediari-di-libretto-famiglia). Sul panorama esistente: [piattaforme di ripetizioni](https://www.gostudent.org/it-it/blog/lavori-estivi-per-studenti) · [piattaforme di lavoretti](https://www.fastweb.it/fastweb-plus/digital-magazine/le-migliori-piattaforme-per-lavoretti-online/).*
