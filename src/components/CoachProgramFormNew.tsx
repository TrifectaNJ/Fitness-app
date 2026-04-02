import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Database, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import CoachProgramFormBasic from './CoachProgramFormBasic';
import { ProgramFormDays } from './ProgramFormDays';
import { ProgramFormMedia } from './ProgramFormMedia';

interface CoachProgram {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  paymentType: 'one-time' | 'monthly';
  imageUrl?: string;
  videoUrl?: string;
  instructions: string[];
  isActive: boolean;
  showOnHomePage: boolean;
  assignedUserId?: string;
  createdBy: string;
}

interface CoachProgramFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: CoachProgram;
  onSave: () => Promise<void>;
}

const CoachProgramFormNew: React.FC<CoachProgramFormProps> = ({ 
  open, onOpenChange, program, onSave 
}) => {
  const { currentUser } = useAppContext();
  const [formData, setFormData] = useState({
    title: '', description: '', price: 0, paymentType: 'one-time' as 'one-time' | 'monthly',
    duration: '', difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: '', imageUrl: '', videoUrl: '', instructions: [''], 
    isActive: true, showOnHomePage: false, isFree: false, assignedUserId: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (program) {
      setFormData({
        title: program.title, description: program.description, price: program.price,
        paymentType: program.paymentType, duration: program.duration, difficulty: program.difficulty,
        category: program.category, imageUrl: program.imageUrl || '', videoUrl: program.videoUrl || '',
        instructions: program.instructions.length ? program.instructions : [''],
        isActive: program.isActive, showOnHomePage: program.showOnHomePage || false, 
        isFree: program.price === 0, assignedUserId: program.assignedUserId || ''
      });
    } else {
      setFormData({
        title: '', description: '', price: 0, paymentType: 'one-time', duration: '',
        difficulty: 'beginner', category: '', imageUrl: '', videoUrl: '', instructions: [''],
        isActive: true, showOnHomePage: false, isFree: false, assignedUserId: ''
      });
    }
    setValidationErrors([]);
    setSubmitStatus('idle');
    setActiveTab('basic');
  }, [program, open]);

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.title.trim()) errors.push('Title is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.category.trim()) errors.push('Category is required');
    if (!formData.duration.trim()) errors.push('Duration is required');
    if (!formData.isFree && formData.price < 0) errors.push('Price cannot be negative');
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const cleanInstructions = formData.instructions.filter(inst => inst.trim());
      
      // Transform camelCase to snake_case for database
      // Transform camelCase to snake_case for database
      const dbData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: formData.isFree ? 0 : formData.price,
        payment_type: formData.isFree ? 'free' : formData.paymentType,
        difficulty: formData.difficulty,
        duration: formData.duration,
        instructions: cleanInstructions.length > 0 ? cleanInstructions : [],
        is_active: formData.isActive,
        display_on_home_page: formData.showOnHomePage,
        image_url: formData.imageUrl || null,
        video_url: formData.videoUrl || null,
        assigned_user_id: formData.assignedUserId || null,
        updated_at: new Date().toISOString()
      };
      
      // Only include created_by for new programs
      if (!program) {
        dbData.created_by = currentUser?.id || '';
      }
      
      console.log('Submitting program data:', dbData);
      
      if (program) {
        const { error } = await supabase
          .from('coach_programs')
          .update(dbData)
          .eq('id', program.id);
        
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Program updated successfully');
      } else {
        const { error } = await supabase
          .from('coach_programs')
          .insert([dbData]);
        
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Program created successfully');
      }
      
      setSubmitStatus('success');
      toast({
        title: 'Success',
        description: program ? 'Program updated successfully!' : 'Program created successfully!',
        variant: 'default'
      });
      await onSave();
      setTimeout(() => onOpenChange(false), 1000);
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
      toast({ 
        title: 'Error saving program', 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
    if (type === 'image') {
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } else {
      setFormData(prev => ({ ...prev, videoUrl: url }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {program ? 'Edit Program' : 'Create New Program'}
            {submitStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
          </DialogTitle>
        </DialogHeader>
        
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationErrors.join(', ')}</AlertDescription>
          </Alert>
        )}
        
        {submitStatus === 'success' && (
          <Alert className="border-green-500 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Program saved successfully!</AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="days">Program Days</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <CoachProgramFormBasic
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              program={program}
            />
          </TabsContent>
          
          <TabsContent value="days">
            <ProgramFormDays
              days={[]}
              onAddDay={() => console.log('Add day')}
              onEditDay={() => console.log('Edit day')}
              onDeleteDay={() => console.log('Delete day')}
            />
          </TabsContent>
          
          <TabsContent value="media">
            <ProgramFormMedia
              formData={formData}
              onMediaUpload={handleMediaUpload}
              setFormData={setFormData}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting} 
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {isSubmitting ? 'Saving...' : (program ? 'Update' : 'Create')} Program
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoachProgramFormNew;