import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Type, Layout, Plus, Save } from 'lucide-react';
import { useDesign } from '@/contexts/DesignContext';
import { ColorPicker } from './ColorPicker';
import BackgroundImageManager from './BackgroundImageManager';

interface UIElement {
  id: string;
  type: 'text' | 'button' | 'input' | 'container' | 'image';
  content: string;
  styles: {
    fontSize?: string;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: string;
    padding?: string;
    margin?: string;
    textAlign?: string;
    borderStyle?: string;
    borderColor?: string;
    borderWidth?: string;
  };
  position: { x: number; y: number };
}

const UIEditor: React.FC = () => {
  const { settings, updateSettings, saveSettings } = useDesign();
  const [selectedPage, setSelectedPage] = useState<string>('homepage');
  const [elements, setElements] = useState<UIElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const pages = [
    { key: 'homepage', label: 'Homepage' },
    { key: 'loginPage', label: 'Login Page' },
    { key: 'profilePage', label: 'Profile Page' },
    { key: 'programPage', label: 'Program Page' }
  ];

  const addElement = (type: UIElement['type']) => {
    const newElement: UIElement = {
      id: Date.now().toString(),
      type,
      content: type === 'text' ? 'New Text' : type === 'button' ? 'Button' : '',
      styles: {
        fontSize: '16px',
        fontFamily: 'Inter',
        color: '#000000',
        backgroundColor: type === 'button' ? '#3B82F6' : 'transparent',
        borderRadius: '8px',
        padding: '12px',
        margin: '8px',
        textAlign: 'left'
      },
      position: { x: 50, y: 50 }
    };
    setElements([...elements, newElement]);
  };

  const updateElement = (id: string, updates: Partial<UIElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const handleSave = async () => {
    try {
      await saveSettings();
      console.log('UI settings saved successfully');
    } catch (error) {
      console.error('Failed to save UI settings:', error);
    }
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">UI Design Editor</h2>
          <p className="text-gray-600">Customize the appearance of your application</p>
        </div>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="global" className="space-y-6">
        <TabsList>
          <TabsTrigger value="global">
            <Palette className="w-4 h-4 mr-2" />
            Global Styles
          </TabsTrigger>
          <TabsTrigger value="elements">
            <Layout className="w-4 h-4 mr-2" />
            Page Elements
          </TabsTrigger>
          <TabsTrigger value="backgrounds">
            Background Images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Primary Color</Label>
                  <ColorPicker
                    color={settings.primaryColor}
                    onChange={(color) => updateSettings({ primaryColor: color })}
                  />
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <ColorPicker
                    color={settings.secondaryColor}
                    onChange={(color) => updateSettings({ secondaryColor: color })}
                  />
                </div>
                <div>
                  <Label>Background Color</Label>
                  <ColorPicker
                    color={settings.backgroundColor}
                    onChange={(color) => updateSettings({ backgroundColor: color })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Text Color</Label>
                  <ColorPicker
                    color={settings.textColor}
                    onChange={(color) => updateSettings({ textColor: color })}
                  />
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <ColorPicker
                    color={settings.accentColor}
                    onChange={(color) => updateSettings({ accentColor: color })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backgrounds">
          <BackgroundImageManager
            settings={settings.backgroundImages || {}}
            onUpdate={(images) => updateSettings({ backgroundImages: images })}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="elements">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Page Editor</CardTitle>
                    <Select value={selectedPage} onValueChange={setSelectedPage}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pages.map(page => (
                          <SelectItem key={page.key} value={page.key}>
                            {page.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg min-h-96 relative bg-gray-50">
                    {elements.map(element => (
                      <div
                        key={element.id}
                        className={`absolute cursor-pointer border-2 ${
                          selectedElement === element.id ? 'border-blue-500' : 'border-transparent'
                        } hover:border-blue-300`}
                        style={{
                          left: element.position.x,
                          top: element.position.y,
                          ...element.styles
                        }}
                        onClick={() => setSelectedElement(element.id)}
                      >
                        {element.content}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => addElement('text')} size="sm">
                      <Type className="w-4 h-4 mr-2" />
                      Add Text
                    </Button>
                    <Button onClick={() => addElement('button')} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Button
                    </Button>
                    <Button onClick={() => addElement('input')} size="sm">
                      Add Input
                    </Button>
                    <Button onClick={() => addElement('container')} size="sm">
                      Add Container
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Element Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedEl ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Content</Label>
                        <Input
                          value={selectedEl.content}
                          onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Font Size</Label>
                        <Select
                          value={selectedEl.styles.fontSize}
                          onValueChange={(value) => updateElement(selectedEl.id, {
                            styles: { ...selectedEl.styles, fontSize: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12px">12px</SelectItem>
                            <SelectItem value="14px">14px</SelectItem>
                            <SelectItem value="16px">16px</SelectItem>
                            <SelectItem value="18px">18px</SelectItem>
                            <SelectItem value="24px">24px</SelectItem>
                            <SelectItem value="32px">32px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Text Color</Label>
                        <ColorPicker
                          color={selectedEl.styles.color || '#000000'}
                          onChange={(color) => updateElement(selectedEl.id, {
                            styles: { ...selectedEl.styles, color }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Background Color</Label>
                        <ColorPicker
                          color={selectedEl.styles.backgroundColor || 'transparent'}
                          onChange={(color) => updateElement(selectedEl.id, {
                            styles: { ...selectedEl.styles, backgroundColor: color }
                          })}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Select an element to edit its properties</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UIEditor;