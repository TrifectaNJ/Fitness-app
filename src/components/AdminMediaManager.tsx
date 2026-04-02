import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MediaUpload } from './MediaUpload';
import { Upload, Image, Video, Trash2, Edit } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  description?: string;
  uploadedAt: string;
}

const AdminMediaManager: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image');
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
    const newItem: MediaItem = {
      id: Date.now().toString(),
      url,
      type,
      name: `${type === 'image' ? 'Image' : 'Video'} ${mediaItems.length + 1}`,
      uploadedAt: new Date().toISOString()
    };
    setMediaItems(prev => [...prev, newItem]);
    setShowUpload(false);
  };

  const handleEdit = (item: MediaItem) => {
    setEditingItem(item);
    setEditForm({ name: item.name, description: item.description || '' });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    setMediaItems(prev => prev.map(item => 
      item.id === editingItem.id 
        ? { ...item, name: editForm.name, description: editForm.description }
        : item
    ));
    setEditingItem(null);
    setEditForm({ name: '', description: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this media item?')) {
      setMediaItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const imageItems = mediaItems.filter(item => item.type === 'image');
  const videoItems = mediaItems.filter(item => item.type === 'video');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Media Manager
          </h1>
          <p className="text-gray-600 mt-1">Upload and manage photos and videos</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => { setUploadType('image'); setShowUpload(true); }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500"
          >
            <Image className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
          <Button 
            onClick={() => { setUploadType('video'); setShowUpload(true); }}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            <Video className="w-4 h-4 mr-2" />
            Add Video
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Media</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaItems.length}</div>
            <p className="text-xs text-muted-foreground">Files uploaded</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photos</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{imageItems.length}</div>
            <p className="text-xs text-muted-foreground">Image files</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videoItems.length}</div>
            <p className="text-xs text-muted-foreground">Video files</p>
          </CardContent>
        </Card>
      </div>

      {mediaItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No media files yet</h3>
            <p className="text-gray-500 text-center mb-4">Upload your first photo or video to get started</p>
            <div className="flex gap-2">
              <Button onClick={() => { setUploadType('image'); setShowUpload(true); }}>
                <Image className="w-4 h-4 mr-2" />Add Photo
              </Button>
              <Button onClick={() => { setUploadType('video'); setShowUpload(true); }}>
                <Video className="w-4 h-4 mr-2" />Add Video
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover" controls />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 truncate">{item.description}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload {uploadType === 'image' ? 'Photo' : 'Video'}</DialogTitle>
          </DialogHeader>
          <MediaUpload 
            type={uploadType} 
            onUpload={handleMediaUpload}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMediaManager;