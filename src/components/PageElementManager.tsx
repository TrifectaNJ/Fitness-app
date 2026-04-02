import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Move, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PageElement {
  id: string;
  pageKey: string;
  type: 'text' | 'button' | 'input' | 'container' | 'image' | 'heading';
  content: string;
  styles: {
    fontSize?: string;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: string;
    padding?: string;
    margin?: string;
    textAlign?: 'left' | 'center' | 'right';
    borderStyle?: string;
    borderColor?: string;
    borderWidth?: string;
    width?: string;
    height?: string;
  };
  position: { x: number; y: number };
  visible: boolean;
  order: number;
}

interface PageElementManagerProps {
  pageKey: string;
}

const PageElementManager: React.FC<PageElementManagerProps> = ({ pageKey }) => {
  const [elements, setElements] = useState<PageElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadElements();
  }, [pageKey]);

  const loadElements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('page_elements')
        .select('*')
        .eq('page_key', pageKey)
        .order('order_index');

      if (error) throw error;
      
      const loadedElements: PageElement[] = (data || []).map(item => ({
        id: item.id,
        pageKey: item.page_key,
        type: item.element_type,
        content: item.content,
        styles: item.styles || {},
        position: item.position || { x: 0, y: 0 },
        visible: item.visible ?? true,
        order: item.order_index || 0
      }));
      
      setElements(loadedElements);
    } catch (error) {
      console.error('Failed to load page elements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveElement = async (element: PageElement) => {
    try {
      const saveData = {
        page_key: element.pageKey,
        element_type: element.type,
        content: element.content,
        styles: element.styles,
        position: element.position,
        visible: element.visible,
        order_index: element.order
      };

      const { error } = await supabase
        .from('page_elements')
        .upsert({ id: element.id, ...saveData });

      if (error) throw error;
      console.log('Element saved successfully');
    } catch (error) {
      console.error('Failed to save element:', error);
    }
  };

  const addElement = (type: PageElement['type']) => {
    const newElement: PageElement = {
      id: `temp_${Date.now()}`,
      pageKey,
      type,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type),
      position: { x: 50, y: 50 + (elements.length * 60) },
      visible: true,
      order: elements.length
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const getDefaultContent = (type: string): string => {
    switch (type) {
      case 'heading': return 'New Heading';
      case 'text': return 'New text content';
      case 'button': return 'Click Me';
      case 'input': return '';
      case 'container': return '';
      case 'image': return 'Image placeholder';
      default: return '';
    }
  };

  const getDefaultStyles = (type: string) => {
    const base = {
      fontSize: '16px',
      fontFamily: 'Inter',
      color: '#1f2937',
      backgroundColor: 'transparent',
      borderRadius: '8px',
      padding: '12px',
      margin: '8px',
      textAlign: 'left' as const
    };

    switch (type) {
      case 'heading':
        return { ...base, fontSize: '24px', fontWeight: 'bold' };
      case 'button':
        return { ...base, backgroundColor: '#3b82f6', color: '#ffffff' };
      case 'input':
        return { ...base, borderStyle: 'solid', borderWidth: '1px', borderColor: '#d1d5db' };
      default:
        return base;
    }
  };

  const updateElement = (id: string, updates: Partial<PageElement>) => {
    setElements(elements.map(el => {
      if (el.id === id) {
        const updated = { ...el, ...updates };
        saveElement(updated);
        return updated;
      }
      return el;
    }));
  };

  const deleteElement = async (id: string) => {
    try {
      if (!id.startsWith('temp_')) {
        const { error } = await supabase
          .from('page_elements')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
      setElements(elements.filter(el => el.id !== id));
      if (selectedElement === id) {
        setSelectedElement(null);
      }
    } catch (error) {
      console.error('Failed to delete element:', error);
    }
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Page Elements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {elements.map(element => (
              <div
                key={element.id}
                className={`p-3 border rounded cursor-pointer ${
                  selectedElement === element.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedElement(element.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium capitalize">{element.type}</span>
                    <p className="text-sm text-gray-600 truncate">{element.content}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateElement(element.id, { visible: !element.visible });
                      }}
                    >
                      {element.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(element.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button onClick={() => addElement('heading')} size="sm">Add Heading</Button>
            <Button onClick={() => addElement('text')} size="sm">Add Text</Button>
            <Button onClick={() => addElement('button')} size="sm">Add Button</Button>
            <Button onClick={() => addElement('input')} size="sm">Add Input</Button>
            <Button onClick={() => addElement('container')} size="sm">Add Container</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Element Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedEl ? (
            <div className="space-y-4">
              <div>
                <Label>Content</Label>
                {selectedEl.type === 'text' || selectedEl.type === 'heading' ? (
                  <Textarea
                    value={selectedEl.content}
                    onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                    rows={3}
                  />
                ) : (
                  <Input
                    value={selectedEl.content}
                    onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                  />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="48px">48px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Text Align</Label>
                  <Select
                    value={selectedEl.styles.textAlign}
                    onValueChange={(value: 'left' | 'center' | 'right') => updateElement(selectedEl.id, {
                      styles: { ...selectedEl.styles, textAlign: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={selectedEl.styles.color}
                    onChange={(e) => updateElement(selectedEl.id, {
                      styles: { ...selectedEl.styles, color: e.target.value }
                    })}
                  />
                </div>
                
                <div>
                  <Label>Background</Label>
                  <Input
                    type="color"
                    value={selectedEl.styles.backgroundColor}
                    onChange={(e) => updateElement(selectedEl.id, {
                      styles: { ...selectedEl.styles, backgroundColor: e.target.value }
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Padding</Label>
                  <Input
                    value={selectedEl.styles.padding}
                    onChange={(e) => updateElement(selectedEl.id, {
                      styles: { ...selectedEl.styles, padding: e.target.value }
                    })}
                    placeholder="12px"
                  />
                </div>
                
                <div>
                  <Label>Border Radius</Label>
                  <Input
                    value={selectedEl.styles.borderRadius}
                    onChange={(e) => updateElement(selectedEl.id, {
                      styles: { ...selectedEl.styles, borderRadius: e.target.value }
                    })}
                    placeholder="8px"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Select an element to edit its properties</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PageElementManager;