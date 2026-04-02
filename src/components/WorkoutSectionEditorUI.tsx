import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutSection, WorkoutSubsection, Exercise } from '@/types/fitness';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface WorkoutSectionEditorUIProps {
  sections: WorkoutSection[];
  editingSection: string | null;
  editingSubsection: string | null;
  collapsedSections: Set<string>;
  availableExercises: Exercise[];
  onToggleCollapse: (sectionId: string) => void;
  onEditSection: (sectionId: string | null) => void;
  onEditSubsection: (subsectionId: string | null) => void;
  onUpdateSection: (sectionId: string, updates: Partial<WorkoutSection>) => void;
  onUpdateSubsection: (sectionId: string, subsectionId: string, updates: Partial<WorkoutSubsection>) => void;
  onDeleteSection: (sectionId: string) => void;
  onDeleteSubsection: (sectionId: string, subsectionId: string) => void;
  onAddSubsection: (sectionId: string) => void;
  onAddSection: () => void;
  onAddExercise: (sectionId: string, subsectionId: string, exerciseId: string) => void;
  onRemoveExercise: (sectionId: string, subsectionId: string, exerciseIndex: number) => void;
}

const WorkoutSectionEditorUI: React.FC<WorkoutSectionEditorUIProps> = ({
  sections,
  editingSection,
  editingSubsection,
  collapsedSections,
  availableExercises,
  onToggleCollapse,
  onEditSection,
  onEditSubsection,
  onUpdateSection,
  onUpdateSubsection,
  onDeleteSection,
  onDeleteSubsection,
  onAddSubsection,
  onAddSection,
  onAddExercise,
  onRemoveExercise
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Workout Sections & Subsections</h3>
        <Button onClick={onAddSection}>
          <Plus className="w-4 h-4 mr-2" />Add Section
        </Button>
      </div>

      {sections.map((section) => {
        const isCollapsed = collapsedSections.has(section.id);
        return (
          <Card key={section.id} className="border-2">
            <CardHeader className="pb-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleCollapse(section.id)}
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  {editingSection === section.id ? (
                    <Input
                      value={section.section_title}
                      onChange={(e) => onUpdateSection(section.id, { section_title: e.target.value })}
                      onBlur={() => onEditSection(null)}
                      onKeyDown={(e) => e.key === 'Enter' && onEditSection(null)}
                      className="font-semibold"
                      autoFocus
                    />
                  ) : (
                    <CardTitle 
                      className="cursor-pointer hover:text-blue-600 text-lg"
                      onClick={() => onEditSection(section.id)}
                    >
                      {section.section_title}
                    </CardTitle>
                  )}
                  <Badge variant="secondary">
                    {section.subsections.length} subsection{section.subsections.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onAddSubsection(section.id)}>
                    <Plus className="w-4 h-4 mr-1" />Add Subsection
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDeleteSection(section.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {!isCollapsed && (
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {section.subsections.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                      <p>No subsections yet</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => onAddSubsection(section.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />Add First Subsection
                      </Button>
                    </div>
                  ) : (
                    section.subsections.map((subsection, subsectionIndex) => (
                      <div key={subsection.id} className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">#{subsectionIndex + 1}</span>
                            </div>
                            <div className="flex-1">
                              <Label className="text-sm font-medium text-gray-700">Subsection Title:</Label>
                              {editingSubsection === subsection.id ? (
                                <Input
                                  value={subsection.subsection_title}
                                  onChange={(e) => onUpdateSubsection(section.id, subsection.id, { subsection_title: e.target.value })}
                                  onBlur={() => onEditSubsection(null)}
                                  onKeyDown={(e) => e.key === 'Enter' && onEditSubsection(null)}
                                  className="mt-1 font-medium"
                                  autoFocus
                                />
                              ) : (
                                <div 
                                  className="mt-1 p-2 border rounded cursor-pointer hover:bg-white font-medium"
                                  onClick={() => onEditSubsection(subsection.id)}
                                >
                                  {subsection.subsection_title}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Repeat:</Label>
                              <Input
                                type="number"
                                value={subsection.repeat_count || ''}
                                onChange={(e) => onUpdateSubsection(section.id, subsection.id, { repeat_count: parseInt(e.target.value) || undefined })}
                                className="w-20"
                                placeholder="1"
                              />
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => onDeleteSubsection(section.id, subsection.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Exercises in this subsection:</Label>
                          {subsection.exercises.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 border border-dashed rounded">
                              No exercises added yet
                            </div>
                          ) : (
                            subsection.exercises.map((exercise, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white border rounded">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">#{index + 1}</span>
                                  <span className="font-medium">{exercise.name}</span>
                                  <span className="text-sm text-gray-500">({exercise.duration}s)</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => onRemoveExercise(section.id, subsection.id, index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))
                          )}
                          
                          <div className="flex gap-2 pt-2">
                            <Select onValueChange={(exerciseId) => onAddExercise(section.id, subsection.id, exerciseId)}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Add exercise to this subsection" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableExercises.map((exercise) => (
                                  <SelectItem key={exercise.id} value={exercise.id}>
                                    {exercise.name} ({exercise.duration}s)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default WorkoutSectionEditorUI;