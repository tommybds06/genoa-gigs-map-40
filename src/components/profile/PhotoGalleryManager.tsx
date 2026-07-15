import { useState, useRef } from "react";
import { Plus, X, Loader2, GripVertical, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const primaryColor = isEmployer ? "text-employer" : "text-primary";
  const primaryBg = isEmployer ? "bg-employer" : "bg-primary";
  const primaryBgLight = isEmployer ? "bg-employer-50" : "bg-accent";
  const primaryBorder = isEmployer ? "border-employer/20" : "border-primary/20";

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

      <div className="grid grid-cols-3 gap-2">
        {/* Photo Grid */}
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
              "relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing group",
              draggedIndex === index && "opacity-50 scale-95",
              dragOverIndex === index && draggedIndex !== index && `${primaryBorder} border-dashed`,
              index === 0 ? `ring-2 ${isEmployer ? 'ring-employer' : 'ring-primary'} ring-offset-2` : "border-border"
            )}
          >
            <img
              src={photo}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            
            {/* Profile photo badge */}
            {index === 0 && (
              <div className={cn(
                "absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white",
                primaryBg
              )}>
                Profilo
              </div>
            )}

            {/* Drag handle indicator */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-1 rounded bg-black/50">
                <GripVertical className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={() => handleRemove(index)}
              className="absolute bottom-1 right-1 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add Photo Button */}
        {photos.length < maxPhotos && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors",
              primaryBorder,
              isUploading ? "opacity-50 cursor-not-allowed" : `hover:${primaryBgLight}`
            )}
          >
            {isUploading ? (
              <Loader2 className={cn("w-6 h-6 animate-spin", primaryColor)} />
            ) : (
              <>
                <Plus className={cn("w-6 h-6", primaryColor)} />
                <span className={cn("text-xs font-medium", primaryColor)}>
                  Aggiungi
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Empty state */}
      {photos.length === 0 && !isUploading && (
        <div className={cn("text-center py-4 rounded-xl", primaryBgLight)}>
          <User className={cn("w-8 h-8 mx-auto mb-2", primaryColor)} />
          <p className="text-sm text-muted-foreground">
            Aggiungi almeno una foto profilo
          </p>
        </div>
      )}

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
