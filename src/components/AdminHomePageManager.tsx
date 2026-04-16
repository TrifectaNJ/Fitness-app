import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useHomePage } from '@/contexts/HomePageContext';
import HomePageEditor from './HomePageEditor';
import HomePagePreview from './HomePagePreview';
import { Eye, Edit, Save, RotateCcw, RefreshCw } from 'lucide-react';
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadFromDatabase();
  }, []);

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      await saveToDatabase();
      toast({ title: "Changes Saved", description: "Home page saved successfully." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChanges = async () => {
    try {
      resetToDefaults();
      await saveToDatabase();
      toast({ title: "Reset Complete", description: "Home page reset to defaults." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset.",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await loadFromDatabase();
      toast({ title: "Refreshed", description: "Home page items reloaded from database." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItems = async (items) => {
    try {
      await updateHomePageItems(items);
      toast({ title: "Saved", description: "Home page items updated." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update items.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Home Page Manager</h2>
          <p className="text-gray-600">Edit and customize the home page items and links</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading || isUpdating}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowResetConfirm(true)}
            disabled={isLoading || isUpdating}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">
            <Edit className="w-4 h-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <HomePageEditor items={homePageItems} onUpdateItems={handleUpdateItems} />
        </TabsContent>

        <TabsContent value="preview">
          <HomePagePreview homePageItems={homePageItems} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all current home page items with the defaults and save immediately.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { setShowResetConfirm(false); handleResetChanges(); }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHomePageManager;