import React from 'react';
import { ChevronRight, Activity, Dumbbell } from 'lucide-react';

interface ModernPlanCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  iconBgColor: string;
  onClick: () => void;
}

export const ModernPlanCard: React.FC<ModernPlanCardProps> = ({
  icon,
  title,
  subtitle,
  iconBgColor,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
};
