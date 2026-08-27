# Politask — Accesso con Google: guida passo passo

> Il codice nell'app è già scritto. Manca solo la configurazione.
> Tempo: **30 minuti**. Costo: **zero**.

Sono due cose separate, in due siti diversi:

1. **Google Cloud Console** → crei le credenziali (Client ID + Client secret)
2. **Lovable** → le incolli

Non serve Supabase. Non serve toccare niente del progetto. Non serve pagare.

---

## PASSO 0 — Il valore che ti serve

L'indirizzo di ritorno da registrare su Google è:

```
https://cggwpktrbsphwvkrnrvj.supabase.co/auth/v1/callback
```

⚠️ **Attenzione, ce ne sono DUE e sembrano entrambi giusti.** Nel pannello di
Lovable, sotto **Redirect URL(s)**, compare `https://oauth.lovable.app/callback`.
Quello vale quando usi le credenziali **condivise di Lovable**. Siccome qui
usiamo **«Your own credentials»**, il giro va dritto al Supabase del progetto e
Google si aspetta l'indirizzo `supabase.co`.

Registrali pure **tutti e due**: quello di troppo non dà fastidio, quello
mancante blocca l'accesso.

### Come sapere sempre qual è quello giusto

Non fidarti di quello che sembra ovvio — verificalo. Quando l'accesso fallisce
con `redirect_uri_mismatch`, l'indirizzo vero è **nella barra degli indirizzi**
della pagina di errore di Google, dentro il parametro `authError`, che è
codificato in base64. Si legge così:

```sh
python3 -c "import base64,sys;print(base64.b64decode(sys.argv[1]+'=='). \
decode('utf-8','replace'))" 'INCOLLA_QUI_IL_VALORE_DI_authError'
```

Dieci secondi, e ti dice esattamente cosa Google ha ricevuto.

---

## PASSO 1 — Crea il progetto su Google Cloud

Vai su <https://console.cloud.google.com>.

**Dove sono i progetti:** in alto, accanto alla scritta «Google Cloud», c'è il
bottone **«Seleziona un progetto»**. È lì dentro, non nella pagina principale.
Se non hai mai creato niente, la lista è vuota — normale.

1. Clicca **«Seleziona un progetto»**
2. In alto a destra della finestra che si apre → **«NUOVO PROGETTO»**
3. **Nome progetto:** `Politask`
4. **CREA**
5. Aspetta qualche secondo, poi **riclicca «Seleziona un progetto» e scegli
   Politask**

⚠️ Questo passo si sbaglia spesso: dopo aver creato il progetto, Google **non**
ci entra da solo. Se in alto non c'è scritto «Politask», tutto quello che fai
dopo finisce nel posto sbagliato.

---

## PASSO 2 — Branding: cosa compilare (quasi niente)

Google ha rifatto questa parte: adesso si chiama **Google Auth Platform** e ha
il menu a sinistra con Panoramica, Branding, Pubblico, Client.

Nella pagina **Branding** serve **solo**:

- **Nome app:** `Politask`
- **Email di assistenza utenti:** la tua
- **Dati di contatto sviluppatore:** la tua email

**Lascia vuoti** questi tre, sono facoltativi:

- Home page applicazione
- Link alle norme sulla privacy
- Link ai termini di servizio

E lascia vuoto anche **Domini autorizzati**: serve solo se compili i campi qui
sopra, e in quel caso il dominio deve essere tuo e verificato.

⚠️ **Non riempirli «tanto per»**: se metti `politask.app` come home page, Google
pretende quel dominio anche fra i domini autorizzati, e se il sito non è ancora
online ti blocchi per niente.

**Quando andranno compilati:** prima di aprire l'app a utenti veri. Servono
perché la schermata di consenso mostri **nome e logo di Politask** invece di un
indirizzo anonimo — è una questione di fiducia, non di funzionamento. E le
pagine devono esistere davvero: privacy e termini vanno scritti, non inventati.
Segnatelo per quando c'è la landing.

---

## PASSO 3 — Crea il client

⚠️ **Va fatto PRIMA di pubblicare.** Finché la configurazione OAuth non è
completa, il bottone «Pubblica app» resta grigio e Google dice solo
«informazioni mancanti», senza spiegare quali.

Nel menu a sinistra → **Client** → **+ CREA CLIENT**

1. **Tipo di applicazione: Applicazione web**
2. **Nome:** `Politask Web`
3. Scorri fino a **URI di reindirizzamento autorizzati** → **+ AGGIUNGI URI**
4. Incolla **esattamente** questi due, uno per riga, senza spazi e senza
   barra finale:

   ```
   https://cggwpktrbsphwvkrnrvj.supabase.co/auth/v1/callback
   https://oauth.lovable.app/callback
   ```

5. **CREA**
6. Si apre una finestra con **ID client** e **Client secret**. Copiali entrambi.

