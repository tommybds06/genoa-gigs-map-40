import { useState, useRef } from "react";
import { PiuIcon, XIcon } from "@/components/icons/uiIcons";
import { Loader2, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FotoStampata } from "@/components/ui/FotoStampata";

interface PhotoGalleryManagerProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  userId: string;
  isEmployer?: boolean;
  maxPhotos?: number;
}

export function PhotoGalleryManager({
  photos,
  onPhotosChange,
  userId,
  isEmployer = false,
  maxPhotos = 10,
}: PhotoGalleryManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inchiostri, non pastelli: sono testo e icone su carta (§5).
  const primaryColor = isEmployer ? "text-employer-800" : "text-primary-strong";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      toast.error(`Massimo ${maxPhotos} foto consentite`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} non è un'immagine valida`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} supera i 5MB`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Errore caricamento ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        onPhotosChange([...photos, ...uploadedUrls]);
        toast.success(
          uploadedUrls.length === 1
            ? "Foto aggiunta!"
            : `${uploadedUrls.length} foto aggiunte!`
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Errore durante il caricamento");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    toast.success("Foto rimossa");
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);
    
    onPhotosChange(newPhotos);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Foto ({photos.length}/{maxPhotos})
        </label>
        {photos.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Trascina per riordinare
          </span>
        )}
      </div>

      {/* Foto STAMPATE (ui/FotoStampata), come nel profilo: cornice di carta
          col tratto delle card, scotch, la prima con «Foto profilo» scritto
          nel margine basso come su una Polaroid — al posto dell'etichetta
          colorata e dell'anello, che la distinguevano «col CSS». */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-5 pt-2">
        {photos.map((photo, index) => (
          <div
            key={photo}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "group relative cursor-grab transition-transform active:cursor-grabbing",
              draggedIndex === index && "scale-95 opacity-50",
              dragOverIndex === index && draggedIndex !== index && "scale-105"
            )}
          >
            <FotoStampata
              seme={photo}
              employer={isEmployer}
              scotch={[{ pezzo: "lungo", lato: "centro" }]}
              fondo={
                index === 0 ? (
                  <span className="text-[11px] font-medium text-ink-soft">Foto profilo</span>
                ) : undefined
              }
            >
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="h-full w-full object-cover"
                draggable={false}
              />

              {/* Maniglia: solo col mouse, dove il trascinamento c'è davvero. */}
              <div className="absolute left-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded bg-ink/50 p-1">
                  <GripVertical className="h-3 w-3 text-paper-sheet" />
                </div>
              </div>

              {/* ⚠️ SEMPRE visibile: era `opacity-0 group-hover:opacity-100`,
                  cioè sul telefono la foto non si poteva togliere. */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label={`Togli la foto ${index + 1}`}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink/60 text-paper-sheet"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </FotoStampata>
          </div>
        ))}

        {/* Il posto libero: una stampa vuota, tratteggiata, dritta. */}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="block w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FotoStampata seme="aggiungi" vuota storta={false}>
              <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                {isUploading ? (
                  <Loader2 className={cn("h-6 w-6 animate-spin", primaryColor)} />
                ) : (
                  <>
                    <PiuIcon className={cn("h-6 w-6", primaryColor)} />
                    <span className={cn("text-xs font-medium", primaryColor)}>Aggiungi</span>
                  </>
                )}
              </div>
            </FotoStampata>
          </button>
        )}
      </div>

      {/* Niente riquadro «Aggiungi almeno una foto» a galleria vuota (24
          ottobre): era un rettangolo col bordo CSS che ripeteva la stampa
          vuota «Aggiungi» qui sopra. Basta la riga in fondo. */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground text-center">
        La prima foto sarà la tua immagine profilo
      </p>
    </div>
  );
}
