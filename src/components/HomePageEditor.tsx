import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, Link } from 'lucide-react';
import { LinkSelectorSimple } from './LinkSelectorSimple';
import { useToast } from '@/hooks/use-toast';

interface HomePageItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'plan' | 'activity' | 'tracking';
  progress?: string;
  showProgress?: boolean;
  order: number;
  link?: string;
  programId?: string; // Direct reference to program ID
  coachProgramId?: string; // Direct reference to coach program ID
}

interface HomePageEditorProps {
  items: HomePageItem[];
  onUpdateItems: (items: HomePageItem[]) => Promise<void>;
}

const HomePageEditor: React.FC<HomePageEditorProps> = ({ items, onUpdateItems }) => {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<HomePageItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const iconOptions = [
    { value: 'dumbbell', label: 'Dumbbell' },
    { value: 'camera', label: 'Camera' },
    { value: 'scale', label: 'Scale' },
    { value: 'activity', label: 'Activity' },
    { value: 'droplets', label: 'Droplets' },
    { value: 'heart', label: 'Heart' },
    { value: 'target', label: 'Target' }
  ];

  const handleSaveItem = async () => {
    if (!editingItem) return;
    
    console.log('HomePageEditor: handleSaveItem called with:', editingItem);
    setIsSaving(true);
    try {
      const updatedItems = editingItem.id === 'new' 
        ? [...items, { ...editingItem, id: Date.now().toString() }]
        : items.map(item => item.id === editingItem.id ? editingItem : item);
      
      console.log('HomePageEditor: Calling onUpdateItems with:', updatedItems);
      await onUpdateItems(updatedItems);
      console.log('HomePageEditor: onUpdateItems completed successfully');
      
      toast({
        title: "Item Saved",
        description: "Home page item has been saved successfully.",
      });
      
      setEditingItem(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('HomePageEditor: Error saving item:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save home page item.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    console.log('HomePageEditor: handleDeleteItem called with id:', id);
    setIsSaving(true);
    try {
      const updatedItems = items.filter(item => item.id !== id);
      console.log('HomePageEditor: Calling onUpdateItems for delete with:', updatedItems);
      await onUpdateItems(updatedItems);
      console.log('HomePageEditor: Delete onUpdateItems completed successfully');
      
      toast({
        title: "Item Deleted",
        description: "Home page item has been deleted successfully.",
      });
    } catch (error) {
      console.error('HomePageEditor: Error deleting item:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete home page item.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNew = () => {
    console.log('HomePageEditor: handleAddNew called');
    setEditingItem({
      id: 'new',
      title: '',
      description: '',
      icon: 'dumbbell',
      type: 'plan',
      order: items.length,
      link: ''
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Home Page Items
          <Button onClick={handleAddNew} size="sm" disabled={isSaving}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <span>Type: {item.type} | Icon: {item.icon}</span>
                  {item.link && (
                    <span className="flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      Linked
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('HomePageEditor: Edit button clicked for item:', item);
                    setEditingItem(item);
                    setIsDialogOpen(true);
                  }}
                  disabled={isSaving}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={isSaving}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem?.id === 'new' ? 'Add New Item' : 'Edit Item'}
              </DialogTitle>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={editingItem.icon}
                    onValueChange={(value) => setEditingItem({...editingItem, icon: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={editingItem.type}
                    onValueChange={(value: 'plan' | 'activity' | 'tracking') => 
                      setEditingItem({...editingItem, type: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plan">Plan</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                      <SelectItem value="tracking">Tracking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <LinkSelectorSimple
                  value={editingItem.link || ''}
                  programId={editingItem.programId} // Pass programId prop
                  coachProgramId={editingItem.coachProgramId} // Pass coachProgramId prop
                  onChange={(link) => {
                    console.log('HomePageEditor: Link changed to:', link);
                    setEditingItem({...editingItem, link});
                  }}
                  onProgramChange={(programId) => {
                    console.log('HomePageEditor: Program ID changed to:', programId);
                    setEditingItem({...editingItem, programId: programId || undefined});
                  }}
                  onCoachProgramChange={(coachProgramId) => {
                    console.log('HomePageEditor: Coach Program ID changed to:', coachProgramId);
                    setEditingItem({...editingItem, coachProgramId: coachProgramId || undefined});
                  }}
                />
                <Button onClick={handleSaveItem} className="w-full" disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Item'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default HomePageEditor;