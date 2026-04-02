import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import PersonalDietPlan from './PersonalDietPlan';
import { Apple, User, Target, Activity, Ruler, Weight } from 'lucide-react';

interface UserProfile {
  age: number;
  gender: string;
  weight: number;
  height: number;
  goal: string;
}

interface DietPlan {
  id: string;
  title: string;
  goal: string;
  fitness_level: string;
  calorie_range_min: number;
  calorie_range_max: number;
  water_intake: number;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  suggested_steps: number;
  excluded_allergens: string[];
  target_age_min: number;
  target_age_max: number;
  target_gender: string;
  target_weight_min: number;
  target_weight_max: number;
  target_height_min: number;
  target_height_max: number;
}

const DietPlanDashboard: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    age: 25,
    gender: '',
    weight: 0,
    height: 0,
    goal: ''
  });
  const [matchingPlan, setMatchingPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const findMatchingPlan = async () => {
    if (!userProfile.gender || !userProfile.goal || userProfile.weight <= 0 || userProfile.height <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data: plans, error: fetchError } = await supabase
        .from('diet_plans')
        .select('*');

      if (fetchError) {
        console.error('Error fetching plans:', fetchError);
        setError('Failed to fetch diet plans');
        return;
      }

      if (!plans || plans.length === 0) {
        setError('No diet plans available');
        return;
      }

      const matchedPlan = plans.find(plan => {
        const ageMatch = userProfile.age >= plan.target_age_min && userProfile.age <= plan.target_age_max;
        const genderMatch = plan.target_gender === 'any' || plan.target_gender === userProfile.gender;
        const weightMatch = userProfile.weight >= plan.target_weight_min && userProfile.weight <= plan.target_weight_max;
        const heightMatch = userProfile.height >= plan.target_height_min && userProfile.height <= plan.target_height_max;
        const goalMatch = plan.goal === userProfile.goal;
        
        return ageMatch && genderMatch && weightMatch && heightMatch && goalMatch;
      });

      if (matchedPlan) {
        setMatchingPlan(matchedPlan);
        setShowForm(false);
      } else {
        setError('No matching diet plan found for your profile. Please try different criteria.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while finding your plan');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm && matchingPlan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Apple className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold">Your Personalized Diet Plan</h2>
          </div>
          <Button variant="outline" onClick={() => { setShowForm(true); setMatchingPlan(null); }}>
            Change Profile
          </Button>
        </div>
        <PersonalDietPlan plan={matchingPlan} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Apple className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold">Find Your Perfect Diet Plan</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={userProfile.age}
                onChange={(e) => setUserProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                placeholder="Enter your age"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={userProfile.gender} onValueChange={(value) => setUserProfile(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={userProfile.weight}
                onChange={(e) => setUserProfile(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter your weight"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="height">Height (inches)</Label>
              <Input
                id="height"
                type="number"
                value={userProfile.height}
                onChange={(e) => setUserProfile(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter your height"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="goal">Fitness Goal</Label>
              <Select value={userProfile.goal} onValueChange={(value) => setUserProfile(prev => ({ ...prev, goal: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose">Weight Loss</SelectItem>
                  <SelectItem value="maintain">Weight Maintenance</SelectItem>
                  <SelectItem value="gain">Weight Gain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <Button 
            onClick={findMatchingPlan} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Finding Your Plan...' : 'Find My Diet Plan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DietPlanDashboard;