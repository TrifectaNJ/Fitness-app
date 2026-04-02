import React from 'react';

interface ProfessionalSubsectionHeaderProps {
  title: string;
  exerciseCount?: number;
  isCompleted?: boolean;
}

export const ProfessionalSubsectionHeader: React.FC<ProfessionalSubsectionHeaderProps> = ({
  title,
  exerciseCount,
  isCompleted = false
}) => {
  return (
    <div className="relative mb-4">
      {/* Main header container */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left side - Title and status */}
          <div className="flex items-center space-x-3">
            {/* Status indicator */}
            <div className={`w-3 h-3 rounded-full ${
              isCompleted 
                ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                : 'bg-blue-500 shadow-lg shadow-blue-500/30'
            }`} />
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-800 tracking-wide">
              {title}
            </h3>
          </div>
          
          {/* Right side - Exercise count */}
          {exerciseCount && (
            <div className="flex items-center space-x-2">
              <div className="bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-blue-200/30">
                <span className="text-sm font-medium text-blue-700">
                  {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Decorative bottom border */}
        <div className="mt-3 h-0.5 bg-gradient-to-r from-blue-300 via-indigo-300 to-blue-300 rounded-full opacity-60" />
      </div>
      
      {/* Subtle shadow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-indigo-100/20 rounded-xl blur-sm -z-10 transform translate-y-1" />
    </div>
  );
};

export default ProfessionalSubsectionHeader;