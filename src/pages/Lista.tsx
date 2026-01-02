import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { GraduationCap, Truck, PartyPopper, MapPin, Clock, Euro } from "lucide-react";

const sampleJobs = [
  {
    id: 1,
    title: "Ripetizioni di Matematica",
    category: "Ripetizioni",
    icon: GraduationCap,
    location: "Castelletto",
    distance: "1.2 km",
    pay: "15€/ora",
    time: "2 ore fa",
  },
  {
    id: 2,
    title: "Consegna Spesa Centro",
    category: "Consegne",
    icon: Truck,
    location: "Centro Storico",
    distance: "0.8 km",
    pay: "10€",
    time: "30 min fa",
  },
  {
    id: 3,
    title: "Staff Evento Universitario",
    category: "Eventi",
    icon: PartyPopper,
    location: "Porto Antico",
    distance: "2.1 km",
    pay: "50€",
    time: "1 ora fa",
  },
  {
    id: 4,
    title: "Aiuto Trasloco Studente",
    category: "Generale",
    icon: Truck,
    location: "Sampierdarena",
    distance: "3.5 km",
    pay: "25€",
    time: "5 ore fa",
  },
];

const Lista = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 px-4 pb-20 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-3">Lavoretti Disponibili</h2>
        
        <div className="space-y-3">
          {sampleJobs.map((job, index) => {
            const Icon = job.icon;
            return (
              <div 
                key={job.id} 
                className="material-card p-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-accent text-accent-foreground rounded-2xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{job.category}</p>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location} · {job.distance}
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary font-semibold">
                        <Euro className="w-3.5 h-3.5" />
                        {job.pay}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {job.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Lista;
