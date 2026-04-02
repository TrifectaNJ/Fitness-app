import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Calendar, User, Trophy, Clock, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

interface ProgramInfo {
  id: string;
  name: string;
  coachName: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  totalWorkouts: number;
  completedWorkouts: number;
  dateAssigned: string;
  progress: number;
  type: 'customized' | 'coach';
}

interface UserProgramsSectionProps {
  programs: ProgramInfo[];
  loading?: boolean;
}

export function UserProgramsSection({ programs, loading }: UserProgramsSectionProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Assigned Programs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Assigned Programs</h3>
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No programs assigned to this user.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'customized' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        Assigned Programs ({programs.length})
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((program) => (
          <Card key={program.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base font-semibold line-clamp-1">
                  {program.name}
                </CardTitle>
                <Badge className={getTypeColor(program.type)}>
                  {program.type === 'customized' ? 'Custom' : 'Coach'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{program.coachName}</span>
                <Badge variant="outline" className={getLevelColor(program.level)}>
                  {program.level}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span>Progress</span>
                </div>
                <span className="font-medium">
                  {program.completedWorkouts}/{program.totalWorkouts} workouts
                </span>
              </div>
              
              <Progress value={program.progress} className="h-2" />
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Assigned {format(new Date(program.dateAssigned), 'MMM d, yyyy')}</span>
                </div>
                <span className="font-medium text-foreground">
                  {program.progress.toFixed(0)}% complete
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}