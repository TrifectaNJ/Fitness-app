import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, GraduationCap } from 'lucide-react';

const CoachProgramsTest: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Coach Programs Test
          </h1>
          <p className="text-gray-600 mt-1">Testing Coach Programs functionality</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
          <Plus className="w-4 h-4 mr-2" />
          Test Button
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Test Status</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Working!</div>
          <p className="text-xs text-muted-foreground">
            Coach Programs tab is loading correctly
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GraduationCap className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Coach Programs Tab is Working
          </h3>
          <p className="text-gray-500 text-center mb-4">
            If you can see this, the routing is working correctly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachProgramsTest;