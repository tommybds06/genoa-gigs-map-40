# Politask — Audit UI/UX (agosto 2026)

> Analisi delle 11 schermate principali. Diviso per **gravità**, non per schermata,
> così sai da cosa partire. Alla fine c'è l'ordine di lavoro proposto.
>
> Legenda: 🔴 funzionale (l'utente perde qualcosa) · 🟠 coerenza (l'app sembra fatta
> da tre persone diverse) · 🟡 rifinitura.

---

## 🔴 Problemi funzionali — questi li sistemerei prima di qualunque cosa estetica

### 1. La lista Messaggi non dice niente
`Messaggi.tsx`
Ogni riga mostra: avatar, nome, badge di stato, titolo annuncio. **Manca l'anteprima
dell'ultimo messaggio e manca l'orario.** Sono le due informazioni per cui si apre una
lista di conversazioni. Così com'è, per sapere se qualcuno ti ha risposto devi entrare
in ogni chat.

Aggiungere: ultimo messaggio troncato su una riga + timestamp relativo a destra
(«14:32» oggi, «ieri», «lun», poi la data).

### 2. Il badge "0"
`Messaggi.tsx`
Tutte e tre le righe mostrano uno **0** grande sulla destra. Un contatore a zero non
va mostrato: o è il numero di non letti e allora sotto 1 sparisce, o non è chiaro cosa
sia. Adesso sembra un errore di rendering, ed è la prima cosa che l'occhio prende.

### 3. Le conversazioni concluse sono quasi invisibili
`Messaggi.tsx`
Le due righe "Concluso" sono sbiadite fino quasi al colore di sfondo. L'intenzione
(de-enfatizzare) è giusta, l'esecuzione no: sembrano disabilitate o in caricamento.
Uno storico va **compresso**, non dissolto — riga più bassa, avatar più piccolo,
colore pieno. Oppure in una sezione separata «Concluse» collassabile.

### 4. Date relative oltre ogni utilità
`ApplicationCard.tsx`, `WorkerJobHistory.tsx`
«Inviata **187 giorni fa**». Nessuno converte 187 giorni in una data. Sopra i ~30
giorni passare all'assoluto: «Inviata il 12 feb».

### 5. La mappa non mostra lavori
`InteractiveMap.tsx`
Nello screenshot non c'è **nemmeno un marker**. Lo schermo principale dell'app, quello
che deve dimostrare il valore in due secondi, mostra Limone Piemonte e quattro POI di
Mapbox. Anche se dipende dai dati di test, va gestito il caso: se non ci sono annunci
nel riquadro visibile, serve un messaggio che lo dica e proponga di allargare la zona.

### 6. "Esci" è in due posti
`Profilo.tsx` e `Settings.tsx`
Azione distruttiva duplicata. Tenerla solo in Impostazioni.

### 7. Affordance incoerenti nella lista candidature
`ApplicationCard.tsx`
Nella stessa lista: alcune righe hanno il chevron `›`, «Cuoco» ha un bottone chat,
«Concluso» non ha niente. Tre comportamenti diversi senza una regola leggibile.
Decidere: la riga è sempre cliccabile (chevron sempre) e le azioni extra sono
icone aggiuntive, oppure niente chevron e solo azioni esplicite.

---

## 🟠 Coerenza — l'app sembra scritta da tre mani

### 8. Tre stili di campo di input
- **Auth**: campo grigio pieno, bordo assente
- **CreateJob**: campo crema, bordo sottile
- **TagSelector**: pillola bianca, bordo tondo
- **CreateJob → "Seleziona quartiere"**: crema con icona arancio — un quarto stile

Va scelto **uno** stile di input e applicato ovunque. È il componente che l'utente
tocca di più: l'incoerenza qui si sente più che altrove.

### 9. Cinque linguaggi di badge di stato
Nelle sole candidature e messaggi:

| Stato | Come appare oggi |
|---|---|
| In Attesa | pillola gialla con bordo |
| Assunto (candidature) | pillola verde piena chiara |
| Assunto (messaggi) | pillola verde satura con icona ✓ |
| Concluso (candidature) | pillola grigia piena |
| Concluso (messaggi) | pillola verde con bordo e ✓ |

«Concluso» è **verde** nei messaggi e **grigio** nelle candidature. E «Assunto» ha due
rese diverse a due schermate di distanza. Serve un componente `StatusBadge` unico con
quattro stati e una regola: in attesa = ambra, assunto = verde, concluso = neutro,
rifiutato = rosso tenue.

### 10. La gerarchia dei titoli è rovesciata
`Lista.tsx`, `Annunci.tsx`
«Impieghi per Te» e «I Tuoi Annunci Pubblicati» sono i **titoli di sezione** della
pagina, ma sono resi più piccoli del titolo dell'empty state sotto («Imposta i tuoi
interessi», «Nessun annuncio»). L'occhio legge prima la cosa meno importante.

### 11. Il header blu di CreateJob è l'unica schermata così
`CreateJob.tsx`
Tutte le pagine hanno intestazione crema con il logo. CreateJob ha un blocco blu pieno
con titolo bianco che si interrompe di netto sul crema. È l'unica, e si vede.

### 12. Logo di dimensione diversa in Impostazioni
`Settings.tsx` — ancora `h-8` contro `h-14` di tutte le altre. Già noto, ancora aperto.

### 13. Il gradiente nei bottoni di Auth
`Auth.tsx`
I bottoni «Accedi» e «Prosegui» hanno un **gradiente arancione**. È l'unico gradiente
dell'app e non è nel brand. Da appiattire.

### 14. Icone trattate diversamente in Impostazioni
`Settings.tsx`
Le icone di riga (persona, campanella, info, documento) sono **grigie/scure**, mentre
in tutto il resto dell'app le icone sono arancioni o del colore del ruolo. Sembra una
schermata di sistema, non di Politask.

### 15. Un tag "Settimane" blu tra i tag ruolo arancioni
`Profilo.tsx` → «I tuoi Interessi»
Chip: Cassa, Grafico, Rider, Social (arancioni) e **Settimane** (blu). È un tag di
*durata* rimasto tra le preferenze, che invece la nota di Fase 3 diceva rimosse.
Residuo da pulire.

### 16. L'emoji 🌊 nel claim
`Auth.tsx` — «La gig economy studentesca di Genova 🌊». Hai un sistema di icone
custom: un'emoji di sistema stona, e per giunta cambia disegno tra iOS e Android.

---

## 🟡 Rifiniture

### 17. La mappa ha un margine crema attorno
`Index.tsx` / `InteractiveMap.tsx`
La mappa è incassata con bordi arrotondati e margine crema su tutti i lati. Su mobile
lo spazio verticale è la risorsa più scarsa: quel margine costa ~30px senza dare niente.
La mappa dovrebbe arrivare a filo, sotto la search bar.

### 18. Lo stato attivo della bottom nav è troppo debole
`BottomNav.tsx`
Le icone sono **tutte arancioni**; l'attiva si distingue solo per pieno/vuoto. Sui
formati piccoli la differenza è appena percettibile. Instagram usa lo stesso schema ma
con nero pieno contro grigio vuoto: il salto di *colore* fa il lavoro, non il riempimento.
Suggerimento: inattive in bruno tenue, attiva nel colore del ruolo. Il contrasto diventa
immediato senza aggiungere etichette.

### 19. I controlli zoom sono quelli di serie di Mapbox
Quadratini bianchi con `+` / `−`. Su mobile lo zoom si fa con le dita: si possono
nascondere del tutto, guadagnando pulizia.

### 20. Le frecce del carosello foto nel Profilo
`Profilo.tsx`
Due cerchi arancioni pieni sovrapposti alla foto. Su mobile si scorre con lo swipe: le
frecce coprono la foto e non servono. Bastano i pallini.

### 21. Densità delle card
Le card candidatura sono alte: ne stanno ~5 sullo schermo per 4 informazioni ciascuna.
Riducendo il padding verticale e rimpicciolendo l'icona ruolo se ne guadagnano 2.

### 22. Le card di sezione del Profilo sono tutte identiche
Presentazione, Esperienze, Interessi, Storico, Informazioni: stesso peso, stesso
riquadro, stessa icona colorata. Lo scroll è monotono e niente emerge. «21 anni,
esperienza nel delivery» occupa una card intera.

### 23. «ZONA PERICOLO»
`Settings.tsx`
Traduzione letterale di *Danger Zone*, che è una convenzione da pannello di
amministrazione, non da app consumer. In italiano suona minaccioso per un logout.
Meglio nessuna intestazione, o «Account» con Elimina in rosso.

### 24. L'email nel profilo
`Profilo.tsx` / `PublicProfile.tsx`
Verificare che l'email non compaia nel profilo **pubblico**. Se è visibile ad altri
utenti è un problema di privacy, non di grafica.

### 25. La card ruolo non selezionata sembra disabilitata
`Auth.tsx` — registrazione
«Offro Impiego» in grigio con opacità ridotta legge come *non disponibile* invece che
*non ancora scelto*. Un utente può pensare di non poterlo selezionare.

---

## Il problema di contrasto — perché lo vedi adesso

Non è un difetto nuovo: è il **lavoro a metà**. Nel Batch 1 ho portato lo sfondo a
crema `#FBF2E2`, ma card, nav, search e tab sono rimaste **bianco puro**. Il rapporto
tra le due è **1,1:1** — sotto la soglia in cui l'occhio legge due superfici distinte.
Il risultato è il grigiore che vedi negli screenshot.

Hai già scelto la soluzione giusta (crema ovunque, gerarchia via bordo). Applicata,
significa:

- superfici in **crema** `#FBF2E2` o **bianco caldo** `#FFFDF8`, mai bianco puro
- separazione affidata a un **bordo caldo** `#E5DDD1` (o più marcato dove serve)
- via tutti i **grigi freddi** rimasti: cerchi degli empty state, campi di Auth,
  etichette di sezione in Impostazioni
- l'arancio **non porta testo bianco**: `#F6A24D` con bianco sopra è **2,07:1** contro
  i 4,5 richiesti. O testo scuro sull'arancio (come fa già «Accedi»), o l'arancio
  scuro `#AA510E` dove serve testo chiaro.

---

## Ordine di lavoro proposto

1. **Blocco funzionale** (punti 1-7) — anteprima messaggi, badge 0, date, storico,
   affordance, doppio Esci. Sono bug, non gusto: si fanno e basta.
2. **Superfici e contrasto** — elimina il grigiore e sblocca tutto il resto.
3. **Componenti unici** — un input, un `StatusBadge`, un bottone. Risolve i punti
   8, 9, 13, 14 in un colpo.
4. **Gerarchia tipografica** — titoli di sezione sopra gli empty state, e qui entra
   il display font.
5. **Mappa** — stile custom, margine a filo, zoom nascosti, empty state dei marker.
6. **Rifiniture** — nav, carosello, densità, microcopy.
