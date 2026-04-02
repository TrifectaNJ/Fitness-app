import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CoachProgramSelectionModal } from './CoachProgramSelectionModal';

interface HomePageItemCardProps {
  item: any;
  onItemClick: (item: any) => void;
  getIcon: (iconName: string) => React.ReactNode;
  isTrackableItem: (title: string) => boolean;
}

export const HomePageItemCard: React.FC<HomePageItemCardProps> = ({
  item,
  onItemClick,
  getIcon,
  isTrackableItem
}) => {
  const [assignedPrograms, setAssignedPrograms] = useState<any[]>([]);
  const [showNoCoachAlert, setShowNoCoachAlert] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if this is a coach program card
  const isCoachProgramCard = item.coachProgramId || item.title?.includes('Coach') || item.linkTo === 'Coach Program';

  const fetchAssignedCoachPrograms = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Query coach_programs table directly using assigned_user_id
      const { data: programs, error: programsError } = await supabase
        .from('coach_programs')
        .select(`
          id,
          title,
          description,
          difficulty,
          duration,
          created_at,
          updated_at,
          created_by,
          is_active,
          category,
          price,
          payment_type,
          instructions,
          image_url,
          video_url
        `)
        .eq('assigned_user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (programsError) {
        console.error('Error fetching assigned coach programs:', programsError);
        setError('Failed to load coach programs');
        return [];
      }

      return programs || [];
    } catch (error) {
      console.error('Error fetching assigned coach programs:', error);
      setError('Failed to load coach programs');
      return [];
    }
  };

  const handleClick = async () => {
    if (!isCoachProgramCard) {
      onItemClick(item);
      return;
    }

    // If there's an error from previous attempt, allow retry
    if (error) {
      setError(null);
    }

    setLoading(true);
    const programs = await fetchAssignedCoachPrograms();
    setLoading(false);

    // Handle error state
    if (error) {
      return; // Error state will be shown in UI
    }

    if (programs.length === 0) {
      // No programs assigned - show alert and don't navigate
      setShowNoCoachAlert(true);
      setTimeout(() => setShowNoCoachAlert(false), 3000);
      return;
    }

    if (programs.length === 1) {
      // One program - open directly
      const program = programs[0];
      
      // Remember the last chosen program
      localStorage.setItem('lastChosenCoachProgram', program.id);
      
      const modifiedItem = {
        ...item,
        coachProgramId: program.id,
        linkTo: 'Coach Program'
      };
      onItemClick(modifiedItem);
      return;
    }

    // Multiple programs - show selection modal
    setAssignedPrograms(programs);
    setShowSelectionModal(true);
  };

  const handleProgramSelect = (programId: string) => {
    const modifiedItem = {
      ...item,
      coachProgramId: programId,
      linkTo: 'Coach Program'
    };
    onItemClick(modifiedItem);
  };

  // Always use the configured title and description from Home Page Manager
  const displayTitle = item.title;
  const displayDescription = item.description;

  return (
    <>
      {showNoCoachAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Alert className="bg-yellow-50 border-yellow-200 shadow-lg">
            <AlertDescription className="text-yellow-800">
              No coach program available. Please contact support to get a program assigned.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Alert className="bg-red-50 border-red-200 shadow-lg">
            <AlertDescription className="text-red-800">
              {error}. Tap to retry.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <CoachProgramSelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        onProgramSelect={handleProgramSelect}
        programs={assignedPrograms}
      />

      <div 
        className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all ${
          loading ? 'cursor-wait opacity-75' : error ? 'cursor-pointer' : 'cursor-pointer'
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${
              error ? 'bg-red-50' : 'bg-blue-50'
            } flex items-center justify-center`}>
              {getIcon(item.icon)}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{displayTitle}</h4>
              <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
                {error ? 'Couldn\'t load, tap to retry' : displayDescription}
              </p>
            </div>
          </div>
          {!loading && (
            <ChevronRight className={`w-5 h-5 ${
              error ? 'text-red-400' : 'text-gray-400'
            }`} />
          )}
          {loading && (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>
    </>
  );
};
