import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Clock, User, TrendingUp, Calendar, Target } from 'lucide-react';

interface CoachProgram {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  created_by: string;
  created_at: string;
  assigned_users?: string[];
  days?: any[];
  workoutCount?: number;
  coachName?: string;
}

interface CoachProgramSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProgramSelect: (programId: string) => void;
  programs: CoachProgram[];
}

export const CoachProgramSelectionModal: React.FC<CoachProgramSelectionModalProps> = ({
  isOpen,
  onClose,
  onProgramSelect,
  programs
}) => {
  const handleProgramClick = (programId: string) => {
    onProgramSelect(programId);
    onClose();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-yellow-600';
      case 'advanced': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Choose Your Coach Program
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {programs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No coach programs found
            </div>
          ) : (
            programs.map((program) => (
              <Card 
                key={program.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200"
                onClick={() => handleProgramClick(program.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {program.title}
                        </h3>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Coach Program
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{program.coachName || 'Coach'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`w-4 h-4 ${getDifficultyColor(program.difficulty)}`} />
                          <span className="capitalize">{program.difficulty} Level</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          <span>{program.workoutCount || 0} Workouts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(program.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {program.description && (
                        <p className="text-sm text-gray-700 mb-4">
                          {program.description}
                        </p>
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
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};