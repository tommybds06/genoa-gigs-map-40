import type { ComponentType, SVGProps } from "react";
import {
  MessaggiIcon,
  ProfiloIcon,
  StellaIcon,
  CuoreIcon,
  MappaIcon,
  CalendarioIcon,
  OrologioIcon,
  VerificatoIcon,
  NotificheIcon,
} from "@/components/icons/uiIcons";
import { GenericoIcon } from "@/components/icons/roleIcons";
import type { TipoNotifica } from "./notifiche";

/** L'icona di ogni tipo, nel centro notifiche. Solo icone nostre. */
const ICONE: Record<TipoNotifica, ComponentType<SVGProps<SVGSVGElement>>> = {
  scelto: GenericoIcon,
  candidatura: ProfiloIcon,
  messaggio: MessaggiIcon,
  recensione_da_fare: StellaIcon,
  lavoro_confermato: CuoreIcon,
  lavoro_vicino: MappaIcon,
  promemoria: CalendarioIcon,
  in_scadenza: OrologioIcon,
  scaduto: OrologioIcon,
  lavoro_finito: CalendarioIcon,
  recensione_ricevuta: StellaIcon,
  verifica_piva: VerificatoIcon,
};

export const iconaNotifica = (tipo: string) => ICONE[tipo as TipoNotifica] ?? NotificheIcon;
