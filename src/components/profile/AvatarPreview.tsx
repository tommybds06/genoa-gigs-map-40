import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Info } from "lucide-react";
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
          <DialogOverlay className="bg-black/90" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Custom content without the default DialogContent styling */}
            <div
              className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Name bar */}
              <div className="bg-foreground/95 backdrop-blur-sm px-4 py-3 rounded-t-xl">
                <h3 className="text-background font-semibold text-lg truncate text-center">
                  {displayName}
                </h3>
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
              <div className="bg-background px-6 py-4 rounded-b-xl flex items-center justify-center gap-12">
                {/* Message button */}
                <button
                  onClick={handleMessageClick}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    "bg-muted group-hover:bg-muted/80 group-active:scale-95"
                  )}>
                    <MessageCircle className={cn("w-6 h-6", primaryColor)} />
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
                    <Info className={cn("w-6 h-6", primaryColor)} />
                  </div>
                  <span className="text-xs text-muted-foreground">Profilo</span>
                </button>
              </div>
            </div>

            {/* Click outside to close */}
            <div
              className="absolute inset-0 -z-10"
              onClick={() => setIsOpen(false)}
            />
          </div>
        </DialogPortal>
      </Dialog>
    </>
  );
}
