import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Lock, ShoppingCart, Dumbbell, Camera, Scale, Activity, Droplets, Heart, Target, Trophy } from 'lucide-react';
import { HomePageItem } from '@/contexts/HomePageContext';
import { useNavigate } from 'react-router-dom';

interface EditableDietPlanDashboardProps {
  homePageItems: HomePageItem[];
}

const EditableDietPlanDashboard: React.FC<EditableDietPlanDashboardProps> = ({
  homePageItems
}) => {
  const navigate = useNavigate();

  const getIcon = (iconName: string) => {
    const iconProps = { className: "w-6 h-6" };
    switch (iconName) {
      case 'dumbbell': return <Dumbbell {...iconProps} />;
      case 'camera': return <Camera {...iconProps} />;
      case 'scale': return <Scale {...iconProps} />;
      case 'activity': return <Activity {...iconProps} />;
      case 'droplets': return <Droplets {...iconProps} />;
      case 'heart': return <Heart {...iconProps} />;
      case 'target': return <Target {...iconProps} />;
      case 'trophy': return <Trophy {...iconProps} />;
      default: return <Dumbbell {...iconProps} />;
    }
  };

  const handleItemClick = (item: HomePageItem) => {
    if (item.link) {
      if (item.link.startsWith('http')) {
        window.open(item.link, '_blank');
      } else if (item.link.startsWith('/program/')) {
        const programId = item.link.replace('/program/', '');
        navigate(`/program/${programId}`);
      } else if (item.link.startsWith('/diet/')) {
        const dietId = item.link.replace('/diet/', '');
        navigate(`/diet/${dietId}`);
      } else if (item.link.startsWith('/page/')) {
        const page = item.link.replace('/page/', '');
        navigate(`/${page}`);
      } else {
        navigate(item.link);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {homePageItems.map((item) => (
          <Card 
            key={item.id} 
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
              item.link ? 'hover:scale-105' : ''
            }`}
            onClick={() => handleItemClick(item)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getIcon(item.icon)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </div>
              </div>
              
              {item.showProgress && item.progress && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Progress</span>
                    <span className="text-sm font-medium">{item.progress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {item.type}
                </Badge>
                {item.link && (
                  <Button size="sm" variant="ghost">
                    <Play className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EditableDietPlanDashboard;