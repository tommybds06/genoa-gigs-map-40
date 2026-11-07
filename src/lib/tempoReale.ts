/**
 * I NOMI DEI CANALI DEL TEMPO REALE (7 novembre 2026).
 *
 * ⚠️ realtime-js 2.91 (`RealtimeClient.channel`) RESTITUISCE IL CANALE
 * ESISTENTE se ce n'è già uno con lo stesso nome — anche se sta ancora
 * chiudendosi. `removeChannel` è asincrono (aspetta la conferma del server):
 * un effetto che si chiude e riparte subito con lo stesso nome (cambio
 * utente, rinnovo della sessione, una chat chiusa e riaperta) riceveva il
 * canale VECCHIO, già in uscita, e i nuovi ascoltatori non sentivano più
 * niente. Senza errori: il tempo reale smetteva e basta.
 *
 * Un numero in fondo al nome lo rende nuovo ogni volta.
 */
let contatore = 0;
export const nomeCanale = (nome: string) => `${nome}-${++contatore}`;
