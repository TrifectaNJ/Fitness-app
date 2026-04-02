import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Info } from 'lucide-react';

const CalorieCalculator: React.FC = () => {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [gender, setGender] = useState('');
  const [activity, setActivity] = useState('');
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [showSources, setShowSources] = useState(false);

  const calculateCalories = () => {
    if (!age || !weight || !heightFeet || !heightInches || !gender || !activity || !goal) return;
    
    // Convert lbs to kg and ft/in to cm
    const weightKg = parseFloat(weight) * 0.453592;
    const totalInches = parseFloat(heightFeet) * 12 + parseFloat(heightInches);
    const heightCm = totalInches * 2.54;
    const a = parseFloat(age);
    
    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * a + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * a - 161;
    }
    
    // Activity multipliers
    const activityMultipliers: { [key: string]: number } = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very-active': 1.9
    };
    
    const tdee = bmr * activityMultipliers[activity];
    
    // Goal adjustments
    let finalCalories = tdee;
    if (goal === 'lose') finalCalories = tdee - 500;
    else if (goal === 'gain') finalCalories = tdee + 500;
    
    setResult(Math.round(finalCalories));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calorie Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
          
          <div>
            <Label>Height</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input 
                  type="number" 
                  placeholder="Feet" 
                  value={heightFeet} 
                  onChange={(e) => setHeightFeet(e.target.value)} 
                />
              </div>
              <div>
                <Input 
                  type="number" 
                  placeholder="Inches" 
                  value={heightInches} 
                  onChange={(e) => setHeightInches(e.target.value)} 
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label>Gender</Label>
            <Select value={gender} onValueChange={setGender}>
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
            <Label>Activity Level</Label>
            <Select value={activity} onValueChange={setActivity}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary</SelectItem>
                <SelectItem value="light">Light Exercise</SelectItem>
                <SelectItem value="moderate">Moderate Exercise</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="very-active">Very Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Goal</Label>
            <Select value={goal} onValueChange={setGoal}>
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
          
          <Button onClick={calculateCalories} className="w-full">
            Calculate Calories
          </Button>
          
          {result && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <h3 className="text-lg font-semibold text-green-800">Daily Calorie Target</h3>
                <p className="text-2xl font-bold text-green-600">{result} calories</p>
              </CardContent>
            </Card>
          )}

          {/* Sources and Disclaimer */}
          <div className="pt-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Info className="w-4 h-4" />
              <span className="underline underline-offset-2">Sources and Disclaimer</span>
            </button>

            {showSources && (
              <div className="mt-3 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground">Disclaimer</h4>
                  <p className="mt-1">
                    These calculations are provided for general informational purposes only and are not intended as medical advice, diagnosis, or treatment.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground">How this is calculated</h4>
                  <p className="mt-1">
                    Daily calorie needs are estimated using widely accepted metabolic equations and publicly available nutrition guidance.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground">Sources</h4>
                  <ul className="mt-1 space-y-1.5 list-disc list-inside">
                    <li>
                      Mifflin–St Jeor Equation – Journal of the American Dietetic Association{' '}
                      <a
                        href="https://pubmed.ncbi.nlm.nih.gov/15883556/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline underline-offset-2 break-all"
                      >
                        https://pubmed.ncbi.nlm.nih.gov/15883556/
                      </a>
                    </li>
                    <li>
                      National Institutes of Health (NIH) – Healthy Weight &amp; Calorie Needs{' '}
                      <a
                        href="https://www.nhlbi.nih.gov/health/educational/lose_wt/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline underline-offset-2 break-all"
                      >
                        https://www.nhlbi.nih.gov/health/educational/lose_wt/
                      </a>
                    </li>
                    <li>
                      USDA Dietary Guidelines for Americans{' '}
                      <a
                        href="https://www.dietaryguidelines.gov/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline underline-offset-2 break-all"
                      >
                        https://www.dietaryguidelines.gov/
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground">Additional guidance</h4>
                  <p className="mt-1">
                    Consult a healthcare professional before making significant dietary or lifestyle changes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalorieCalculator;