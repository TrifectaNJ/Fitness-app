import React, { useEffect, useState } from 'react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { supabase } from '@/lib/supabase';

interface Program {
  id: string;
  title: string;
}

interface CoachProgram {
  id: string;
  title: string;
}

interface DietPlan {
  id: string;
  name: string;
}

interface LinkSelectorSimpleProps {
  value: string;
  onChange: (link: string) => void;
  onProgramChange?: (programId: string | null) => void;
  programId?: string;
  coachProgramId?: string;
  onCoachProgramChange?: (coachProgramId: string | null) => void;
}

export const LinkSelectorSimple: React.FC<LinkSelectorSimpleProps> = ({ 
  value, 
  onChange, 
  onProgramChange, 
  programId,
  coachProgramId,
  onCoachProgramChange
}) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [coachPrograms, setCoachPrograms] = useState<CoachProgram[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const TRACKER_PAGES = ['water tracker', 'weight tracker', 'step tracker', 'calorie tracker'];

  const [linkType, setLinkType] = useState(() => {
    if (coachProgramId || value.startsWith('/coach-program/')) return 'coach-program';
    if (programId || value.startsWith('/program/')) return 'program';
    if (value.startsWith('/diet/')) return 'diet';
    if (value.startsWith('/tracker/')) return 'tracker';
    if (value.startsWith('/page/')) return 'page';
    if (value.startsWith('http')) return 'external';
    return 'none';
  });

  useEffect(() => {
    if (linkType === 'program') {
      fetchPrograms();
    } else if (linkType === 'coach-program') {
      fetchCoachPrograms();
    } else if (linkType === 'diet') {
      fetchDietPlans();
    }
  }, [linkType]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('id, title')
        .order('title');
      
      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachPrograms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coach_programs')
        .select('id, title')
        .order('title');
      
      if (error) throw error;
      setCoachPrograms(data || []);
    } catch (error) {
      console.error('Error fetching coach programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDietPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setDietPlans(data || []);
    } catch (error) {
      console.error('Error fetching diet plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setLinkType(type);
    if (type === 'none') {
      onChange('');
      if (onProgramChange) onProgramChange(null);
      if (onCoachProgramChange) onCoachProgramChange(null);
    }
  };

  const handleTrackerSelect = (trackerName: string) => {
    onChange(`/tracker/${trackerName}`);
  };

  const handleProgramSelect = (selectedProgramId: string) => {
    onChange(`/program/${selectedProgramId}`);
    if (onProgramChange) onProgramChange(selectedProgramId);
  };

  const handleCoachProgramSelect = (selectedCoachProgramId: string) => {
    onChange(`/coach-program/${selectedCoachProgramId}`);
    if (onCoachProgramChange) onCoachProgramChange(selectedCoachProgramId);
  };

  const handleDietSelect = (selectedDietId: string) => {
    onChange(`/diet/${selectedDietId}`);
  };

  const handlePageSelect = (selectedPage: string) => {
    onChange(`/page/${selectedPage}`);
  };

  const handleExternalUrlChange = (newValue: string) => {
    onChange(newValue);
  };

  const getCurrentValue = () => {
    if (linkType === 'diet') return value.replace('/diet/', '');
    if (linkType === 'page') return value.replace('/page/', '');
    if (linkType === 'tracker') return value.replace('/tracker/', '');
    return value;
  };

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
          <SelectItem value="tracker">Tracker</SelectItem>
          <SelectItem value="diet">Diet Plan</SelectItem>
          <SelectItem value="page">App Page</SelectItem>
          <SelectItem value="external">External URL</SelectItem>
        </SelectContent>
      </Select>
      
      {linkType === 'program' && (
        <div>
          <Label className="text-sm text-gray-600">Select Program</Label>
          <Select value={programId || ''} onValueChange={handleProgramSelect} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading programs..." : "Choose a program"} />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {linkType === 'coach-program' && (
        <div>
          <Label className="text-sm text-gray-600">Select Coach Program</Label>
          <Select value={coachProgramId || ''} onValueChange={handleCoachProgramSelect} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading coach programs..." : "Choose a coach program"} />
            </SelectTrigger>
            <SelectContent>
              {coachPrograms.map((coachProgram) => (
                <SelectItem key={coachProgram.id} value={coachProgram.id}>
                  {coachProgram.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {linkType === 'diet' && (
        <div>
          <Label className="text-sm text-gray-600">Select Diet Plan</Label>
          <Select value={getCurrentValue()} onValueChange={handleDietSelect} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading diet plans..." : "Choose a diet plan"} />
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

      {linkType === 'tracker' && (
        <div>
          <Label className="text-sm text-gray-600">Select Tracker</Label>
          <Select value={getCurrentValue()} onValueChange={handleTrackerSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a tracker" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="water tracker">Water Tracker</SelectItem>
              <SelectItem value="weight tracker">Weight Tracker</SelectItem>
              <SelectItem value="step tracker">Step Tracker</SelectItem>
              <SelectItem value="calorie tracker">Calorie Tracker</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {linkType === 'page' && (
        <div>
          <Label className="text-sm text-gray-600">Select App Page</Label>
          <Select value={getCurrentValue()} onValueChange={handlePageSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calculator">Calorie Calculator</SelectItem>
              <SelectItem value="programs">All Programs</SelectItem>
              <SelectItem value="coach-programs">Coach Programs</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
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
            onChange={(e) => handleExternalUrlChange(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      )}
    </div>
  );
};