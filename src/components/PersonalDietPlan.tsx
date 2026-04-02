import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import StyleableComponent from '@/components/StyleableComponent';
import { Droplets, Target, Footprints, Utensils } from 'lucide-react';

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
}

interface PersonalDietPlanProps {
  plan: DietPlan;
}

const PersonalDietPlan: React.FC<PersonalDietPlanProps> = ({ plan }) => {
  const goalLabels = {
    lose: 'Weight Loss',
    maintain: 'Weight Maintenance', 
    gain: 'Weight Gain'
  };

  const fitnessLabels = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
  };

  return (
    <BackgroundWrapper page="diet">
      <StyleableComponent pageKey="diet">
        <div className="space-y-6 p-6">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                {plan.title}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{goalLabels[plan.goal as keyof typeof goalLabels]}</Badge>
                <Badge variant="outline">{fitnessLabels[plan.fitness_level as keyof typeof fitnessLabels]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-2xl font-bold text-blue-600">{plan.water_intake}</span>
                  </div>
                  <div className="text-sm text-gray-600">Ounces of Water</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Footprints className="w-4 h-4 text-green-500" />
                    <span className="text-2xl font-bold text-green-600">{plan.suggested_steps}</span>
                  </div>
                  <div className="text-sm text-gray-600">Daily Steps</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{plan.calorie_range_min}-{plan.calorie_range_max}</div>
                  <div className="text-sm text-gray-600">Calorie Range</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Meal Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Breakfast</h3>
                <p className="text-gray-700">{plan.breakfast}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-2">Lunch</h3>
                <p className="text-gray-700">{plan.lunch}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-2">Dinner</h3>
                <p className="text-gray-700">{plan.dinner}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-2">Snacks</h3>
                <p className="text-gray-700">{plan.snacks}</p>
              </div>
            </CardContent>
          </Card>

          {plan.excluded_allergens && plan.excluded_allergens.length > 0 && (
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Allergen Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">This plan excludes:</p>
                <div className="flex flex-wrap gap-2">
                  {plan.excluded_allergens.map((allergen) => (
                    <Badge key={allergen} variant="destructive">{allergen}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </StyleableComponent>
    </BackgroundWrapper>
  );
};

export default PersonalDietPlan;