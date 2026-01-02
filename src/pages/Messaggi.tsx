import { BottomNav } from "@/components/layout/BottomNav";
import { MessageCircle } from "lucide-react";

const Messaggi = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Simple Header */}
      <header className="sticky top-0 z-40 bg-background px-4 pt-4 pb-3 safe-top border-b-2 border-foreground">
        <h1 className="text-2xl font-bold text-foreground">Messaggi</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="brutal-card p-8 bg-card text-center max-w-sm">
          <div className="w-16 h-16 bg-primary border-2 border-foreground rounded-full flex items-center justify-center mx-auto mb-4 shadow-brutal-sm">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Nessun Messaggio</h2>
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
