import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, Heart, Calculator } from 'lucide-react';

interface MobileBottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  activeTab, onTabChange
}) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'personal-path', icon: Heart, label: 'Diet' },
    { id: 'calculator', icon: Calculator, label: 'Calorie Calculator' },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden shadow-lg"
      style={{ paddingBottom: '32px' }}
    >
      <div className="flex items-center px-0 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button key={tab.id} variant="ghost" size="sm" onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-1 py-3 rounded-lg transition-all h-auto ${
                isActive ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
              }`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight text-center whitespace-nowrap">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>

  );
};

export default MobileBottomNavigation;
