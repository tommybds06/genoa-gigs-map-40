import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Clock, MapPin, GraduationCap, Truck, PartyPopper, Briefcase } from "lucide-react";

interface JobOwner {
  name: string;
  avatar: string | null;
  rating: number;
  reviewCount: number;
}

interface Job {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  schedule: string;
  lat: number;
  lng: number;
  owner: JobOwner;
}

interface JobDetailsSheetProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons: Record<string, typeof GraduationCap> = {
  tutoring: GraduationCap,
  delivery: Truck,
  event: PartyPopper,
  general: Briefcase,
};

const categoryLabels: Record<string, string> = {
  tutoring: "Ripetizioni",
  delivery: "Consegne",
  event: "Eventi",
  general: "Generale",
};

const categoryColors: Record<string, string> = {
  tutoring: "bg-blue-100 text-blue-700",
  delivery: "bg-green-100 text-green-700",
  event: "bg-purple-100 text-purple-700",
  general: "bg-secondary/20 text-secondary",
};

export function JobDetailsSheet({ job, isOpen, onClose }: JobDetailsSheetProps) {
  if (!job) return null;

  const Icon = categoryIcons[job.category] || Briefcase;
  const categoryLabel = categoryLabels[job.category] || "Altro";
  const categoryColor = categoryColors[job.category] || "bg-muted text-muted-foreground";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-3xl p-0 overflow-hidden"
        hideCloseButton
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="flex flex-col h-full overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-24">
            {/* Header with Category Icon */}
            <SheetHeader className="text-left pb-4">
              <div className={`w-16 h-16 ${categoryColor} rounded-2xl flex items-center justify-center mb-4`}>
                <Icon className="w-8 h-8" />
              </div>
              
              <div className="flex items-start justify-between gap-3">
                <SheetTitle className="text-2xl font-bold text-foreground leading-tight">
                  {job.title}
                </SheetTitle>
                <Badge className="bg-primary text-primary-foreground font-bold text-base px-3 py-1.5 rounded-full shrink-0">
                  {job.price}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline" className={`${categoryColor} border-none font-medium`}>
                  {categoryLabel}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{job.schedule}</span>
                </div>
              </div>
            </SheetHeader>

            {/* Owner Section */}
            <div className="py-4 border-t border-b border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">CHI OFFRE</h3>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                    {job.owner.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{job.owner.name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-medium text-sm">{job.owner.rating}</span>
                    <span className="text-muted-foreground text-sm">
                      ({job.owner.reviewCount} recensioni)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="py-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">DESCRIZIONE</h3>
              <p className="text-foreground leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* Static Map Preview */}
            <div className="py-4 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">POSIZIONE</h3>
              <div className="relative h-32 bg-muted rounded-2xl overflow-hidden">
                {/* Stylized mini map */}
                <div className="absolute inset-0">
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-blue-100/40" />
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 60 Q30 50 60 55 T100 45" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.3" opacity="0.3" />
                    <path d="M20 80 L50 40 L80 30" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.2" />
                  </svg>
                </div>
                
                {/* Center marker */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center shadow-md">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Location label */}
                <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1">
                  <p className="text-xs font-medium">Genova Centro</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <Button 
              className="w-full h-14 bg-secondary hover:bg-secondary/90 text-white font-bold text-lg rounded-xl shadow-material-md"
              onClick={onClose}
            >
              Candidati Ora
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
