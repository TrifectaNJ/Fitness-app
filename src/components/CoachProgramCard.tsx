import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Star, StarOff, User } from 'lucide-react';

interface CoachProgram {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  showOnHomePage?: boolean;
  assignedUserEmail?: string;
}

interface CoachProgramCardProps {
  program: CoachProgram;
  onEdit: (program: CoachProgram) => void;
  onDelete: (id: string) => void;
  onView: (program: CoachProgram) => void;
  isAdmin?: boolean;
}

const CoachProgramCard: React.FC<CoachProgramCardProps> = ({
  program,
  onEdit,
  onDelete,
  onView,
  isAdmin = false
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative">
        {program.imageUrl && (
          <div className="h-48 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 relative overflow-hidden">
            <img 
              src={program.imageUrl} 
              alt={program.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20" />
          </div>
        )}
        {!program.imageUrl && (
          <div className="h-48 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
            <div className="text-white text-6xl font-bold opacity-20">
              {program.title.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        
        {program.showOnHomePage && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-yellow-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
              {program.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className={getDifficultyColor(program.difficulty)}>
                {program.difficulty}
              </Badge>
              <Badge variant="outline">{program.category}</Badge>
              {program.assignedUserEmail && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <User className="w-3 h-3 mr-1" />
                  {program.assignedUserEmail}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {program.price === 0 ? 'Free' : `$${program.price}`}
            </div>
            <div className="text-sm text-gray-500">{program.duration}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {program.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(program)}
              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(program)}
                  className="hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(program.id)}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${program.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500">
              {program.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoachProgramCard;