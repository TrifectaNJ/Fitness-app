import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { HomePageItem } from '@/contexts/HomePageContext';
import {
  Dumbbell, Camera, Scale, Activity, Droplets, Heart, Target,
  Droplets as Water, Footprints, Flame, ChevronRight, Award, TrendingUp, Zap
} from 'lucide-react';

interface HomePagePreviewProps {
  homePageItems: HomePageItem[];
}

const getIcon = (iconName: string) => {
  const cls = 'w-5 h-5';
  switch (iconName) {
    case 'dumbbell':  return <Dumbbell className={cls} />;
    case 'camera':    return <Camera className={cls} />;
    case 'scale':     return <Scale className={cls} />;
    case 'activity':  return <Activity className={cls} />;
    case 'droplets':  return <Droplets className={cls} />;
    case 'heart':     return <Heart className={cls} />;
    case 'target':    return <Target className={cls} />;
    default:          return <Dumbbell className={cls} />;
  }
};

const getLinkLabel = (item: HomePageItem) => {
  if (item.link?.startsWith('/tracker/')) return `Opens: ${item.link.replace('/tracker/', '')}`;
  if (item.programId) return 'Opens: Program';
  if (item.coachProgramId) return 'Opens: Coach Program';
  if (item.link?.startsWith('/page/')) return `Opens: ${item.link.replace('/page/', '')}`;
  if (item.link?.startsWith('http')) return 'Opens: External link';
  return null;
};

const HomePagePreview: React.FC<HomePagePreviewProps> = ({ homePageItems }) => {
  const sorted = [...homePageItems].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
        <Zap className="w-4 h-4 shrink-0" />
        This preview mirrors the actual user home screen layout. Sections marked "Fixed" are always shown and cannot be configured here.
      </div>

      {/* Simulated phone frame */}
      <div className="max-w-sm mx-auto border-2 border-gray-300 rounded-3xl overflow-hidden shadow-xl bg-gray-50">
        <div className="bg-gray-800 h-6 flex items-center justify-center">
          <div className="w-16 h-1.5 bg-gray-600 rounded-full" />
        </div>

        <div className="overflow-y-auto max-h-[640px] space-y-4 p-4 bg-gray-50">

          {/* Banner — always shown, not configurable */}
          <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <div className="text-sm font-semibold opacity-60 mb-1">FIXED — Welcome Banner</div>
            <h2 className="text-lg font-bold">Welcome Back!</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs">
                <Award className="w-3 h-3" /> 0 Day Streak
              </div>
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs">
                <Target className="w-3 h-3" /> 0 Days Completed
              </div>
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs">
                <TrendingUp className="w-3 h-3" /> 0% Progress
              </div>
            </div>
          </div>

          {/* Tracker cards — always shown, not configurable */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">FIXED — Track Your Progress</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Water', icon: <Water className="w-4 h-4 text-blue-500" />, color: 'bg-blue-50' },
                { label: 'Weight', icon: <Scale className="w-4 h-4 text-purple-500" />, color: 'bg-purple-50' },
                { label: 'Steps', icon: <Footprints className="w-4 h-4 text-green-500" />, color: 'bg-green-50' },
                { label: 'Calories', icon: <Flame className="w-4 h-4 text-orange-500" />, color: 'bg-orange-50' },
              ].map(t => (
                <div key={t.label} className={`${t.color} rounded-xl p-3 flex items-center gap-2`}>
                  {t.icon}
                  <span className="text-xs font-medium text-gray-700">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Workout history — always shown, not configurable */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">FIXED — Workout History</p>
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">View Workout History</p>
                  <p className="text-xs text-gray-500">See all completed workouts</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Configured items — "My Plan" section */}
          {sorted.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">CONFIGURED — My Plan</p>
              <div className="grid grid-cols-1 gap-2">
                {sorted.map((item) => {
                  const linkLabel = getLinkLabel(item);
                  return (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                          {getIcon(item.icon)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.title || 'Untitled'}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                          {linkLabel && <p className="text-xs text-indigo-500 mt-0.5">{linkLabel}</p>}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sorted.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">
              No items configured yet. Add items in the Editor tab.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePagePreview;
