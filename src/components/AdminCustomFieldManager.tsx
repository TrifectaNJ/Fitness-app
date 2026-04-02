import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const AdminCustomFieldManager: React.FC = () => {
  const [fields, setFields] = useState<any[]>([]);
  const [newField, setNewField] = useState({
    title: '',
    field_type: 'text',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_custom_fields')
        .select('*')
        .order('created_at');
      
      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error('Error loading fields:', error);
    }
  };

  const handleAddField = async () => {
    if (!newField.title.trim()) {
      toast({
        title: 'Error',
        description: 'Field title is required.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profile_custom_fields')
        .insert([newField]);
      
      if (error) throw error;
      
      setNewField({ title: '', field_type: 'text', description: '' });
      loadFields();
      
      toast({
        title: 'Success',
        description: 'Custom field added successfully.',
      });
    } catch (error) {
      console.error('Error adding field:', error);
      toast({
        title: 'Error',
        description: 'Failed to add custom field.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('profile_custom_fields')
        .delete()
        .eq('id', fieldId);
      
      if (error) throw error;
      
      loadFields();
      toast({
        title: 'Success',
        description: 'Custom field deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete custom field.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Custom Field</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Field Title</Label>
            <Input
              id="title"
              value={newField.title}
              onChange={(e) => setNewField({ ...newField, title: e.target.value })}
              placeholder="Enter field title"
            />
          </div>
          
          <div>
            <Label htmlFor="field_type">Field Type</Label>
            <Select
              value={newField.field_type}
              onValueChange={(value) => setNewField({ ...newField, field_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={newField.description}
              onChange={(e) => setNewField({ ...newField, description: e.target.value })}
              placeholder="Enter field description"
              rows={2}
            />
          </div>
          
          <Button
            onClick={handleAddField}
            disabled={loading}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {loading ? 'Adding...' : 'Add Field'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Custom Fields</CardTitle>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No custom fields created yet.</p>
          ) : (
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{field.title}</h4>
                    <p className="text-sm text-gray-500">
                      Type: {field.field_type === 'textarea' ? 'Text Area' : 'Text Input'}
                    </p>
                    {field.description && (
                      <p className="text-sm text-gray-600 mt-1">{field.description}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteField(field.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomFieldManager;