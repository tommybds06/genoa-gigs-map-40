import { useState } from "react";
import { Input } from "@/components/ui/input";
import { LucchettoIcon, OcchioChiusoIcon, OcchioIcon } from "@/components/icons/uiIcons";
import { cn } from "@/lib/utils";

/**
 * IL CAMPO PASSWORD, con l'OCCHIO per vederla (Tommaso, 26 ottobre; icone
 * sue). Al posto di «ripeti password»: lo stesso scopo — accorgersi di un
 * errore di battitura — con un campo in meno, come suggeriscono NIST e
 * Nielsen Norman Group.
 *
 * - L'occhio è un bottone vero da 44 px, `z-10` perché il guscio del campo
 *   coprirebbe le icone (§6).
 * - L'icona mostra l'AZIONE: occhio aperto = «mostra», chiuso = «nascondi».
 * - `autoComplete` lo passa chi lo usa: «current-password» per entrare,
 *   «new-password» per crearla, così il gestore di password fa la cosa giusta.
 */
export function CampoPassword({
  value,
  onChange,
  autoComplete,
  className,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  className?: string;
  id?: string;
}) {
  const [visibile, setVisibile] = useState(false);
  const Icona = visibile ? OcchioChiusoIcon : OcchioIcon;
  return (
    <div className="relative">
      <LucchettoIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type={visibile ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn("pl-12 pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setVisibile((v) => !v)}
        aria-label={visibile ? "Nascondi la password" : "Mostra la password"}
        aria-pressed={visibile}
        className="absolute right-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icona className="h-5 w-5" />
      </button>
    </div>
  );
}
