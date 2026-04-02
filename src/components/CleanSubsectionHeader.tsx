import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CleanSubsectionHeaderProps {
  title: string;
  instruction?: string;
  showIcon?: boolean;
  icon?: React.ReactNode;
  hasImageContent?: boolean;
}

export const CleanSubsectionHeader: React.FC<CleanSubsectionHeaderProps> = ({
  title,
  instruction,
  showIcon = false,
  icon,
  hasImageContent = false
}) => {
  return (
    <div className="py-5 px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          {showIcon && icon && (
            <div className="text-slate-600 text-xl flex-shrink-0">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-slate-800 tracking-tight leading-tight">
            {title}
          </h3>
        </div>
        

      </div>
      
      <div className="mt-4 h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>
    </div>
  );
};

export default CleanSubsectionHeader;