⚠️ Nella stessa pagina c'è anche **«Origini JavaScript autorizzate»**: lasciala
vuota. Non serve, e riempirla a caso è una delle cause di errore.

Poi controlla **Accesso ai dati**: se la lista degli ambiti è vuota, aggiungi
`openid`, `userinfo.email` e `userinfo.profile`. Sono i tre non sensibili — non
fanno scattare nessuna verifica.

---

## PASSO 4 — ⚠️ Pubblica l'app

Nel menu a sinistra vai su **Pubblico**.

Cerca **Stato di pubblicazione**. Se dice **Test**, l'accesso con Google
funziona **solo per 100 account**. Al centounesimo smette, senza un errore
comprensibile.

Premi **PUBBLICA APP** → conferma.

### Se «Pubblica app» è grigio

Google scrive «La configurazione OAuth dell'app non è completa» per **tre**
motivi diversi, e non dice mai quale:

1. **Manca il client** → fai il passo 3
2. **Hai caricato un logo** → il logo obbliga alla verifica. Va tolto
   (Branding → Rimuovi) e rimesso più avanti, insieme alla verifica del marchio
3. **Mancano nome app o email di assistenza** → Branding, in cima alla pagina

La pagina **Panoramica** è l'unico posto dove Google elenca davvero cosa manca:
se sei bloccato, guarda lì prima di provare a caso.

---

## PASSO 5 — Incolla in Lovable

Torna su **Lovable → More → Cloud → Users → Auth settings → Google**
(la schermata che avevi già aperto):

1. Lascia selezionato **«Your own credentials»**
2. **Client ID** → incolla l'ID client
3. **Client secret** → incolla il secret
4. In **Redirect URL(s)**, **spunta la casella** accanto a
   `https://oauth.lovable.app/callback`
5. **Save**

---

## PASSO 6 — Prova

Apri l'app e vai su `/auth` → **Continua con Google**.

- **Account mai visto** → deve portarti a «Ancora due cose» (ruolo, nome,
  quartiere) e poi alla creazione profilo
- **Account già registrato e completo** → entra diretto

---

## Se non funziona

| Cosa vedi | Cosa controllare |
|---|---|
| «provider is not enabled» | non hai premuto **Save** in Lovable, o la casella del redirect non è spuntata |
| «redirect_uri_mismatch» | manca `https://cggwpktrbsphwvkrnrvj.supabase.co/auth/v1/callback` fra gli URI su Google. Non incollare il nome dell'errore: l'indirizzo vero si legge decodificando `authError` dalla barra degli indirizzi (vedi Passo 0) |
| Funziona a te ma non ad altri | l'app Google è rimasta in **Test** (passo 3) |
| Non trovi «Credenziali» | in alto non è selezionato il progetto Politask (passo 1) |

---

# ————————————————————————

# Argomento diverso: «come faccio a rendere il progetto mio?»

**Non c'entra niente con Google.** L'accesso con Google funziona benissimo
così com'è. Questo è un altro discorso, e puoi anche non farlo mai.

## Com'è adesso

Il database di Politask (`cggwpktrbsphwvkrnrvj`) è stato creato da **Lovable
Cloud**. È un vero Supabase, ma **intestato a Lovable**, non a te. Ecco perché
non lo trovi nel tuo pannello Supabase in nessuna delle due organizzazioni, e
perché ogni volta hai dovuto applicare le migration passando da Lovable.

## Cosa cambia se diventa tuo

**Quello che guadagni**

- entri nel pannello Supabase e vedi tabelle, utenti, log
- puoi fare backup e scaricarti i dati
- puoi applicare le migration da solo, senza chiedere a Lovable
- se un giorno lasci Lovable, il backend resta tuo

**Quello che perdi**

- Lovable non gestisce più tutto da solo: certe cose diventano manuali
- devi tenere d'occhio i limiti del piano gratuito (50.000 utenti attivi al
  mese, 500 MB di database — molto oltre quello che serve ora)

## Quando conviene farlo

**Adesso, se lo fai.** Dentro ci sono pochi dati veri: qualche profilo di prova
e due annunci. Fra sei mesi, con utenti veri, spostare tutto è un lavoro serio.

Ma non è urgente e non blocca niente: puoi restare così, fare Google, andare
avanti con la Fase 4, e riprendere il discorso prima di aprire l'app alle
persone.

## Come si fa, se decidi di sì

1. Crea un progetto tuo dal tuo pannello Supabase (`New project`)
2. In Lovable, nelle impostazioni del progetto, scollega Lovable Cloud e
   **collega il tuo progetto Supabase**
3. Riapplica le migration che stanno in `supabase/migrations/`
4. Rimetti le variabili in `.env` con i valori del progetto nuovo

⚠️ **Non farlo di fretta e non nello stesso giorno in cui devi consegnare
qualcosa.** È il tipo di operazione che va fatta con calma, verificando che
l'app funzioni prima di considerarla finita.

Se decidi di procedere te lo seguo passo per passo, come questa guida.
