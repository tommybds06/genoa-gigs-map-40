import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { useUser } from "@/contexts/UserContext";

const Index = () => {
  const { isEmployer } = useUser();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with dynamic title and color */}
      <Header 
        title="Mappa" 
        titleColor={isEmployer ? "text-blue-600" : "text-primary"}
      />

      {/* Map Container - Takes remaining space */}
      <main className="flex-1 px-4 pb-20 overflow-hidden">
        <div className="map-container w-full h-full rounded-3xl overflow-hidden">
          <InteractiveMap />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
