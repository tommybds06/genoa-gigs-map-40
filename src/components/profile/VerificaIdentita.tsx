import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ProfiloIcon } from "@/components/icons/uiIcons";

/**
 * LA VERIFICA DELL'IDENTITÀ DI UN PRIVATO — per ora solo l'interfaccia
 * (Tommaso, 24 ottobre): il servizio esterno lo si sceglie più avanti con
 * l'avvocato. Lo stato (`profiles.identita_verificata`) esiste già e lo può
 * accendere solo il server; finché è spento, gli annunci del privato
 * mostrano «Privato non verificato».
 *
 * Facoltativa: in configurazione e, dopo, da Modifica profilo.
 */
export function VerificaIdentita({ verificata }: { verificata: boolean }) {
  const [aperta, setAperta] = useState(false);

  if (verificata) {
    return (
      <p className="text-sm font-medium text-success">Identità verificata</p>
    );
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" onClick={() => setAperta(true)}>
        <ProfiloIcon className="h-4 w-4" />
        Verifica la tua identità
      </Button>
      <p className="text-xs text-muted-foreground">
        Facoltativa. Finché non la fai, i tuoi annunci mostrano «Privato non verificato».
      </p>

      <Drawer open={aperta} onOpenChange={setAperta}>
        <DrawerContent>
          <div className="space-y-4 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <DrawerHeader className="gap-1 p-0 text-left">
              <DrawerTitle className="titolo-sezione text-2xl font-normal">Arriva presto</DrawerTitle>
              <DrawerDescription className="text-base text-muted-foreground">
                Potrai verificare la tua identità con un documento, in pochi minuti. Chi cerca lavoro si
                fida di più di un privato verificato.
              </DrawerDescription>
            </DrawerHeader>
            <Button size="lg" className="w-full bg-employer-700 text-employer-foreground hover:bg-employer-800" onClick={() => setAperta(false)}>
              Ho capito
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
