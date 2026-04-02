import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image, Video } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

interface MediaUploadProps {
  onUpload: (url: string, type?: 'image' | 'video') => void;
  onCancel?: () => void;
  existingUrl?: string;
  accept?: string;
  type?: 'image' | 'video' | 'both';
  className?: string;
  bucketName?: string;
}

export function MediaUpload({ 
  onUpload, 
  onCancel,
  existingUrl, 
  accept = 'image/*,video/*',
  type = 'both', 
  className,
  bucketName = 'exercise-media'
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(
    existingUrl ? (existingUrl.includes('.mp4') || existingUrl.includes('video') ? 'video' : 'image') : null
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    try {
      console.log('=== MEDIA UPLOAD START ===');
      console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
      console.log('Target bucket:', bucketName);
      
      setUploading(true);
      setUploadError(null);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      console.log('Uploading to path:', filePath);

      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        let errorMsg = `Upload failed: ${uploadError.message}`;
        
        if (uploadError.message.includes('not found')) {
          errorMsg = `Storage bucket '${bucketName}' does not exist or is not accessible`;
        } else if (uploadError.message.includes('permission')) {
          errorMsg = 'Permission denied. Please check bucket permissions.';
        } else if (uploadError.message.includes('size') || uploadError.message.includes('too large')) {
          errorMsg = 'File too large. Please select a file smaller than 30MB.';
        }
        
        setUploadError(errorMsg);
        toast({
          title: 'Upload failed',
          description: errorMsg,
          variant: 'destructive'
        });
        return;
      }

      console.log('✅ Upload successful:', data);

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const fileType = file.type.startsWith('image/') ? 'image' : 'video';
      const publicUrl = urlData.publicUrl;
      
      console.log('Generated public URL:', publicUrl);
      console.log('File type detected:', fileType);
      
      setMediaType(fileType);
      setPreview(publicUrl);
      
      onUpload(publicUrl, fileType);
      
      console.log('=== MEDIA UPLOAD COMPLETE ===');
      
      toast({
        title: 'Upload successful',
        description: `${fileType} uploaded successfully`
      });
    } catch (error: any) {
      console.error('❌ Error uploading file:', error);
      const errorMsg = error.message || 'An unexpected error occurred';
      setUploadError(errorMsg);
      toast({
        title: 'Upload failed',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      console.log('File size in MB:', (file.size / (1024 * 1024)).toFixed(2));
      
      // 30MB limit for all files (31457280 bytes = 30MB)
      const maxSize = 31457280;
      
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const errorMsg = `File too large (${fileSizeMB}MB). Please select a file smaller than 30MB`;
        console.log('File rejected - too large:', fileSizeMB, 'MB');
        setUploadError(errorMsg);
        toast({
          title: 'File too large',
          description: errorMsg,
          variant: 'destructive'
        });
        return;
      }
      
      console.log('File size check passed, proceeding with upload');
      uploadFile(file);
    }
  };

  const removeMedia = () => {
    setPreview(null);
    setMediaType(null);
    setUploadError(null);
    onUpload('', mediaType || 'image');
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Upload Media</Label>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">Upload Error:</p>
            <p className="text-sm text-red-600">{uploadError}</p>
          </div>
        )}
        
        {preview ? (
          <div className="relative">
            {mediaType === 'image' ? (
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  console.error('Image preview load error:', preview);
                  setUploadError('Failed to load image preview');
                }}
              />
            ) : (
              <video 
                src={preview} 
                className="w-full h-48 object-cover rounded-lg" 
                controls
                onError={(e) => {
                  console.error('Video preview load error:', preview);
                  setUploadError('Failed to load video preview');
                }}
              />
            )}
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={removeMedia}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="mt-2 text-xs text-gray-500 break-all">
              URL: {preview}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center space-y-2">
              {type === 'image' && <Image className="w-8 h-8 text-gray-400" />}
              {type === 'video' && <Video className="w-8 h-8 text-gray-400" />}
              {type === 'both' && <Upload className="w-8 h-8 text-gray-400" />}
              <p className="text-sm text-gray-500">
                {type === 'image' && 'Upload an image (max 30MB)'}
                {type === 'video' && 'Upload a video (max 30MB)'}
                {type === 'both' && 'Upload image or video (max 30MB)'}
              </p>
            </div>
          </div>
        )}

        <Input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={uploading}
          className="cursor-pointer"
        />
        
        {uploading && (
          <div className="flex items-center justify-center p-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-600 ml-2">Uploading...</p>
          </div>
        )}
      </div>
    </Card>
  );
}