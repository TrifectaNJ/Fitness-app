import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { 
  Heart, Sparkles, User, Clock, Calendar, Target, 
  TrendingUp, ChevronRight, GraduationCap 
} from 'lucide-react';

interface CoachProgram {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  created_by: string;
  created_at: string;
  assigned_user_id?: string;
  days?: any[];
  workoutCount?: number;
  coachName?: string;
}

interface PersonalizedProgramsSectionProps {
  onViewProgram?: (program: any) => void;
}

export const PersonalizedProgramsSection: React.FC<PersonalizedProgramsSectionProps> = ({ onViewProgram }) => {
  const [coachPrograms, setCoachPrograms] = useState<CoachProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser: user } = useAppContext();

  useEffect(() => {
    if (user?.id) {
      loadCoachPrograms();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel(`coach_programs_personalized_${user.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'coach_programs'
          }, 
          (payload) => {
            // Check if this update affects the current user
            if (payload.new && (payload.new as any).assigned_user_id === user.id) {
              loadCoachPrograms();
            } else if (payload.old && (payload.old as any).assigned_user_id === user.id) {
              loadCoachPrograms();
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadCoachPrograms = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Query coach_programs where user is assigned via assigned_user_id
      const { data, error } = await supabase
        .from('coach_programs')
        .select('*')
        .eq('assigned_user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading coach programs:', error);
        throw error;
      }

      console.log('Loaded coach programs for user:', user.id, data);

      // Fetch days from coach_program_days table
      const programIds = data?.map(p => p.id) || [];
      let daysMap: { [key: string]: any[] } = {};
      
      if (programIds.length > 0) {
        const { data: daysData, error: daysError } = await supabase
          .from('coach_program_days')
          .select('*')
          .in('coach_program_id', programIds)
          .order('day_number', { ascending: true });
        
        if (!daysError && daysData) {
          daysData.forEach(day => {
            if (!daysMap[day.coach_program_id]) {
              daysMap[day.coach_program_id] = [];
            }
            daysMap[day.coach_program_id].push(day);
          });
        }
      }

      // Enhance programs with coach info and workout count
      const enhancedPrograms = await Promise.all(
        (data || []).map(async (program) => {
          let coachName = 'Coach';
          if (program.created_by) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('first_name, last_name')
              .eq('id', program.created_by)
              .single();
            
            if (profile) {
              coachName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Coach';
            }
          }

          // Get days from the map
          const days = daysMap[program.id] || [];
          
          // Count workouts/days
          const workoutCount = days.length;

          return {
            ...program,
            days,
            coachName,
            workoutCount
          };
        })
      );

      setCoachPrograms(enhancedPrograms);
    } catch (error) {
      console.error('Error loading coach programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-yellow-600';
      case 'advanced': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Don't show loading state
  if (loading) {
    return null;
  }

  // Empty state - matches Coach Programs tab exactly
  if (coachPrograms.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-10 h-10 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No coach program yet</h3>
        <p className="text-gray-600">Your coach will assign one soon.</p>
      </div>
    );
  }

  // Programs display with header
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Personalized by Your Coach!
              <Sparkles className="w-5 h-5 text-purple-500" />
            </h3>
            <p className="text-sm text-gray-600">Customized by your Coach</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {coachPrograms.map((program) => (
          <Card key={program.id} className="border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => onViewProgram && onViewProgram({
              id: program.id,
              title: program.title,
              description: program.description,
              difficulty: program.difficulty,
              duration: program.duration,
              days: program.days || [],
              price: 0,
              isActive: true
            })}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg text-gray-900">{program.title}</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">Coach Program</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{program.coachName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`w-4 h-4 ${getDifficultyColor(program.difficulty)}`} />
                      <span className="capitalize">{program.difficulty} Level</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>{program.workoutCount} Workouts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(program.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {program.description && (
                    <p className="text-sm text-gray-700 mb-4">{program.description}</p>
                  )}

                  {program.duration && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Duration: {program.duration}</span>
                    </div>
                  )}
                </div>
                
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
