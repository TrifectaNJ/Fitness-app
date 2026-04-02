import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from './ui/button';
import { Plus, Eye, Edit } from 'lucide-react';
import { EditableElement } from './EditableElement';
import { useDesign } from '../contexts/DesignContext';

interface ElementData {
  id: string;
  type: 'text' | 'button' | 'image' | 'card';
  content: string;
  style?: React.CSSProperties;
  link?: string;
}

interface DragDropEditorProps {
  elements: ElementData[];
  onElementsChange: (elements: ElementData[]) => void;
}

export const DragDropEditor: React.FC<DragDropEditorProps> = ({
  elements,
  onElementsChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { settings } = useDesign();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = elements.findIndex((item) => item.id === active.id);
      const newIndex = elements.findIndex((item) => item.id === over?.id);
      onElementsChange(arrayMove(elements, oldIndex, newIndex));
    }
  };

  const addElement = (type: 'text' | 'button' | 'image' | 'card') => {
    const newElement: ElementData = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'button' ? 'New Button' : 'New Text',
      style: {
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
        padding: '12px',
        borderRadius: `${settings.borderRadius}px`,
      }
    };
    onElementsChange([...elements, newElement]);
  };

  const updateElement = (id: string, updates: any) => {
    onElementsChange(
      elements.map(el => el.id === id ? { ...el, ...updates } : el)
    );
  };

  const deleteElement = (id: string) => {
    onElementsChange(elements.filter(el => el.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Page Editor</h3>
        <div className="flex gap-2">
          <Button
            variant={isEditing ? 'default' : 'outline'}
            onClick={() => setIsEditing(!isEditing)}
            size="sm"
          >
            {isEditing ? <Eye className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            {isEditing ? 'Preview' : 'Edit'}
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="flex gap-2 p-4 bg-gray-50 rounded-lg">
          <Button onClick={() => addElement('text')} size="sm">
            <Plus className="h-4 w-4 mr-2" />Text
          </Button>
          <Button onClick={() => addElement('button')} size="sm">
            <Plus className="h-4 w-4 mr-2" />Button
          </Button>
          <Button onClick={() => addElement('card')} size="sm">
            <Plus className="h-4 w-4 mr-2" />Card
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={elements} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {elements.map((element) => (
              <EditableElement
                key={element.id}
                id={element.id}
                type={element.type}
                content={element.content}
                style={element.style}
                link={element.link}
                onUpdate={updateElement}
                onDelete={deleteElement}
                isEditing={isEditing}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};