import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  schedule: string | null;
}

interface EditJobDialogProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditJobDialog({ job, isOpen, onClose, onSuccess }: EditJobDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setDescription(job.description || '');
      setSchedule(job.schedule || '');
      setPrice(job.price || '');
    }
  }, [job]);

  const handleSubmit = async () => {
    if (!job || !title.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          schedule: schedule.trim() || null,
          price: price.trim() || null,
        })
        .eq('id', job.id);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error updating job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica Annuncio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Titolo</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titolo dell'annuncio"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrizione</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrizione del lavoro"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-schedule">Orario</Label>
            <Input
              id="edit-schedule"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="es. Lun-Ven 18:00-22:00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-price">Paga</Label>
            <Input
              id="edit-price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="es. 10€/h"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="bg-employer hover:bg-employer-700 text-employer-foreground"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvataggio...
              </>
            ) : (
              'Salva Modifiche'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
