import { BottomNav } from "@/components/layout/BottomNav";
import { MessageCircle } from "lucide-react";
import { useAppTheme } from "@/hooks/useAppTheme";

const Messaggi = () => {
  const { theme } = useAppTheme();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Simple Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 safe-top">
        <h1 className="text-2xl font-bold text-foreground">Messaggi</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="material-card-elevated p-8 text-center max-w-sm animate-scale-in">
          <div className={`w-16 h-16 ${theme.accentBg} ${theme.accentText} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <MessageCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nessun Messaggio</h2>
          <p className="text-muted-foreground text-sm">
            Quando contatterai un employer o riceverai messaggi, appariranno qui.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Messaggi;
