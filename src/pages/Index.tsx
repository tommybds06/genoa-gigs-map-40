import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { useUser } from "@/contexts/UserContext";

const Index = () => {
  const { isEmployer } = useUser();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - hide search for employers */}
      <Header showSearch={!isEmployer} />

      {/* Map Container - Takes remaining space, more space for employers */}
      <main className={`flex-1 px-4 pb-20 overflow-hidden ${isEmployer ? 'pt-0' : ''}`}>
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
