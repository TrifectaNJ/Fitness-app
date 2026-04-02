import React from 'react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { useFitness } from '../contexts/FitnessContext';
import { supabase } from '@/lib/supabase';

interface LinkSelectorProps {
  value: string;
  onChange: (link: string) => void;
  onProgramChange?: (programId: string | null) => void;
  programId?: string; // Add programId prop to handle direct program ID
  coachProgramId?: string; // Add coachProgramId prop for coach programs
  onCoachProgramChange?: (coachProgramId: string | null) => void;
}

export const LinkSelector: React.FC<LinkSelectorProps> = ({ 
  value, 
  onChange, 
  onProgramChange, 
  programId,
  coachProgramId,
  onCoachProgramChange
}) => {
  const { programs, dietPlans, refreshPrograms, loading } = useFitness();
  const [coachPrograms, setCoachPrograms] = React.useState<any[]>([]);
  const [loadingCoachPrograms, setLoadingCoachPrograms] = React.useState(false);
  
  // Force refresh programs when component mounts
  React.useEffect(() => {
    console.log('LinkSelector: Component mounted, refreshing programs...');
    refreshPrograms();
    loadCoachPrograms();
  }, [refreshPrograms]);
  
  const loadCoachPrograms = async () => {
    setLoadingCoachPrograms(true);
    try {
      const { data, error } = await supabase
        .from('coach_programs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading coach programs:', error);
        setCoachPrograms([]);
      } else {
        setCoachPrograms(data || []);
      }
    } catch (error) {
      console.error('Error loading coach programs:', error);
      setCoachPrograms([]);
    } finally {
      setLoadingCoachPrograms(false);
    }
  };
  
  const [linkType, setLinkType] = React.useState(() => {
    if (coachProgramId || value.startsWith('/coach-program/')) return 'coach-program';
    if (programId || value.startsWith('/program/')) return 'program';
    if (value.startsWith('/diet/')) return 'diet';
    if (value.startsWith('/page/')) return 'page';
    if (value.startsWith('http')) return 'external';
    return 'none';
  });

  const [selectedProgramId, setSelectedProgramId] = React.useState(() => {
    // Prioritize programId prop over parsing from value
    if (programId) return programId;
    if (value.startsWith('/program/')) {
      return value.replace('/program/', '');
    }
    return '';
  });

  const [selectedCoachProgramId, setSelectedCoachProgramId] = React.useState(() => {
    if (coachProgramId) return coachProgramId;
    if (value.startsWith('/coach-program/')) {
      return value.replace('/coach-program/', '');
    }
    return '';
  });

  // Update selectedProgramId when programId prop changes (for editing existing items)
  React.useEffect(() => {
    console.log('LinkSelector: programId prop changed to:', programId);
    if (programId) {
      setSelectedProgramId(programId);
      setLinkType('program');
      // Also update the link value to match
      onChange(`/program/${programId}`);
    } else if (value.startsWith('/program/')) {
      const programIdFromValue = value.replace('/program/', '');
      setSelectedProgramId(programIdFromValue);
      setLinkType('program');
    }
  }, [programId, value, onChange]);

  // Update selectedCoachProgramId when coachProgramId prop changes
  React.useEffect(() => {
    console.log('LinkSelector: coachProgramId prop changed to:', coachProgramId);
    if (coachProgramId) {
      setSelectedCoachProgramId(coachProgramId);
      setLinkType('coach-program');
      onChange(`/coach-program/${coachProgramId}`);
    } else if (value.startsWith('/coach-program/')) {
      const coachProgramIdFromValue = value.replace('/coach-program/', '');
      setSelectedCoachProgramId(coachProgramIdFromValue);
      setLinkType('coach-program');
    }
  }, [coachProgramId, value, onChange]);

  const handleTypeChange = (type: string) => {
    console.log('LinkSelector: Type changed to:', type);
    setLinkType(type);
    if (type === 'none') {
      onChange('');
      setSelectedProgramId('');
      setSelectedCoachProgramId('');
      if (onProgramChange) onProgramChange(null);
      if (onCoachProgramChange) onCoachProgramChange(null);
    } else if (type === 'program' && selectedProgramId) {
      // If switching to program and we have a selected program, update the link
      onChange(`/program/${selectedProgramId}`);
      if (onProgramChange) onProgramChange(selectedProgramId);
    } else if (type === 'coach-program' && selectedCoachProgramId) {
      onChange(`/coach-program/${selectedCoachProgramId}`);
      if (onCoachProgramChange) onCoachProgramChange(selectedCoachProgramId);
    }
  };

  const handleValueChange = (newValue: string) => {
    console.log('LinkSelector: Value changed to:', newValue, 'for type:', linkType);
    switch (linkType) {
      case 'program':
        setSelectedProgramId(newValue);
        onChange(`/program/${newValue}`);
        if (onProgramChange) {
          console.log('LinkSelector: Calling onProgramChange with ID:', newValue);
          onProgramChange(newValue);
        }
        break;
      case 'coach-program':
        setSelectedCoachProgramId(newValue);
        onChange(`/coach-program/${newValue}`);
        if (onCoachProgramChange) {
          console.log('LinkSelector: Calling onCoachProgramChange with ID:', newValue);
          onCoachProgramChange(newValue);
        }
        break;
      case 'diet':
        onChange(`/diet/${newValue}`);
        break;
      case 'page':
        onChange(`/page/${newValue}`);
        break;
      case 'external':
        onChange(newValue);
        break;
      default:
        onChange('');
        if (onProgramChange) onProgramChange(null);
        if (onCoachProgramChange) onCoachProgramChange(null);
    }
  };

  const getCurrentValue = () => {
    if (linkType === 'program') {
      return selectedProgramId;
    }
    if (linkType === 'coach-program') {
      return selectedCoachProgramId;
    }
    if (linkType === 'diet') return value.replace('/diet/', '');
    if (linkType === 'page') return value.replace('/page/', '');
    return value;
  };

  // Get the selected program for display
  const getSelectedProgram = () => {
    if (linkType === 'program' && selectedProgramId) {
      return availablePrograms.find(p => p.id === selectedProgramId);
    }
    return null;
  };

  // Get the selected coach program for display
  const getSelectedCoachProgram = () => {
    if (linkType === 'coach-program' && selectedCoachProgramId) {
      return coachPrograms.find(p => p.id === selectedCoachProgramId);
    }
    return null;
  };

  // Get ALL programs, not just active ones for admin selection
  const availablePrograms = programs || [];
  console.log('LinkSelector: All programs:', availablePrograms.map(p => ({ 
    id: p.id, 
    title: p.title, 
    isActive: p.isActive 
  })));
  console.log('LinkSelector: Loading state:', loading);
  console.log('LinkSelector: Current selectedProgramId:', selectedProgramId);
  console.log('LinkSelector: Current programId prop:', programId);
  console.log('LinkSelector: Current value:', value);
  console.log('LinkSelector: getCurrentValue():', getCurrentValue());
  
  return (
    <div className="space-y-3">
      <Label>Link to Feature</Label>
      <Select value={linkType} onValueChange={handleTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select what to link to" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Link</SelectItem>
          <SelectItem value="program">Program</SelectItem>
          <SelectItem value="coach-program">Coach Program</SelectItem>
          <SelectItem value="diet">Diet Plan</SelectItem>
          <SelectItem value="page">Calculator/Tracker</SelectItem>
          <SelectItem value="external">External URL</SelectItem>
        </SelectContent>
      </Select>
      
      {linkType === 'program' && (
        <div>
          <Label className="text-sm text-gray-600">Select Program</Label>
          <Select 
            value={selectedProgramId || ''} 
            onValueChange={handleValueChange}
            key={`program-select-${selectedProgramId}-${programId}`} // Force re-render when value changes
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a program">
                {getSelectedProgram()?.title || 'Choose a program'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availablePrograms.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{program.title} {!program.isActive ? '(Inactive)' : ''}</span>
                    {selectedProgramId === program.id && <span className="ml-2">✓</span>}
                  </div>
                </SelectItem>
              ))}
              {availablePrograms.length === 0 && (
                <SelectItem value="" disabled>
                  {loading ? 'Loading programs...' : 'No programs available'}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {linkType === 'coach-program' && (
        <div>
          <Label className="text-sm text-gray-600">Select Coach Program</Label>
          <Select 
            value={selectedCoachProgramId || ''} 
            onValueChange={handleValueChange}
            key={`coach-program-select-${selectedCoachProgramId}-${coachProgramId}`}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a coach program">
                {getSelectedCoachProgram()?.title || 'Choose a coach program'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {coachPrograms.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{program.title} {!program.is_active ? '(Inactive)' : ''}</span>
                    {selectedCoachProgramId === program.id && <span className="ml-2">✓</span>}
                  </div>
                </SelectItem>
              ))}
              {coachPrograms.length === 0 && (
                <SelectItem value="" disabled>
                  {loadingCoachPrograms ? 'Loading coach programs...' : 'No coach programs available'}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {linkType === 'diet' && (
        <div>
          <Label className="text-sm text-gray-600">Select Diet Plan</Label>
          <Select value={getCurrentValue()} onValueChange={handleValueChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a diet plan" />
            </SelectTrigger>
            <SelectContent>
              {dietPlans.map((diet) => (
                <SelectItem key={diet.id} value={diet.id}>
                  {diet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {linkType === 'page' && (
        <div>
          <Label className="text-sm text-gray-600">Select Calculator/Tracker</Label>
          <Select value={getCurrentValue()} onValueChange={handleValueChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a feature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calculator">Calorie Calculator</SelectItem>
              <SelectItem value="chat">AI Chat</SelectItem>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="programs">All Programs</SelectItem>
              <SelectItem value="diets">All Diet Plans</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {linkType === 'external' && (
        <div>
          <Label className="text-sm text-gray-600">External URL</Label>
          <Input
            type="url"
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      )}
    </div>
  );
};
