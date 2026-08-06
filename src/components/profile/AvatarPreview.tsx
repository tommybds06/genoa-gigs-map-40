import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessaggiIcon, ProfiloIcon, XIcon } from "@/components/icons/uiIcons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/hooks/useAppTheme";

interface AvatarPreviewProps {
  imageUrl: string | null | undefined;
  userName: string | null | undefined;
  userId: string;
  role?: "worker" | "employer";
  size?: "sm" | "md" | "lg";
  className?: string;
  onMessageClick?: () => void;
  chatId?: string;
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export function AvatarPreview({
  imageUrl,
  userName,
  userId,
  role = "worker",
  size = "md",
  className,
  onMessageClick,
  chatId,
}: AvatarPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isEmployer } = useAppTheme();

  const displayName = userName || "Utente";
  const initials = displayName[0].toUpperCase();
  const primaryColor = role === "employer" || isEmployer ? "text-employer" : "text-primary";
  const accentBg = role === "employer" || isEmployer ? "bg-employer-50" : "bg-accent";

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setIsOpen(true);
  };

  const handleMessageClick = () => {
    setIsOpen(false);
    if (onMessageClick) {
      onMessageClick();
    } else if (chatId) {
      navigate(`/messaggi?chat=${chatId}`);
    }
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate(`/profile/${userId}`);
  };

  return (
    <>
      <Avatar
        className={cn(
          sizeClasses[size],
          "cursor-pointer transition-transform active:scale-95 ring-offset-2 active:ring-2 active:ring-primary/30",
          className
        )}
        onClick={handleAvatarClick}
      >
        <AvatarImage src={imageUrl || undefined} className="object-cover" />
        <AvatarFallback className={cn(accentBg, primaryColor)}>
          {initials}
        </AvatarFallback>
      </Avatar>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-foreground/70" />
          {/* z-[90]: DialogOverlay è z-[80]. Con z-50 l'overlay copriva
              l'anteprima, che risultava tutta scurita.

              stopPropagation sull'intero contenitore: l'anteprima è renderizzata
              in un portal, ma React fa risalire gli eventi lungo l'albero dei
              COMPONENTI, non del DOM. Senza questo, un click qui dentro arrivava
              fino all'onClick della riga chat che monta AvatarPreview, e chiudere
              l'anteprima apriva la conversazione. */}
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            {/* Custom content without the default DialogContent styling */}
            <div
              className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden rounded-2xl shadow-material-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Name bar: stessa superficie della barra azioni, così
                  incorniciano la foto. Prima era bianco su nero, fuori palette. */}
              <div className="bg-card pl-12 pr-2 py-3 border-b border-border flex items-center gap-2">
                <h3 className="flex-1 text-foreground font-semibold text-lg truncate text-center">
                  {displayName}
                </h3>
                <button
                  type="button"
                  aria-label="Chiudi anteprima"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted active:scale-95 transition-all"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Image container */}
              <div className="aspect-square bg-muted relative overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={cn("w-full h-full flex items-center justify-center", accentBg)}>
                    <span className={cn("text-8xl font-bold", primaryColor)}>
                      {initials}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer - Action bar */}
              <div className="bg-card px-6 py-4 border-t border-border flex items-center justify-center gap-12">
                {/* Message button */}
                <button
                  onClick={handleMessageClick}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    "bg-muted group-hover:bg-muted/80 group-active:scale-95"
                  )}>
                    <MessaggiIcon className={cn("w-6 h-6", primaryColor)} />
                  </div>
                  <span className="text-xs text-muted-foreground">Messaggio</span>
                </button>

                {/* Profile button */}
                <button
                  onClick={handleProfileClick}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    "bg-muted group-hover:bg-muted/80 group-active:scale-95"
                  )}>
                    <ProfiloIcon className={cn("w-6 h-6", primaryColor)} />
                  </div>
                  <span className="text-xs text-muted-foreground">Profilo</span>
                </button>
              </div>
            </div>
            {/* Il click fuori lo gestisce il contenitore qui sopra: il vecchio
                catcher a -z-10 chiudeva l'anteprima ma lasciava passare l'evento. */}
          </div>
        </DialogPortal>
      </Dialog>
    </>
  );
}
