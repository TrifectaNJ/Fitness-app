import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FitnessProgram } from '@/types/fitness';
import { Clock, Users, Star, Edit, Trash2, Eye, Play, Sparkles, Crown } from 'lucide-react';
import { useDesign } from '@/contexts/DesignContext';
import { useNavigate } from 'react-router-dom';

interface ProgramCardProps {
  program: FitnessProgram;
  onEdit?: (program: FitnessProgram) => void;
  onDelete?: (id: string) => void;
  onView?: (program: FitnessProgram) => void;
  isAdmin?: boolean;
}

const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  onEdit,
  onDelete,
  onView,
  isAdmin = false
}) => {
  const { settings } = useDesign();
  const navigate = useNavigate();

  const handleViewClick = () => {
    if (isAdmin && onView) {
      onView(program);
    } else if (!isAdmin) {
      // Navigate to program detail page for regular users
      navigate(`/program/${program.id}`);
    }
  };

  const isFree = program.price === 0;

  return (
    <Card 
      className="overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 hover:scale-105 border-0 bg-white/95 backdrop-blur-sm group"
      style={{ borderRadius: '24px' }}
      onClick={handleViewClick}
    >
      <CardHeader className="p-0 relative">
        <div className="h-48 relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600" style={{
          borderRadius: '24px 24px 0 0'
        }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          
          {/* Animated decorative elements */}
          <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
            <Crown className="w-5 h-5 text-white" />
          </div>
          
          {/* Floating sparkles */}
          <div className="absolute top-6 left-6 w-3 h-3 bg-white/40 rounded-full animate-pulse" />
          <div className="absolute top-12 right-12 w-2 h-2 bg-white/60 rounded-full animate-pulse delay-300" />
          <div className="absolute bottom-16 left-8 w-2 h-2 bg-white/50 rounded-full animate-pulse delay-700" />
          
          <div className="absolute top-6 left-6">
            <Badge 
              className="bg-white/95 text-purple-800 font-bold px-4 py-2 shadow-xl text-sm backdrop-blur-sm"
            >
              {program.category}
            </Badge>
          </div>
          
          <div className="absolute top-6 right-20">
            {!program.isActive && (
              <Badge className="bg-red-500/90 text-white font-bold px-4 py-2 shadow-xl backdrop-blur-sm">
                Inactive
              </Badge>
            )}
          </div>
          
          <div className="absolute bottom-6 left-6 right-6">
            <h3 className="font-black text-2xl text-white leading-tight drop-shadow-2xl group-hover:scale-105 transition-transform duration-300">
              {program.title}
            </h3>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-6">
        <p className="text-gray-600 text-base leading-relaxed line-clamp-2 group-hover:text-gray-700 transition-colors">
          {program.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-700">{program.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-semibold text-gray-700 capitalize">{program.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Star className="w-5 h-5 text-yellow-600 fill-current" />
            </div>
            <span className="font-bold text-xl text-gray-800">{program.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
          <div>
            <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {isFree ? 'Free' : `$${program.price}`}
            </div>
            {!isFree && program.paymentType === 'monthly' && (
              <div className="text-sm text-gray-500 font-medium">per month</div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onView) onView(program);
                  }}
                  className="hover:bg-blue-50 hover:border-blue-300 border-2 rounded-xl transition-all duration-200"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit(program);
                  }}
                  className="hover:bg-green-50 hover:border-green-300 border-2 rounded-xl transition-all duration-200"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete(program.id);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 border-2 rounded-xl transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button 
                className="px-8 py-3 text-white font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 rounded-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewClick();
                }}
              >
                <Play className="w-5 h-5 mr-2" />
                {isFree ? 'Start Free' : 'Start Program'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgramCard;