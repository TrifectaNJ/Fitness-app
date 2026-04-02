import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, Upload, X, Save } from 'lucide-react';
import { MediaUpload } from '@/components/MediaUpload';
import { useDesign } from '@/contexts/DesignContext';

interface BackgroundImageSettings {
  homepage?: string;
  dietPage?: string;
  programPage?: string;
  loginPage?: string;
  profilePage?: string;
}

interface BackgroundImageManagerProps {
  settings: BackgroundImageSettings;
  onUpdate: (settings: BackgroundImageSettings) => void;
  onSave: () => void;
}

const BackgroundImageManager: React.FC<BackgroundImageManagerProps> = ({
  settings,
  onUpdate,
  onSave
}) => {
  const [selectedPage, setSelectedPage] = useState<string>('loginPage');
  const [showUpload, setShowUpload] = useState(false);
  const [localSettings, setLocalSettings] = useState<BackgroundImageSettings>(settings);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { saveSettings, updateBackgroundImages, settings: contextSettings, refreshSettings } = useDesign();

  // Sync with context settings
  useEffect(() => {
    if (contextSettings.backgroundImages) {
      setLocalSettings(contextSettings.backgroundImages);
    }
  }, [contextSettings.backgroundImages]);

  const pages = [
    { value: 'homepage', label: 'Homepage' },
    { value: 'dietPage', label: 'Diet Page' },
    { value: 'programPage', label: 'Program Page' },
    { value: 'loginPage', label: 'Login Page' },
    { value: 'profilePage', label: 'Profile Page' }
  ];

  const handleImageUpload = async (url: string) => {
    setIsSaving(true);
    try {
      console.log('=== BACKGROUND IMAGE UPLOAD START ===');
      console.log('Selected page:', selectedPage);
      console.log('Image URL:', url);
      console.log('Current local settings:', localSettings);
      
      setUploadError(null);
      
      if (!url || url.trim() === '') {
        throw new Error('Invalid image URL received from upload');
      }
      
      const newSettings = {
        ...localSettings,
        [selectedPage]: url
      };
      
      console.log('New settings object:', newSettings);
      
      // Update context first
      updateBackgroundImages(newSettings);
      
      // Wait a moment for context to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Attempting to save to Supabase...');
      await saveSettings();
      console.log('✅ Background image saved successfully!');
      
      // Refresh to verify save
      await refreshSettings();
      
      // Update local state and parent
      setLocalSettings(newSettings);
      onUpdate(newSettings);
      
      setShowUpload(false);
      console.log('=== BACKGROUND IMAGE UPLOAD END ===');
    } catch (error: any) {
      console.error('❌ Failed to save background image:', error);
      let errorMsg = 'Failed to save background image';
      
      if (error.message) {
        if (error.message.includes('row-level security')) {
          errorMsg = 'Permission denied: Unable to save background image. Please check your access rights.';
        } else {
          errorMsg = error.message;
        }
      }
      
      setUploadError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const removeImage = async (page: string) => {
    setIsSaving(true);
    try {
      console.log('=== REMOVING BACKGROUND IMAGE ===');
      console.log('Page:', page);
      
      setUploadError(null);
      
      const newSettings = { ...localSettings };
      delete newSettings[page as keyof BackgroundImageSettings];
      
      console.log('Settings after removal:', newSettings);
      
      updateBackgroundImages(newSettings);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await saveSettings();
      await refreshSettings();
      
      setLocalSettings(newSettings);
      onUpdate(newSettings);
      
      console.log('✅ Background image removal saved');
    } catch (error: any) {
      console.error('❌ Failed to save removal:', error);
      setUploadError(error.message || 'Failed to remove background image');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      console.log('=== MANUAL SAVE TRIGGERED ===');
      console.log('Current local settings:', localSettings);
      
      setUploadError(null);
      
      updateBackgroundImages(localSettings);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await saveSettings();
      await refreshSettings();
      
      console.log('✅ Manual save completed');
      onSave();
    } catch (error: any) {
      console.error('❌ Manual save failed:', error);
      setUploadError(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const currentImage = localSettings[selectedPage as keyof BackgroundImageSettings];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          Background Images
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">Error:</p>
            <p className="text-sm text-red-600">{uploadError}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label>Select Page</Label>
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page.value} value={page.value}>
                  {page.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Current Background</Label>
          {currentImage ? (
            <div className="relative">
              <img
                src={currentImage}
                alt={`${selectedPage} background`}
                className="w-full h-32 object-cover rounded border"
                onError={(e) => {
                  console.error('Failed to load image:', currentImage);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => removeImage(selectedPage)}
                disabled={isSaving}
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="mt-2 text-xs text-gray-500 break-all">
                URL: {currentImage}
              </div>
            </div>
          ) : (
            <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500">
              No background image set for {pages.find(p => p.value === selectedPage)?.label}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowUpload(true)}
            className="flex-1"
            disabled={isSaving}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Upload New Image'}
          </Button>
          <Button onClick={handleManualSave} variant="outline" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save All
          </Button>
        </div>

        {showUpload && (
          <MediaUpload
            onUpload={handleImageUpload}
            onCancel={() => {
              setShowUpload(false);
              setUploadError(null);
            }}
            accept="image/*"
            type="image"
            bucketName="design-assets"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BackgroundImageManager;