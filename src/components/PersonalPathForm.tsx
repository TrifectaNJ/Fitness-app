import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target } from 'lucide-react';

interface PersonalPathFormProps {
  onSubmit: (data: any) => void;
}

const PersonalPathForm: React.FC<PersonalPathFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    heightFeet: '',
    heightInches: '',
    gender: '',
    goal: ''
  });

  const handleSubmit = () => {
    if (!formData.age || !formData.weight || !formData.heightFeet || 
        !formData.gender || !formData.goal) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Convert feet and inches to total inches
    const feet = parseInt(formData.heightFeet) || 0;
    const inches = parseInt(formData.heightInches) || 0;
    const totalHeightInches = (feet * 12) + inches;
    
    const submissionData = {
      ...formData,
      totalHeightInches: totalHeightInches
    };
    
    onSubmit(submissionData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Personal Path to Success
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="age">Age *</Label>
            <Input 
              id="age" 
              type="number" 
              value={formData.age} 
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight (lbs) *</Label>
            <Input 
              id="weight" 
              type="number" 
              value={formData.weight} 
              onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
            />
          </div>
        </div>
        
        <div>
          <Label>Height *</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input 
                type="number" 
                placeholder="5"
                value={formData.heightFeet} 
                onChange={(e) => setFormData(prev => ({ ...prev, heightFeet: e.target.value }))}
                className="pr-8"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">ft</span>
            </div>
            <div className="flex-1 relative">
              <Input 
                type="number" 
                placeholder="4"
                min="0"
                max="11"
                value={formData.heightInches} 
                onChange={(e) => setFormData(prev => ({ ...prev, heightInches: e.target.value }))}
                className="pr-8"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">in</span>
            </div>
          </div>
        </div>
        
        <div>
          <Label>Gender *</Label>
          <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Goal *</Label>
          <Select value={formData.goal} onValueChange={(value) => setFormData(prev => ({ ...prev, goal: value }))}>            <SelectTrigger>
              <SelectValue placeholder="Select goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lose">Lose Weight</SelectItem>
              <SelectItem value="maintain">Maintain Weight</SelectItem>
              <SelectItem value="gain">Gain Weight</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={handleSubmit} className="w-full">
          Get My Personal Plan
        </Button>
      </CardContent>
    </Card>
  );
};

export default PersonalPathForm;