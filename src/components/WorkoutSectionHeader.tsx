import React from 'react';
import { Badge } from '@/components/ui/badge';

interface WorkoutSectionHeaderProps {
  title: string;
  exerciseCount: number;
  repeatCount?: number;
  sectionKey: string;
}

const WorkoutSectionHeader: React.FC<WorkoutSectionHeaderProps> = ({
  title,
  exerciseCount,
  repeatCount,
  sectionKey
}) => {
  const getSectionColor = (key: string) => {
    switch (key) {
      case 'warmup': return 'text-orange-600 bg-orange-50';
      case 'main': return 'text-blue-600 bg-blue-50';
      case 'cooldown': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSectionEmoji = (key: string) => {
    switch (key) {
      case 'warmup': return '🔥';
      case 'main': return '💪';
      case 'cooldown': return '🧘';
      default: return '⚡';
    }
  };

  return (
    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getSectionEmoji(sectionKey)}</span>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {title.toUpperCase()}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant="secondary" 
              className={`text-xs font-medium ${getSectionColor(sectionKey)}`}
            >
              {exerciseCount} EXERCISE{exerciseCount !== 1 ? 'S' : ''}
            </Badge>
            {repeatCount && repeatCount > 1 && (
              <Badge variant="outline" className="text-xs">
                REPEAT {repeatCount}X
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSectionHeader;