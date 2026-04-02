import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Save, Upload, User, Mail, Target, FileText, Camera, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
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


interface EnhancedUserProfileProps {
  user: any;
  userProfile: any;
  onBack: () => void;
  onProfileUpdate: () => void;
}

const EnhancedUserProfile: React.FC<EnhancedUserProfileProps> = ({
  user,
  userProfile,
  onBack,
  onProfileUpdate,
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    fitness_goals: '',
    avatar_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);


  useEffect(() => {
    loadProfile();
  }, [user, userProfile]);

  const loadProfile = () => {
    const data = {
      first_name: userProfile?.first_name || '',
      last_name: userProfile?.last_name || '',
      email: user?.email || '',
      bio: userProfile?.bio || '',
      fitness_goals: userProfile?.fitness_goals || '',
      avatar_url: userProfile?.avatar_url || '',
    };
    setFormData(data);
    setPreviewUrl(data.avatar_url);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (formData.bio.length > 500) newErrors.bio = 'Bio must be under 500 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setFormData({ ...formData, avatar_url: publicUrl });
      setPreviewUrl(publicUrl);
      toast({ title: 'Success', description: 'Photo uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        id: user.id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        bio: formData.bio,
        fitness_goals: formData.fitness_goals,
        avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Profile updated successfully' });
      onProfileUpdate();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    return `${formData.first_name.charAt(0)}${formData.last_name.charAt(0)}`.toUpperCase();
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack} className="border-orange-500 text-orange-600 hover:bg-orange-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Profile</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Edit Form */}
          <Card className="shadow-lg border-orange-100">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 border-4 border-orange-500">
                  <AvatarImage src={previewUrl} />
                  <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl">
                    {getInitials() || <User />}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="photo-upload">
                  <Button type="button" variant="outline" disabled={uploading} className="cursor-pointer border-orange-500 text-orange-600 hover:bg-orange-50" onClick={() => document.getElementById('photo-upload')?.click()}>
                    <Camera className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Change Photo'}
                  </Button>
                </label>
                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className={errors.first_name ? 'border-red-500' : 'focus:border-orange-500'} />
                  {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input id="last_name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className={errors.last_name ? 'border-red-500' : 'focus:border-orange-500'} />
                  {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input id="email" type="email" value={formData.email} disabled className="bg-gray-100" />
              </div>

              {/* Fitness Goals */}
              <div>
                <Label htmlFor="fitness_goals" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Fitness Goals
                </Label>
                <Input id="fitness_goals" value={formData.fitness_goals} onChange={(e) => setFormData({ ...formData, fitness_goals: e.target.value })} placeholder="e.g., Lose 10 lbs, Build muscle, Run 5K" className="focus:border-orange-500" />
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Bio ({formData.bio.length}/500)
                </Label>
                <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell us about yourself..." rows={4} className={errors.bio ? 'border-red-500' : 'focus:border-orange-500'} />
                {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
              </div>

              <Button onClick={handleSave} disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="shadow-lg border-orange-100">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-black text-white">
              <CardTitle>Profile Preview</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="w-32 h-32 border-4 border-orange-500">
                  <AvatarImage src={previewUrl} />
                  <AvatarFallback className="bg-orange-100 text-orange-600 text-3xl">
                    {getInitials() || <User />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {formData.first_name} {formData.last_name}
                  </h2>
                  <p className="text-gray-600">{formData.email}</p>
                </div>
                {formData.fitness_goals && (
                  <div className="w-full bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 text-orange-600 font-semibold mb-2">
                      <Target className="w-5 h-5" />
                      Fitness Goals
                    </div>
                    <p className="text-gray-700">{formData.fitness_goals}</p>
                  </div>
                )}
                {formData.bio && (
                  <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                      <FileText className="w-5 h-5" />
                      About Me
                    </div>
                    <p className="text-gray-600 text-sm">{formData.bio}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Account Section */}
        <Card className="mt-8 shadow-lg border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white">
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
    </div>
  );
};

export default EnhancedUserProfile;
