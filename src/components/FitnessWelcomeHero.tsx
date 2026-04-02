import React from 'react';
import { ChevronLeft, Bell } from 'lucide-react';

interface FitnessWelcomeHeroProps {
  currentDate: Date;
  formatDate: (date: Date) => string;
}

export const FitnessWelcomeHero: React.FC<FitnessWelcomeHeroProps> = ({ currentDate, formatDate }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fitness at Home</h2>
            <p className="text-sm text-gray-500">{formatDate(currentDate)}</p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors">
          <Bell className="w-5 h-5 text-orange-600" />
        </button>
      </div>
    </div>
  );
};
