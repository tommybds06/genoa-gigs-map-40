import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Briefcase, 
  Clock, 
  Euro, 
  FileText, 
  Loader2,
  Send,
  Pencil
} from 'lucide-react';
import { ROLE_TAGS, TYPE_TAGS } from '@/constants/tags';
import { getJobIcon } from '@/lib/jobIcons';
import { isWithinGenovaBounds, GEOFENCING_ERROR_MESSAGE } from '@/constants/geofencing';

const CreateJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Form fields (neighborhood removed - inherited from profile)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [price, setPrice] = useState('');
  
  // Single selection tags
  const [selectedTypeTag, setSelectedTypeTag] = useState<string>('');
  const [selectedRoleTag, setSelectedRoleTag] = useState<string>('');
  const [customRoleTag, setCustomRoleTag] = useState<string>('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  
  const [errors, setErrors] = useState<{ 
    title?: string; 
    description?: string; 
    typeTag?: string;
    roleTag?: string;
  }>({});

  const handleRoleSelect = (role: string) => {
    if (role === 'custom') {
      setIsCustomRole(true);
      setSelectedRoleTag('');
    } else {
      setIsCustomRole(false);
      setSelectedRoleTag(role);
      setCustomRoleTag('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Il titolo è obbligatorio';
    }
    
    if (!description.trim()) {
      newErrors.description = 'La descrizione è obbligatoria';
    }
    
    if (!selectedTypeTag) {
      newErrors.typeTag = 'Seleziona una modalità';
    }
    
    // Role is required - either predefined or custom
    const finalRole = isCustomRole ? customRoleTag.trim() : selectedRoleTag;
    if (!finalRole) {
      newErrors.roleTag = 'Seleziona o inserisci un ruolo';
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

    // Check if employer has set their location
    if (!profile.lat || !profile.lng) {
      toast.error('Imposta la posizione della tua attività nel Profilo', { duration: 3000 });
      return;
    }

    // Geofencing check
    if (!isWithinGenovaBounds(profile.lat, profile.lng)) {
      toast.error(GEOFENCING_ERROR_MESSAGE, { duration: 4000 });
      return;
    }

    setLoading(true);

    try {
      // Get final role tag
      const finalRole = isCustomRole ? customRoleTag.trim() : selectedRoleTag;
      
      // Combine tags: one type + one role
      const allTags = [selectedTypeTag, finalRole];

      // Inherit neighborhood from employer's profile
      const inheritedNeighborhood = profile.neighborhood || null;

      const { error } = await supabase
        .from('jobs')
        .insert({
          owner_id: user.id,
          title: title.trim(),
          description: description.trim(),
          schedule: schedule.trim() || null,
          price: price.trim() || null,
          category: finalRole.toLowerCase(),
          tags: allTags,
          lat: profile.lat,
          lng: profile.lng,
          neighborhood: inheritedNeighborhood,
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


        {/* Type Tag (Modalità) - Single Selection Required */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            Modalità <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Seleziona il tipo di impiego
          </p>
          <RadioGroup
            value={selectedTypeTag}
            onValueChange={setSelectedTypeTag}
            className="grid grid-cols-2 gap-2"
          >
            {TYPE_TAGS.map((tag) => (
              <div key={tag} className="relative">
                <RadioGroupItem
                  value={tag}
                  id={`type-${tag}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`type-${tag}`}
                  className={`flex items-center justify-center px-3 py-2.5 rounded-full text-sm font-medium cursor-pointer transition-all border-2 ${
                    selectedTypeTag === tag
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-blue-50 text-blue-700 border-transparent hover:bg-blue-100'
                  }`}
                >
                  {tag}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.typeTag && <p className="text-sm text-destructive">{errors.typeTag}</p>}
        </div>

        {/* Role Tag (Ruoli) - Single Selection Required with Custom Option */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            Ruolo <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Seleziona il ruolo richiesto
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_TAGS.map((tag) => {
              const Icon = getJobIcon(tag);
              const isSelected = !isCustomRole && selectedRoleTag === tag;
              
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleRoleSelect(tag)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-sm font-medium transition-all border-2 ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-orange-50 text-orange-700 border-transparent hover:bg-orange-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-orange-500'}`} />
                  <span className="text-xs text-center leading-tight">{tag}</span>
                </button>
              );
            })}
            
            {/* Custom Option */}
            <button
              type="button"
              onClick={() => handleRoleSelect('custom')}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-sm font-medium transition-all border-2 ${
                isCustomRole
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-orange-50 text-orange-700 border-transparent hover:bg-orange-100'
              }`}
            >
              <Pencil className={`w-5 h-5 ${isCustomRole ? 'text-white' : 'text-orange-500'}`} />
              <span className="text-xs text-center leading-tight">Altro</span>
            </button>
          </div>
          
          {/* Custom Role Input */}
          {isCustomRole && (
            <div className="mt-3">
              <Input
                placeholder="Scrivi il ruolo personalizzato..."
                value={customRoleTag}
                onChange={(e) => setCustomRoleTag(e.target.value)}
                className="border-orange-200 focus:border-orange-500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                L'icona visualizzata sarà una valigetta generica
              </p>
            </div>
          )}
          
          {errors.roleTag && <p className="text-sm text-destructive">{errors.roleTag}</p>}
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