import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Briefcase, 
  Clock, 
  Euro, 
  FileText, 
  Hash, 
  Loader2,
  Send
} from 'lucide-react';
import { ROLE_TAGS, TYPE_TAGS, isRoleTag } from '@/constants/tags';

const CreateJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [price, setPrice] = useState('');
  const [selectedTypeTags, setSelectedTypeTags] = useState<string[]>([]);
  const [selectedRoleTags, setSelectedRoleTags] = useState<string[]>([]);
  
  const [errors, setErrors] = useState<{ 
    title?: string; 
    description?: string; 
    typeTags?: string;
  }>({});

  const toggleTypeTag = (tag: string) => {
    setSelectedTypeTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleRoleTag = (tag: string) => {
    setSelectedRoleTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Il titolo è obbligatorio';
    }
    
    if (!description.trim()) {
      newErrors.description = 'La descrizione è obbligatoria';
    }
    
    if (selectedTypeTags.length === 0) {
      newErrors.typeTags = 'Seleziona almeno una modalità';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Compila i campi obbligatori', { duration: 2000 });
      return;
    }

    if (!user || !profile) {
      toast.error('Devi essere autenticato', { duration: 2000 });
      return;
    }

    setLoading(true);

    try {
      // Combine all tags
      const allTags = [...selectedTypeTags, ...selectedRoleTags];
      
      // Get location from employer profile
      const employerLat = profile.lat ?? null;
      const employerLng = profile.lng ?? null;

      const { error } = await supabase
        .from('jobs')
        .insert({
          owner_id: user.id,
          title: title.trim(),
          description: description.trim(),
          price: price.trim() || null,
          category: selectedRoleTags[0]?.toLowerCase() || 'general',
          tags: allTags,
          lat: employerLat,
          lng: employerLng,
          status: 'open',
        });

      if (error) throw error;

      toast.success('Annuncio pubblicato!', { duration: 2000 });
      navigate('/annunci');
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Errore nella pubblicazione', { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-6">
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Crea Annuncio</h1>
        </div>
        <p className="text-white/80 text-sm">
          Pubblica un nuovo annuncio di lavoro
        </p>
      </div>

      <div className="px-6 py-6 space-y-6 pb-32">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600" />
            Titolo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="es. Cameriere per evento"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={errors.title ? 'border-destructive' : ''}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Descrizione <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Descrivi il lavoro, requisiti e aspettative..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`min-h-[120px] ${errors.description ? 'border-destructive' : ''}`}
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        </div>

        {/* Schedule */}
        <div className="space-y-2">
          <Label htmlFor="schedule" className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            Orario
          </Label>
          <Input
            id="schedule"
            placeholder="es. Lun-Ven 18:00-22:00"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price" className="text-base font-medium flex items-center gap-2">
            <Euro className="h-4 w-4 text-blue-600" />
            Paga
          </Label>
          <Input
            id="price"
            placeholder="es. 10€/h oppure 50€"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        {/* Type Tags (Modalità) - Required */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <Hash className="h-4 w-4 text-blue-600" />
            Modalità <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Seleziona il tipo di impiego
          </p>
          <div className="flex flex-wrap gap-2">
            {TYPE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTypeTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedTypeTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {errors.typeTags && <p className="text-sm text-destructive">{errors.typeTags}</p>}
        </div>

        {/* Role Tags (Ruoli) - Optional */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <Hash className="h-4 w-4 text-orange-500" />
            Ruolo <span className="text-muted-foreground text-sm font-normal">(opzionale)</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Specifica il ruolo richiesto
          </p>
          <div className="flex flex-wrap gap-2">
            {ROLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleRoleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedRoleTags.includes(tag)
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Pubblicazione...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Pubblica Annuncio
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateJob;
