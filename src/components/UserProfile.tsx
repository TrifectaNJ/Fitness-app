import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import StyleableComponent from '@/components/StyleableComponent';
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


interface UserProfileProps {
  user: any;
  userProfile: any;
  onBack: () => void;
  onProfileUpdate: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  userProfile,
  onBack,
  onProfileUpdate,
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    loadProfile();
    loadCustomFields();
  }, [user, userProfile]);

  const loadProfile = () => {
    setFormData({
      first_name: userProfile?.first_name || user?.user_metadata?.first_name || '',
      last_name: userProfile?.last_name || user?.user_metadata?.last_name || '',
      email: user?.email || '',
    });
  };

  const loadCustomFields = async () => {
    try {
      const { data: fields } = await supabase
        .from('profile_custom_fields')
        .select('*')
        .order('created_at');
      
      if (fields) {
        setCustomFields(fields);
        
        const { data: values } = await supabase
          .from('user_custom_field_values')
          .select('*')
          .eq('user_id', user.id);
        
        if (values) {
          const valuesMap: Record<string, string> = {};
          values.forEach(v => {
            valuesMap[v.field_id] = v.value;
          });
          setCustomFieldValues(valuesMap);
        }
      }
    } catch (error) {
      console.error('Error loading custom fields:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      for (const [fieldId, value] of Object.entries(customFieldValues)) {
        if (value.trim()) {
          await supabase
            .from('user_custom_field_values')
            .upsert({
              user_id: user.id,
              field_id: fieldId,
              value: value,
              updated_at: new Date().toISOString(),
            });
        }
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
      
      onProfileUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to save profile: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        body: { userId: user.id },
      });

      if (error) throw error;

      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });

      // Sign out after deletion
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to delete account: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <BackgroundWrapper page="profilePage">
      <StyleableComponent pageKey="profile">
        <div className="p-6">

            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold">My Profile</h1>
            </div>

            <Card className="bg-white/90 backdrop-blur-sm mb-4">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                  />
                </div>

                {customFields.map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{field.title}</Label>
                    {field.description && (
                      <p className="text-sm text-gray-600 mb-2">{field.description}</p>
                    )}
                    {field.field_type === 'textarea' ? (
                      <Textarea
                        id={field.id}
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => setCustomFieldValues({
                          ...customFieldValues,
                          [field.id]: e.target.value
                        })}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => setCustomFieldValues({
                          ...customFieldValues,
                          [field.id]: e.target.value
                        })}
                      />
                    )}
                  </div>
                ))}

                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>

            {/* Delete Account Section */}
            <Card className="bg-white/90 backdrop-blur-sm border-red-200">
              <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white shrink-0"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Delete Account Confirmation Dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <AlertDialogTitle className="text-xl">Delete Account</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription className="text-gray-600 text-base leading-relaxed">
                    Are you sure you want to delete your account? All history and data will be lost. This action is permanent and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3 sm:gap-3">
                  <AlertDialogCancel
                    disabled={deleting}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleting ? 'Deleting...' : 'Confirm'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </StyleableComponent>
    </BackgroundWrapper>
  );
};

export default UserProfile;
