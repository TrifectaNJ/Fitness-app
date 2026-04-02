import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, X } from 'lucide-react';

interface ProgramFormBasicProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  program?: any;
}

export const ProgramFormBasic: React.FC<ProgramFormBasicProps> = ({ 
  formData, setFormData, onSubmit, isSubmitting, program 
}) => {
  const addInstruction = () => {
    setFormData((prev: any) => ({ ...prev, instructions: [...prev.instructions, ''] }));
  };

  const removeInstruction = (index: number) => {
    setFormData((prev: any) => ({ ...prev, instructions: prev.instructions.filter((_: any, i: number) => i !== index) }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData((prev: any) => ({ ...prev, instructions: prev.instructions.map((inst: string, i: number) => i === index ? value : inst) }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input 
            id="title" 
            value={formData.title} 
            onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))} 
            required 
            placeholder="Enter program title"
          />
        </div>
        <div>
          <Label htmlFor="category">Category *</Label>
          <Input 
            id="category" 
            value={formData.category} 
            onChange={(e) => setFormData((prev: any) => ({ ...prev, category: e.target.value }))} 
            required 
            placeholder="e.g., Strength, Cardio, Yoga"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea 
          id="description" 
          value={formData.description} 
          onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))} 
          required 
          placeholder="Describe your fitness program"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Switch 
              id="isFree" 
              checked={formData.isFree} 
              onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, isFree: checked, price: checked ? 0 : prev.price }))} 
            />
            <Label htmlFor="isFree">Free Program</Label>
          </div>
          {!formData.isFree && (
            <div>
              <Label htmlFor="price">Price ($) *</Label>
              <Input 
                id="price" 
                type="number" 
                min="0" 
                step="0.01" 
                value={formData.price} 
                onChange={(e) => setFormData((prev: any) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} 
                required 
              />
            </div>
          )}
          {formData.isFree && (
            <div className="text-sm text-green-600 font-medium">This program is free</div>
          )}
        </div>
        <div>
          <Label>Payment Type</Label>
          <Select 
            value={formData.paymentType} 
            onValueChange={(value: 'one-time' | 'monthly') => setFormData((prev: any) => ({ ...prev, paymentType: value }))}
            disabled={formData.isFree}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="one-time">One-time</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Difficulty</Label>
          <Select value={formData.difficulty} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setFormData((prev: any) => ({ ...prev, difficulty: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="duration">Duration *</Label>
        <Input 
          id="duration" 
          value={formData.duration} 
          onChange={(e) => setFormData((prev: any) => ({ ...prev, duration: e.target.value }))} 
          placeholder="e.g., 4 weeks, 30 days" 
          required 
        />
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label>Instructions</Label>
          <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
            <Plus className="w-4 h-4 mr-1" />Add
          </Button>
        </div>
        {formData.instructions.map((instruction: string, index: number) => (
          <div key={index} className="flex gap-2 mb-2">
            <Input 
              value={instruction} 
              onChange={(e) => updateInstruction(index, e.target.value)} 
              placeholder={`Step ${index + 1}`} 
            />
            {formData.instructions.length > 1 && (
              <Button type="button" variant="outline" size="sm" onClick={() => removeInstruction(index)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="isActive" 
          checked={formData.isActive} 
          onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, isActive: checked }))} 
        />
        <Label htmlFor="isActive">Active Program</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="showOnHomePage" 
          checked={formData.showOnHomePage} 
          onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, showOnHomePage: checked }))} 
        />
        <Label htmlFor="showOnHomePage">Display on Home Page</Label>
      </div>
    </form>
  );
};