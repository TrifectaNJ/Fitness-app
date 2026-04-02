import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, Users, Star, Play, Eye, Calendar, Target, 
  GraduationCap, RefreshCw, Crown, Dumbbell 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CoachProgram {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  category: string;
  image_url?: string;
  days?: any[];
  created_at: string;
  coach_id: string;
  is_active: boolean;
  assigned_users?: string[];
}

interface CoachProgramsTabProps {
  onViewProgram?: (program: any) => void;
  currentUserId?: string;
}

export const CoachProgramsTab: React.FC<CoachProgramsTabProps> = ({ 
  onViewProgram, 
  currentUserId 
}) => {
  const [programs, setPrograms] = useState<CoachProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoachPrograms();
    
    // Check if we need to open a specific coach program
    const openCoachProgramId = localStorage.getItem('openCoachProgramId');
    if (openCoachProgramId) {
      // Clear the localStorage item
      localStorage.removeItem('openCoachProgramId');
      
      // Find and open the program after programs are loaded
      setTimeout(() => {
        const programToOpen = programs.find(p => p.id === openCoachProgramId);
        if (programToOpen) {
          handleProgramClick(programToOpen);
        }
      }, 100);
    }
  }, [currentUserId, programs]);

  const fetchCoachPrograms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query programs assigned to the current user via assigned_user_id
      const { data, error: fetchError } = await supabase
        .from('coach_programs')
        .select('*')
        .eq('is_active', true)
        .eq('assigned_user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching coach programs:', fetchError);
        setError('Failed to load coach programs');
        return;
      }

      console.log('Fetched coach programs for user:', currentUserId, data);
      setPrograms(data || []);
    } catch (err) {
      console.error('Error in fetchCoachPrograms:', err);
      setError('Failed to load coach programs');
    } finally {
      setLoading(false);
    }
  };


  const handleProgramClick = (program: CoachProgram) => {
    if (onViewProgram) {
      // Convert coach program to format expected by program viewer
      const convertedProgram = {
        id: program.id,
        title: program.title,
        description: program.description,
        difficulty: program.difficulty,
        duration: program.duration,
        category: program.category,
        imageUrl: program.image_url,
        days: program.days || [],
        price: 0, // Coach programs are typically free for assigned users
        isActive: program.is_active,
        showOnHomePage: false
      };
      onViewProgram(convertedProgram);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl font-bold text-gray-900">Coach Programs</h3>
        </div>
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading coach programs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl font-bold text-gray-900">Coach Programs</h3>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCoachPrograms} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="w-6 h-6 text-purple-600" />
        <h3 className="text-2xl font-bold text-gray-900">Coach Programs</h3>
        {programs.length > 0 && (
          <Badge variant="secondary" className="ml-2">
            {programs.length} Available
          </Badge>
        )}
      </div>

      {programs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No coach program yet</h3>
          <p className="text-gray-600">
            Your coach will assign one soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <Card 
              key={program.id} 
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md overflow-hidden"
              onClick={() => handleProgramClick(program)}
            >
              <div className="relative">
                {program.image_url ? (
                  <img 
                    src={program.image_url} 
                    alt={program.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <Dumbbell className="w-16 h-16 text-white/80" />
                  </div>
                )}
                
                <div className="absolute top-3 left-3">
                  <Badge className="bg-purple-600 hover:bg-purple-700">
                    <Crown className="w-3 h-3 mr-1" />
                    Coach Program
                  </Badge>
                </div>
                
                <div className="absolute top-3 right-3">
                  <Badge className={getDifficultyColor(program.difficulty)}>
                    {program.difficulty || 'Beginner'}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      {program.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {program.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{program.duration || 'Variable'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{program.days?.length || 0} Days</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">4.8</span>
                      <span className="text-xs text-gray-500">(Personal)</span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProgramClick(program);
                      }}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Start Program
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};