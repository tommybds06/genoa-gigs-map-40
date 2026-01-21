import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, X, Loader2 } from 'lucide-react';

interface PhotoUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  userId: string;
  maxPhotos?: number;
}

export const PhotoUploader = ({
  photos,
  onPhotosChange,
  userId,
  maxPhotos = 10,
}: PhotoUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      toast.error(`Puoi caricare massimo ${maxPhotos} foto`);
      return;
    }

    setUploading(true);

    try {
      const newPhotos: string[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} non è un'immagine valida`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} è troppo grande (max 5MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Errore nel caricamento di ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        newPhotos.push(publicUrl);
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
        toast.success(`${newPhotos.length} foto caricate!`);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Errore nel caricamento delle foto');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const emptySlots = Math.max(0, Math.min(3, maxPhotos - photos.length));

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-3">
        {/* Existing photos */}
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl overflow-hidden bg-muted"
          >
            <img
              src={photo}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Upload slots */}
        {photos.length < maxPhotos && (
          <>
            {Array.from({ length: emptySlots }).map((_, index) => (
              <button
                key={`empty-${index}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex items-center justify-center bg-muted/30"
              >
                {uploading && index === 0 ? (
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                ) : (
                  <Plus className="h-8 w-8 text-muted-foreground" />
                )}
              </button>
            ))}
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {photos.length}/{maxPhotos} foto caricate
      </p>
    </div>
  );
};
