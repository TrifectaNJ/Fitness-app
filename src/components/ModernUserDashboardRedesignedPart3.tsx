import React from 'react';
import { Award, Target, TrendingUp, Flame } from 'lucide-react';

interface WelcomeHeroProps {
  currentDate: Date;
  formatDate: (date: Date) => string;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({ currentDate, formatDate }) => {
  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/20"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Welcome Back!</h2>
            <p className="text-gray-300 text-sm md:text-base">{formatDate(currentDate)}</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-orange-500/30 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Flame className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-5 py-2.5 border border-white/20">
            <Award className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-bold">7 Day Streak</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-5 py-2.5 border border-white/20">
            <Target className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-bold">3 Goals Completed</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-5 py-2.5 border border-white/20">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-bold">85% Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};
