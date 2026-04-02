import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DietPlan {
  id?: string;
  title: string;
  goal: string;
  calorie_range_min: number;
  calorie_range_max: number;
  water_intake: number;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  suggested_steps: number;
  min_weight?: number;
  max_weight?: number;
  min_height?: number;
  max_height?: number;
  min_age?: number;
  max_age?: number;
  target_gender?: string;
}

interface AdminDietPlanManagerFormProps {
  editingPlan: DietPlan;
  setEditingPlan: (plan: DietPlan) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
}

const AdminDietPlanManagerForm: React.FC<AdminDietPlanManagerFormProps> = ({
  editingPlan,
  setEditingPlan,
  onSave,
  onCancel,
  loading
}) => {
  const convertHeightToInches = (feet: number, inches: number) => {
    return feet * 12 + inches;
  };

  const convertInchesToFeetAndInches = (totalInches: number) => {
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return { feet, inches };
  };

  const minHeightDisplay = editingPlan.min_height ? convertInchesToFeetAndInches(editingPlan.min_height) : { feet: 0, inches: 0 };
  const maxHeightDisplay = editingPlan.max_height ? convertInchesToFeetAndInches(editingPlan.max_height) : { feet: 0, inches: 0 };

  return (
    <div className="space-y-4">
      <div>
        <Label>Plan Title</Label>
        <Input 
          value={editingPlan.title}
          onChange={(e) => setEditingPlan({...editingPlan, title: e.target.value})}
          placeholder="e.g., Beginner Weight Loss Plan"
        />
      </div>
      
      <div>
        <Label>Goal</Label>
        <Select value={editingPlan.goal} onValueChange={(value) => setEditingPlan({...editingPlan, goal: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select goal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lose">Lose Weight</SelectItem>
            <SelectItem value="maintain">Maintain Weight</SelectItem>
            <SelectItem value="gain">Gain Weight</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Min Calories</Label>
          <Input 
            type="number"
            value={editingPlan.calorie_range_min}
            onChange={(e) => setEditingPlan({...editingPlan, calorie_range_min: parseInt(e.target.value)})}
          />
        </div>
        <div>
          <Label>Max Calories</Label>
          <Input 
            type="number"
            value={editingPlan.calorie_range_max}
            onChange={(e) => setEditingPlan({...editingPlan, calorie_range_max: parseInt(e.target.value)})}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">User Criteria</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Weight Range (lbs)</Label>
            <div className="flex gap-2">
              <Input 
                type="number"
                placeholder="Min"
                value={editingPlan.min_weight || ''}
                onChange={(e) => setEditingPlan({...editingPlan, min_weight: parseInt(e.target.value) || undefined})}
              />
              <Input 
                type="number"
                placeholder="Max"
                value={editingPlan.max_weight || ''}
                onChange={(e) => setEditingPlan({...editingPlan, max_weight: parseInt(e.target.value) || undefined})}
              />
            </div>
          </div>
          
          <div>
            <Label>Height Range</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Min Height</Label>
                  <div className="flex gap-1">
                    <div className="relative">
                      <Input 
                        type="number"
                        placeholder="5"
                        value={minHeightDisplay.feet || ''}
                        onChange={(e) => {
                          const feet = parseInt(e.target.value) || 0;
                          const totalInches = convertHeightToInches(feet, minHeightDisplay.inches);
                          setEditingPlan({...editingPlan, min_height: totalInches || undefined});
                        }}
                        className="pr-8"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">ft</span>
                    </div>
                    <div className="relative">
                      <Input 
                        type="number"
                        placeholder="4"
                        value={minHeightDisplay.inches || ''}
                        onChange={(e) => {
                          const inches = parseInt(e.target.value) || 0;
                          const totalInches = convertHeightToInches(minHeightDisplay.feet, inches);
                          setEditingPlan({...editingPlan, min_height: totalInches || undefined});
                        }}
                        className="pr-8"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">in</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Max Height</Label>
                  <div className="flex gap-1">
                    <div className="relative">
                      <Input 
                        type="number"
                        placeholder="6"
                        value={maxHeightDisplay.feet || ''}
                        onChange={(e) => {
                          const feet = parseInt(e.target.value) || 0;
                          const totalInches = convertHeightToInches(feet, maxHeightDisplay.inches);
                          setEditingPlan({...editingPlan, max_height: totalInches || undefined});
                        }}
                        className="pr-8"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">ft</span>
                    </div>
                    <div className="relative">
                      <Input 
                        type="number"
                        placeholder="7"
                        value={maxHeightDisplay.inches || ''}
                        onChange={(e) => {
                          const inches = parseInt(e.target.value) || 0;
                          const totalInches = convertHeightToInches(maxHeightDisplay.feet, inches);
                          setEditingPlan({...editingPlan, max_height: totalInches || undefined});
                        }}
                        className="pr-8"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">in</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Age Range</Label>
            <div className="flex gap-2">
              <Input 
                type="number"
                placeholder="Min"
                value={editingPlan.min_age || ''}
                onChange={(e) => setEditingPlan({...editingPlan, min_age: parseInt(e.target.value) || undefined})}
              />
              <Input 
                type="number"
                placeholder="Max"
                value={editingPlan.max_age || ''}
                onChange={(e) => setEditingPlan({...editingPlan, max_age: parseInt(e.target.value) || undefined})}
              />
            </div>
          </div>
          
          <div>
            <Label>Target Gender</Label>
            <Select value={editingPlan.target_gender} onValueChange={(value) => setEditingPlan({...editingPlan, target_gender: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Water Intake (oz)</Label>
          <Input 
            type="number"
            value={editingPlan.water_intake}
            onChange={(e) => setEditingPlan({...editingPlan, water_intake: parseInt(e.target.value)})}
          />
        </div>
        <div>
          <Label>Suggested Steps</Label>
          <Input 
            type="number"
            value={editingPlan.suggested_steps}
            onChange={(e) => setEditingPlan({...editingPlan, suggested_steps: parseInt(e.target.value)})}
          />
        </div>
      </div>
      
      <div>
        <Label>Breakfast</Label>
        <Textarea 
          value={editingPlan.breakfast}
          onChange={(e) => setEditingPlan({...editingPlan, breakfast: e.target.value})}
          placeholder="Describe breakfast recommendations..."
        />
      </div>
      
      <div>
        <Label>Lunch</Label>
        <Textarea 
          value={editingPlan.lunch}
          onChange={(e) => setEditingPlan({...editingPlan, lunch: e.target.value})}
          placeholder="Describe lunch recommendations..."
        />
      </div>
      
      <div>
        <Label>Dinner</Label>
        <Textarea 
          value={editingPlan.dinner}
          onChange={(e) => setEditingPlan({...editingPlan, dinner: e.target.value})}
          placeholder="Describe dinner recommendations..."
        />
      </div>
      
      <div>
        <Label>Snacks</Label>
        <Textarea 
          value={editingPlan.snacks}
          onChange={(e) => setEditingPlan({...editingPlan, snacks: e.target.value})}
          placeholder="Describe snack recommendations..."
        />
      </div>
      
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Plan'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default AdminDietPlanManagerForm;