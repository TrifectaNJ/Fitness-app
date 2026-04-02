import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Dumbbell } from 'lucide-react';

export const PersonalizedWorkoutProgramsTab: React.FC = () => {
  const [programs] = useState([]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personalized Workout Programs</h2>
          <p className="text-gray-600 mt-1">Create and manage custom workout plans for users</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Program
        </Button>
      </div>

      {/* Empty State */}
      <Card className="text-center py-12">
        <CardContent className="space-y-4">
          <Dumbbell className="w-16 h-16 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No personalized programs yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first personalized workout program to get started
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Program
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};