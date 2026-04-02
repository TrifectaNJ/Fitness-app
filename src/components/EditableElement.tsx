import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { X, Edit, GripVertical, Link } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { LinkSelector } from './LinkSelector';

interface EditableElementProps {
  id: string;
  type: 'text' | 'button' | 'image' | 'card';
  content: string;
  style?: React.CSSProperties;
  link?: string;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
}

export const EditableElement: React.FC<EditableElementProps> = ({
  id,
  type,
  content,
  style = {},
  link,
  onUpdate,
  onDelete,
  isEditing
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editStyle, setEditStyle] = useState(style);
  const [editLink, setEditLink] = useState(link || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(id, {
      content: editContent,
      style: editStyle,
      link: editLink
    });
    setIsEditMode(false);
  };

  const handleStyleChange = (property: string, value: string) => {
    setEditStyle(prev => ({ ...prev, [property]: value }));
  };

  const renderElement = () => {
    const elementStyle = { ...editStyle };
    
    switch (type) {
      case 'text':
        return (
          <div style={elementStyle}>
            {isEditMode ? (
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px]"
              />
            ) : (
              <p>{content}</p>
            )}
          </div>
        );
      case 'button':
        return (
          <Button
            style={elementStyle}
            onClick={() => link && window.open(link, '_self')}
          >
            {isEditMode ? (
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            ) : (
              content
            )}
          </Button>
        );
      default:
        return <div style={elementStyle}>{content}</div>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={`relative group ${isEditing ? 'border-2 border-dashed border-blue-300' : ''}`}
    >
      {isEditing && (
        <div className="absolute -top-2 -right-2 flex gap-1 z-10">
          <Button
            size="sm"
            variant="outline"
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 h-6 w-6"
          >
            <GripVertical className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditMode(!isEditMode)}
            className="p-1 h-6 w-6"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(id)}
            className="p-1 h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {renderElement()}
      
      {isEditMode && (
        <div className="mt-4 p-4 border rounded-lg bg-white space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              label="Background Color"
              value={editStyle.backgroundColor || '#ffffff'}
              onChange={(color) => handleStyleChange('backgroundColor', color)}
            />
            <ColorPicker
              label="Text Color"
              value={editStyle.color || '#000000'}
              onChange={(color) => handleStyleChange('color', color)}
            />
          </div>
          
          <LinkSelector
            value={editLink}
            onChange={setEditLink}
          />
          
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};