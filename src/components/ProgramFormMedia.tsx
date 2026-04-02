import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MediaUpload } from './MediaUpload';
import { Image, Video } from 'lucide-react';

interface ProgramFormMediaProps {
  formData: {
    imageUrl: string;
    videoUrl: string;
  };
  onMediaUpload: (url: string, type: 'image' | 'video') => void;
  setFormData: (updater: (prev: any) => any) => void;
}

export const ProgramFormMedia: React.FC<ProgramFormMediaProps> = ({ 
  formData, onMediaUpload, setFormData 
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Program Media</h3>
        <p className="text-sm text-gray-600">
          Add images and videos to showcase your fitness program
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            <Label className="text-base font-medium">Program Image</Label>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="Enter image URL or upload below"
            />
          </div>
          
          <div className="border-t pt-4">
            <MediaUpload
              type="image"
              onUpload={onMediaUpload}
              existingUrl={formData.imageUrl}
            />
          </div>
          
          {formData.imageUrl && (
            <div className="mt-4">
              <Label className="text-sm font-medium">Preview:</Label>
              <div className="mt-2 border rounded-lg overflow-hidden">
                <img 
                  src={formData.imageUrl} 
                  alt="Program preview" 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            <Label className="text-base font-medium">Program Video</Label>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, videoUrl: e.target.value }))}
              placeholder="Enter video URL or upload below"
            />
          </div>
          
          <div className="border-t pt-4">
            <MediaUpload
              type="video"
              onUpload={onMediaUpload}
              existingUrl={formData.videoUrl}
            />
          </div>
          
          {formData.videoUrl && (
            <div className="mt-4">
              <Label className="text-sm font-medium">Preview:</Label>
              <div className="mt-2 border rounded-lg overflow-hidden">
                <video 
                  src={formData.videoUrl} 
                  className="w-full h-48 object-cover"
                  controls
                  onError={(e) => {
                    (e.target as HTMLVideoElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Media Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use high-quality images (1200x800px or larger recommended)</li>
          <li>• Videos should be in MP4 format for best compatibility</li>
          <li>• Keep file sizes reasonable for faster loading</li>
          <li>• Preview images help users understand your program content</li>
        </ul>
      </div>
    </div>
  );
};