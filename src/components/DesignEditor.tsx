import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BackgroundImageManager from '@/components/BackgroundImageManager';
import { useDesign } from '@/contexts/DesignContext';

interface DesignSettings {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
  layout: 'grid' | 'list';
  spacing: number;
}

interface DesignEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: DesignSettings) => void;
  currentSettings: DesignSettings;
}

const DesignEditor: React.FC<DesignEditorProps> = ({
  open,
  onOpenChange,
  onSave,
  currentSettings
}) => {
  const [settings, setSettings] = useState<DesignSettings>(currentSettings);
  const { settings: designSettings, updateBackgroundImages, saveSettings } = useDesign();

  const handleSave = () => {
    onSave(settings);
    onOpenChange(false);
  };

  const colorPresets = [
    { name: 'Purple-Pink', primary: '#8b5cf6', secondary: '#ec4899' },
    { name: 'Blue-Cyan', primary: '#3b82f6', secondary: '#06b6d4' },
    { name: 'Green-Emerald', primary: '#10b981', secondary: '#059669' },
    { name: 'Orange-Red', primary: '#f97316', secondary: '#ef4444' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Design Editor
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="colors" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="backgrounds">Backgrounds</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    className="w-12 h-10"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    placeholder="#8b5cf6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                    className="w-12 h-10"
                  />
                  <Input
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                    placeholder="#ec4899"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Color Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {colorPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    onClick={() => setSettings({
                      ...settings,
                      primaryColor: preset.primary,
                      secondaryColor: preset.secondary
                    })}
                    className="justify-start"
                  >
                    <div className="flex gap-2 items-center">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: preset.secondary }}
                      />
                      {preset.name}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select
                  value={settings.fontFamily}
                  onValueChange={(value) => setSettings({...settings, fontFamily: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Base Font Size: {settings.fontSize}px</Label>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([value]) => setSettings({...settings, fontSize: value})}
                  min={12}
                  max={20}
                  step={1}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Layout Style</Label>
                <Select
                  value={settings.layout}
                  onValueChange={(value: 'grid' | 'list') => setSettings({...settings, layout: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Border Radius: {settings.borderRadius}px</Label>
                <Slider
                  value={[settings.borderRadius]}
                  onValueChange={([value]) => setSettings({...settings, borderRadius: value})}
                  min={0}
                  max={24}
                  step={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Spacing: {settings.spacing}px</Label>
                <Slider
                  value={[settings.spacing]}
                  onValueChange={([value]) => setSettings({...settings, spacing: value})}
                  min={16}
                  max={32}
                  step={4}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="backgrounds" className="space-y-4">
            <BackgroundImageManager
              settings={designSettings.backgroundImages || {}}
              onUpdate={updateBackgroundImages}
              onSave={saveSettings}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-purple-500 to-pink-500">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DesignEditor;