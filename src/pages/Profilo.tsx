import { BottomNav } from "@/components/layout/BottomNav";
import { User, Star, MapPin, Briefcase, Settings, LogOut } from "lucide-react";

const Profilo = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background px-4 pt-4 pb-3 safe-top border-b-2 border-foreground">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Profilo</h1>
          <button className="p-2 brutal-card-sm bg-card">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-20 overflow-y-auto">
        {/* Profile Card */}
        <div className="brutal-card p-6 bg-card mb-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary border-2 border-foreground rounded-full flex items-center justify-center shadow-brutal-sm">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Studente Demo</h2>
              <p className="text-muted-foreground text-sm mb-1">studente@unige.it</p>
              <div className="flex items-center gap-1 text-secondary">
                <Star className="w-4 h-4" fill="currentColor" />
                <span className="font-semibold text-sm">4.8</span>
                <span className="text-muted-foreground text-sm">(12 recensioni)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="brutal-card-sm p-4 bg-card text-center">
            <div className="text-2xl font-bold text-secondary">8</div>
            <div className="text-sm text-muted-foreground">Lavori Completati</div>
          </div>
          <div className="brutal-card-sm p-4 bg-card text-center">
            <div className="text-2xl font-bold text-primary">3</div>
            <div className="text-sm text-muted-foreground">In Corso</div>
          </div>
        </div>

        {/* Info */}
        <div className="brutal-card p-4 bg-card mb-4">
          <h3 className="font-bold mb-3">Informazioni</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>Genova, Centro Storico</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <span>Disponibile per: Ripetizioni, Consegne, Eventi</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button className="brutal-btn w-full p-4 bg-card flex items-center justify-center gap-2 text-destructive">
          <LogOut className="w-5 h-5" />
          <span>Esci</span>
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profilo;
