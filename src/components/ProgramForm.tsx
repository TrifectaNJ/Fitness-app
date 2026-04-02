import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FitnessProgram, ProgramDay } from '@/types/fitness';
import { AlertCircle, Database, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { DayForm } from './DayForm';
import { ProgramFormBasic } from './ProgramFormBasic';
import { ProgramFormDays } from './ProgramFormDays';
import { ProgramFormMedia } from './ProgramFormMedia';

interface ProgramFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: FitnessProgram;
  onSave: (program: Omit<FitnessProgram, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<FitnessProgram>) => Promise<void>;
}

const ProgramForm: React.FC<ProgramFormProps> = ({ open, onOpenChange, program, onSave, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', price: 0, paymentType: 'one-time' as 'one-time' | 'monthly',
    duration: '', difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: '', imageUrl: '', videoUrl: '', instructions: [''], days: [] as ProgramDay[], 
    isActive: true, showOnHomePage: false, isFree: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState('basic');
  const [showDayForm, setShowDayForm] = useState(false);
  const [editingDay, setEditingDay] = useState<{day: ProgramDay, index: number} | null>(null);
  const [savedProgramId, setSavedProgramId] = useState<string | null>(program?.id || null);

  useEffect(() => {
    if (program) {
      setFormData({
        title: program.title, description: program.description, price: program.price,
        paymentType: program.paymentType, duration: program.duration, difficulty: program.difficulty,
        category: program.category, imageUrl: program.imageUrl || '', videoUrl: program.videoUrl || '',
        instructions: program.instructions.length ? program.instructions : [''],
        days: program.days || [], isActive: program.isActive, 
        showOnHomePage: program.showOnHomePage || false, isFree: program.price === 0
      });
      setSavedProgramId(program.id);
    } else {
      setFormData({
        title: '', description: '', price: 0, paymentType: 'one-time', duration: '',
        difficulty: 'beginner', category: '', imageUrl: '', videoUrl: '', instructions: [''],
        days: [], isActive: true, showOnHomePage: false, isFree: false
      });
      setSavedProgramId(null);
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

  const saveProgramToDatabase = async (programData: any) => {
    if (program && onUpdate) {
      await onUpdate(program.id, programData);
    } else {
      await onSave(programData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const cleanInstructions = formData.instructions.filter(inst => inst.trim());
      const programData = { 
        ...formData, 
        price: formData.isFree ? 0 : formData.price,
        instructions: cleanInstructions.length > 0 ? cleanInstructions : []
      };
      delete (programData as any).isFree;
      
      await saveProgramToDatabase(programData);
      
      setSubmitStatus('success');
      setTimeout(() => onOpenChange(false), 1000);
    } catch (error) {
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

  const addDay = async (dayData: Omit<ProgramDay, 'id'>) => {
    const newDay: ProgramDay = {
      ...dayData,
      id: Date.now().toString()
    };
    
    const updatedDays = [...formData.days, newDay];
    setFormData(prev => ({ ...prev, days: updatedDays }));
    
    // Save to database immediately if program exists
    if (savedProgramId) {
      try {
        await supabase
          .from('programs')
          .update({ days: updatedDays })
          .eq('id', savedProgramId);
      } catch (error) {
        console.error('Error saving day to database:', error);
      }
    }
    
    setShowDayForm(false);
  };

  const updateDay = async (dayData: Omit<ProgramDay, 'id'>) => {
    if (!editingDay) return;
    
    const updatedDay = {
      ...dayData,
      id: editingDay.day.id
    };

    const updatedDays = [...formData.days];
    updatedDays[editingDay.index] = updatedDay;
    setFormData(prev => ({ ...prev, days: updatedDays }));
    
    // Save to database immediately if program exists
    if (savedProgramId) {
      try {
        await supabase
          .from('programs')
          .update({ days: updatedDays })
          .eq('id', savedProgramId);
      } catch (error) {
        console.error('Error updating day in database:', error);
      }
    }
    
    setEditingDay(null);
  };

  const deleteDay = async (index: number) => {
    const updatedDays = [...formData.days];
    updatedDays.splice(index, 1);
    setFormData(prev => ({ ...prev, days: updatedDays }));
    
    // Save to database immediately if program exists
    if (savedProgramId) {
      try {
        await supabase
          .from('programs')
          .update({ days: updatedDays })
          .eq('id', savedProgramId);
      } catch (error) {
        console.error('Error deleting day from database:', error);
      }
    }
  };

  if (showDayForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DayForm
            onSave={addDay}
            onCancel={() => setShowDayForm(false)}
            programId={savedProgramId}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (editingDay) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DayForm
            day={editingDay.day}
            onSave={updateDay}
            onCancel={() => setEditingDay(null)}
            programId={savedProgramId}
          />
        </DialogContent>
      </Dialog>
    );
  }

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
            <ProgramFormBasic
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              program={program}
            />
          </TabsContent>
          
          <TabsContent value="days">
            <ProgramFormDays
              days={formData.days}
              onAddDay={() => setShowDayForm(true)}
              onEditDay={(day, index) => setEditingDay({day, index})}
              onDeleteDay={deleteDay}
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

export default ProgramForm;