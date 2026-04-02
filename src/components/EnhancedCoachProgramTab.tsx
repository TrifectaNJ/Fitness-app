import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Users, Calendar, BarChart3, Target, Clock } from 'lucide-react';
import { CoachProgramBuilderOptimized } from './CoachProgramBuilderOptimized';
import { CoachProgramOverview } from './CoachProgramOverview';
import { CoachProgramAssignmentsList } from './CoachProgramAssignmentsList';
import { useRolePermissions } from '@/hooks/useRolePermissions';
export const EnhancedCoachProgramTab: React.FC = () => {
  const { permissions, loading } = useRolePermissions();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleCreateNew = () => {
    setShowCreateDialog(true);
  };

  const handleProgramCreated = () => {
    setShowCreateDialog(false);
    setActiveTab('assignments');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!permissions.canViewPersonalizedPrograms) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Access denied. Coach permissions required.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Coach Programs
          </h1>
          <p className="text-gray-600 mt-1">Create and manage personalized workout programs</p>
        </div>
        <Button 
          onClick={handleCreateNew} 
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Program
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <Calendar className="w-4 h-4 mr-2" />
            Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CoachProgramOverview onCreateNew={handleCreateNew} />
        </TabsContent>

        <TabsContent value="assignments">
          <CoachProgramAssignmentsList onCreateNew={handleCreateNew} />
        </TabsContent>


      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Personalized Program</DialogTitle>
          </DialogHeader>
          <CoachProgramBuilderOptimized onSuccess={handleProgramCreated} />
        </DialogContent>
      </Dialog>
    </div>
  );
};