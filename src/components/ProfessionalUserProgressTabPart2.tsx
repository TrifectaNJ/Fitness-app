import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, RefreshCw, Droplets, Weight, Footprints, Flame, Dumbbell } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  value: string;
  target: string;
  progress: number;
  onClick: () => void;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title, icon: Icon, color, value, target, progress, onClick
}) => {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-500',
    purple: 'text-purple-500 bg-purple-500', 
    green: 'text-green-500 bg-green-500',
    orange: 'text-orange-500 bg-orange-500'
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 bg-white rounded-xl border-0 shadow-md"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-sm font-semibold text-gray-700">
          <div className={`p-2 rounded-lg bg-${color}-50`}>
            <Icon className={`w-4 h-4 ${colorClasses[color as keyof typeof colorClasses]?.split(' ')[0] || 'text-gray-500'}`} />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            <span className="text-sm text-gray-500">/ {target}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${colorClasses[color as keyof typeof colorClasses]?.split(' ')[1] || 'bg-gray-400'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">{progress}% of goal</span>
            <div className="w-16 h-8 bg-gray-50 rounded flex items-center justify-center">
              <div className="w-12 h-1 bg-gray-200 rounded">
                <div className={`h-1 rounded ${colorClasses[color as keyof typeof colorClasses]?.split(' ')[1] || 'bg-gray-400'}`} style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};