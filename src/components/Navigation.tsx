import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, User, Crown } from 'lucide-react';

interface NavigationProps {
  isAdmin: boolean;
  onToggleMode: (isAdmin: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ isAdmin, onToggleMode }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              FitnessPro
            </h1>
          </div>
          
          {isAdmin && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <Label htmlFor="admin-mode" className="text-sm font-medium">
              {isAdmin ? 'Admin Mode' : 'User Mode'}
            </Label>
            <Switch
              id="admin-mode"
              checked={isAdmin}
              onCheckedChange={onToggleMode}
            />
            <Settings className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;