import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Database, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { DayForm } from './DayForm';
import { CoachProgramFormBasic } from './CoachProgramFormBasic';
import { ProgramFormDays } from './ProgramFormDays';
import { ProgramFormMedia } from './ProgramFormMedia';

interface CoachProgram {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  price: number;
  paymentType: 'one-time' | 'monthly';
  imageUrl?: string;
  videoUrl?: string;
  instructions: string[];
  days: any[];
  isActive: boolean;
  showOnHomePage?: boolean;
  assignedUserId?: string;
}

interface CoachProgramFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: CoachProgram;
  onSave: (program: any) => Promise<void>;
  onUpdate?: (id: string, updates: any) => Promise<void>;
}

const CoachProgramForm: React.FC<CoachProgramFormProps> = ({ 
  open, 
  onOpenChange, 
  program, 
  onSave, 
  onUpdate 
}) => {
  const [formData, setFormData] = useState({
    title: '', description: '', price: 0, paymentType: 'one-time' as 'one-time' | 'monthly',
    duration: '', difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: '', imageUrl: '', videoUrl: '', instructions: [''], days: [] as any[], 
    isActive: true, showOnHomePage: false, isFree: false, assignedUserId: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState('basic');
  const [showDayForm, setShowDayForm] = useState(false);
  const [editingDay, setEditingDay] = useState<{day: any, index: number} | null>(null);
  const [savedProgramId, setSavedProgramId] = useState<string | null>(program?.id || null);
  const [userRole, setUserRole] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (program) {
      setFormData({
        title: program.title, description: program.description, price: program.price,
        paymentType: program.paymentType, duration: program.duration, difficulty: program.difficulty,
        category: program.category, imageUrl: program.imageUrl || '', videoUrl: program.videoUrl || '',
        instructions: program.instructions.length ? program.instructions : [''],
        days: program.days || [], isActive: program.isActive, 
        showOnHomePage: program.showOnHomePage || false, isFree: program.price === 0,
        assignedUserId: program.assignedUserId || ''
      });
      setSavedProgramId(program.id);
    } else {
      setFormData({
        title: '', description: '', price: 0, paymentType: 'one-time', duration: '',
        difficulty: 'beginner', category: '', imageUrl: '', videoUrl: '', instructions: [''],
        days: [], isActive: true, showOnHomePage: false, isFree: false, assignedUserId: ''
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
    if (!formData.assignedUserId) errors.push('User assignment is required');
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
      const programData = { 
        title: formData.title,  // Fixed: was 'name'
        description: formData.description,
        price: formData.isFree ? 0 : formData.price,
        paymentType: formData.paymentType,
        duration: formData.duration,
        difficulty: formData.difficulty,  // Fixed: was 'difficultyLevel'
        category: formData.category,
        instructions: cleanInstructions.length > 0 ? cleanInstructions : [],
        days: formData.days,
        isActive: formData.isActive,
        showOnHomePage: formData.showOnHomePage,
        assignedUserId: formData.assignedUserId,
        imageUrl: formData.imageUrl,
        videoUrl: formData.videoUrl,
        isFree: formData.isFree  // Added this field
      };
      if (program && onUpdate) {
        await onUpdate(program.id, programData);
      } else {
        await onSave(programData);
      }
      
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

  const addDay = async (dayData: any) => {
    const newDay = {
      ...dayData,
      id: Date.now().toString()
    };
    
    const updatedDays = [...formData.days, newDay];
    setFormData(prev => ({ ...prev, days: updatedDays }));
    
    if (savedProgramId) {
      try {
        const { error: delError } = await supabase
          .from('coach_program_days')
          .delete()
          .eq('coach_program_id', savedProgramId);
        if (!delError) {
          const daysToInsert = updatedDays.map((d: any, i: number) => ({
            coach_program_id: savedProgramId,
            day_number: d.day_number || d.dayNumber || i + 1,
            title: d.title || `Day ${i + 1}`,
            description: d.description || '',
            workouts: d.workouts || []
          }));
          await supabase.from('coach_program_days').insert(daysToInsert);
        }
      } catch (error) {
        console.error('Error saving day to database:', error);
      }
    }

    setShowDayForm(false);
  };

  const updateDay = async (dayData: any) => {
    if (!editingDay) return;
    
    const updatedDay = {
      ...dayData,
      id: editingDay.day.id
    };

    const updatedDays = [...formData.days];
    updatedDays[editingDay.index] = updatedDay;
    setFormData(prev => ({ ...prev, days: updatedDays }));
    
    if (savedProgramId) {
      try {
        const { error: delError } = await supabase
          .from('coach_program_days')
          .delete()
          .eq('coach_program_id', savedProgramId);
        if (!delError) {
          const daysToInsert = updatedDays.map((d: any, i: number) => ({
            coach_program_id: savedProgramId,
            day_number: d.day_number || d.dayNumber || i + 1,
            title: d.title || `Day ${i + 1}`,
            description: d.description || '',
            workouts: d.workouts || []
          }));
          await supabase.from('coach_program_days').insert(daysToInsert);
        }
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
    
    if (savedProgramId) {
      try {
        const { error: delError } = await supabase
          .from('coach_program_days')
          .delete()
          .eq('coach_program_id', savedProgramId);
        if (!delError && updatedDays.length > 0) {
          const daysToInsert = updatedDays.map((d: any, i: number) => ({
            coach_program_id: savedProgramId,
            day_number: d.day_number || d.dayNumber || i + 1,
            title: d.title || `Day ${i + 1}`,
            description: d.description || '',
            workouts: d.workouts || []
          }));
          await supabase.from('coach_program_days').insert(daysToInsert);
        }
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
            isCoachProgram={true}
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
            isCoachProgram={true}
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
            {program ? 'Edit Coach Program' : 'Create New Coach Program'}
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
              setFormData={(data) => {
                setFormData(data);
                // Pass role and users state back to parent
                if (data.userRole) setUserRole(data.userRole);
                if (data.users) setUsers(data.users);
              }}
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
            disabled={isSubmitting || !formData.assignedUserId || (userRole?.toLowerCase() === 'coach' && users.length === 0)} 
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {isSubmitting ? 'Saving...' : (program ? 'Update' : 'Create')} Program
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoachProgramForm;