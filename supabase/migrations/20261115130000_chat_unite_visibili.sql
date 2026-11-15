-- ============================================================================
-- LE CHAT UNITE TORNANO VISIBILI — 15 novembre 2026
--
-- Il difetto (Tommaso, dall'account worker «mario rossi»: «mi sono
-- scomparse tutte le chat col Masetto»). L'unione delle chat doppie
-- (20261115120000_una_chat_per_coppia) teneva come principale la chat più
-- vecchia della coppia COL SUO STATO «nascosta» (= «Elimina» nel menu). Chi
-- durante le prove aveva eliminato proprio quella si è ritrovato nascosta
-- la chat unita, cioè TUTTE le conversazioni con quella persona: una chat
-- nascosta torna solo con un messaggio più recente di quando la si è
-- nascosta, e i messaggi uniti erano tutti più vecchi.
--
-- Una chat unita non è più quella che era stata nascosta: è la somma di
-- tutte. Le righe «nascosta» delle chat agganciate l'unione le aveva già
-- tolte; qui si toglie anche quella delle principali, ma SOLO se messa
-- prima dell'unione (eseguita da Lovable il 15 novembre alle 00:52 UTC):
-- quello che si nasconde da adesso in poi resta nascosto.
-- «Fissata in alto» non si tocca.
--
-- Rieseguibile: tocca solo righe con una data di prima dell'unione.
-- ============================================================================

UPDATE public.chat_utente cu
   SET nascosta_il = NULL
 WHERE cu.nascosta_il IS NOT NULL
   AND cu.nascosta_il < '2026-11-15 00:53:00+00'
   AND EXISTS (SELECT 1 FROM public.chats a WHERE a.unita_in = cu.chat_id);
