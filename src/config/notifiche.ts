/**
 * La chiave PUBBLICA del Web Push (VAPID). È pubblica davvero: serve al
 * browser per iscriversi, e la si legge da qualunque iscrizione. La privata
 * sta solo nei segreti della funzione `invia-notifiche` (e, in locale, in
 * `supabase/segreti/notifiche.txt`, fuori dal repo).
 *
 * ⚠️ Se si cambia la coppia di chiavi, tutte le iscrizioni dei telefoni
 * smettono di funzionare: vanno rifatte (l'app lo fa da sola alla prossima
 * apertura, se il permesso c'è).
 */
export const CHIAVE_PUBBLICA_PUSH = "BDqF3mUJIhp3H17Mt6pt9210z5CqN7mkqhZ8iTloqy6Rx2u66-RnnOqnPzQPakiJz0aW8YtPaxUkMoQH-wGObsU";
