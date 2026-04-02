import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

interface DietPlanCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  progress?: string;
  showProgress?: boolean;
  onClick?: () => void;
}

const DietPlanCard: React.FC<DietPlanCardProps> = ({
  title,
  description,
  icon,
  progress,
  showProgress = false,
  onClick
}) => {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="flex items-center p-4">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
            {showProgress && progress && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{progress}</p>
              </div>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </CardContent>
    </Card>
  );
};

export default DietPlanCard;