import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHomePage } from '@/contexts/HomePageContext';
import HomePageEditor from './HomePageEditor';
import WorkoutHistoryTracker from './WorkoutHistoryTracker';
import EditableDietPlanDashboard from './EditableDietPlanDashboard';
import { Eye, Edit, Save, RotateCcw, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminHomePageManager: React.FC = () => {
  const { toast } = useToast();
  const { 
    homePageItems, 
    updateHomePageItems, 
    resetToDefaults, 
    saveToDatabase, 
    loadFromDatabase,
    isUpdating
  } = useHomePage();
  const [activeTab, setActiveTab] = useState('editor');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFromDatabase();
  }, []);

  const handleSaveChanges = async () => {
    console.log('AdminHomePageManager: handleSaveChanges called');
    setIsLoading(true);
    try {
      console.log('AdminHomePageManager: Calling saveToDatabase...');
      await saveToDatabase();
      console.log('AdminHomePageManager: saveToDatabase completed successfully');
      toast({
        title: "Changes Saved",
        description: "Home page items have been saved to database successfully.",
      });
    } catch (error) {
      console.error('AdminHomePageManager: Error saving changes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes to database.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChanges = async () => {
    console.log('AdminHomePageManager: handleResetChanges called');
    try {
      resetToDefaults();
      console.log('AdminHomePageManager: Calling saveToDatabase after reset...');
      await saveToDatabase();
      console.log('AdminHomePageManager: Reset and save completed successfully');
      toast({
        title: "Changes Reset",
        description: "Home page items have been reset to defaults and saved.",
      });
    } catch (error) {
      console.error('AdminHomePageManager: Error resetting changes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset and save changes.",
        variant: "destructive"
      });
    }
  };

  const handleLoadFromDatabase = async () => {
    console.log('AdminHomePageManager: handleLoadFromDatabase called');
    setIsLoading(true);
    try {
      console.log('AdminHomePageManager: Calling loadFromDatabase...');
      await loadFromDatabase();
      console.log('AdminHomePageManager: loadFromDatabase completed successfully');
      toast({
        title: "Data Loaded",
        description: "Home page items loaded from database.",
      });
    } catch (error) {
      console.error('AdminHomePageManager: Error loading from database:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load data from database.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItems = async (items) => {
    console.log('AdminHomePageManager: handleUpdateItems called with:', items);
    try {
      console.log('AdminHomePageManager: Calling updateHomePageItems...');
      await updateHomePageItems(items);
      console.log('AdminHomePageManager: updateHomePageItems completed successfully');
      toast({
        title: "Items Updated",
        description: "Home page items have been updated and saved.",
      });
    } catch (error) {
      console.error('AdminHomePageManager: Error updating items:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update home page items.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Home Page Manager</h2>
          <p className="text-gray-600">Edit and customize the home page features with linking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleLoadFromDatabase}
            disabled={isLoading || isUpdating}
          >
            <Database className="w-4 h-4 mr-2" />
            Load
          </Button>
          <Button 
            variant="outline" 
            onClick={handleResetChanges}
            disabled={isLoading || isUpdating}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={handleSaveChanges} 
            className="bg-green-600 hover:bg-green-700"
            disabled={isLoading || isUpdating}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading || isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">
            <Database className="w-4 h-4 mr-2" />
            Workout History
          </TabsTrigger>
          <TabsTrigger value="editor">
            <Edit className="w-4 h-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Workout History & Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkoutHistoryTracker />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="editor">
          <HomePageEditor items={homePageItems} onUpdateItems={handleUpdateItems} />
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <EditableDietPlanDashboard homePageItems={homePageItems} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminHomePageManager;