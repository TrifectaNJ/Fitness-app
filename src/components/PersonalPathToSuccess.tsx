import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard } from 'lucide-react';
import PersonalPathForm from './PersonalPathForm';
import PersonalDietPlan from './PersonalDietPlan';
import PurchaseButton from './PurchaseButton';
import { supabase } from '@/lib/supabase';

const PersonalPathToSuccess: React.FC = () => {
  const [step, setStep] = useState<'form' | 'plan' | 'purchased'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);

  const findMatchingPlan = async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Form data received:', data);
      
      setFormData(data);
      
      const weight = parseFloat(data.weight);
      const heightInches = data.totalHeightInches;
      const age = parseFloat(data.age);
      
      console.log('Searching for plans with criteria:', {
        goal: data.goal,
        weight,
        heightInches,
        age,
        gender: data.gender
      });
      
      // Get all plans for the goal first
      const { data: plans, error: planError } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('goal', data.goal);
      
      if (planError) {
        console.error('Database error:', planError);
        throw planError;
      }
      
      console.log('Found plans for goal:', plans);
      
      if (!plans || plans.length === 0) {
        setError(`No diet plans found for goal: ${data.goal}`);
        return;
      }
      
      // Filter plans that match ALL criteria (excluding calories)
      const matchingPlans = plans.filter(plan => {
        console.log('Checking plan:', plan.title);
        
        // Check weight range
        if (plan.min_weight && weight < plan.min_weight) {
          console.log('Weight too low:', weight, '<', plan.min_weight);
          return false;
        }
        if (plan.max_weight && weight > plan.max_weight) {
          console.log('Weight too high:', weight, '>', plan.max_weight);
          return false;
        }
        
        // Check height range
        if (plan.min_height && heightInches < plan.min_height) {
          console.log('Height too low:', heightInches, '<', plan.min_height);
          return false;
        }
        if (plan.max_height && heightInches > plan.max_height) {
          console.log('Height too high:', heightInches, '>', plan.max_height);
          return false;
        }
        
        // Check age range
        if (plan.min_age && age < plan.min_age) {
          console.log('Age too low:', age, '<', plan.min_age);
          return false;
        }
        if (plan.max_age && age > plan.max_age) {
          console.log('Age too high:', age, '>', plan.max_age);
          return false;
        }
        
        // Check gender
        if (plan.target_gender && plan.target_gender !== 'any' && plan.target_gender !== data.gender) {
          console.log('Gender mismatch:', data.gender, '!=', plan.target_gender);
          return false;
        }
        
        console.log('Plan matches all criteria:', plan.title);
        return true;
      });
      
      console.log('Matching plans:', matchingPlans);
      
      if (matchingPlans.length === 0) {
        setError(`No matching diet plan found for your criteria:\n- Age: ${age}\n- Gender: ${data.gender}\n- Weight: ${weight} lbs\n- Height: ${Math.floor(heightInches/12)}'${heightInches%12}"\n- Goal: ${data.goal}\n\nPlease contact support.`);
        return;
      }
      
      setSelectedPlan(matchingPlans[0]);
      setStep('plan');
    } catch (err: any) {
      console.error('Error finding plan:', err);
      setError(err.message || 'Failed to find matching plan');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSuccess = () => {
    setStep('purchased');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Finding your perfect plan...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {step === 'form' && (
        <>
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Personal Path to Success</h1>
            <p className="text-gray-600">Get a tailored diet plan based on your goals and preferences</p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription style={{whiteSpace: 'pre-line'}}>{error}</AlertDescription>
            </Alert>
          )}
          
          <PersonalPathForm onSubmit={findMatchingPlan} />
        </>
      )}
      
      {step === 'plan' && selectedPlan && (
        <>
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Your Personal Diet Plan</h1>
            <p className="text-gray-600">Customized for your goals and lifestyle</p>
          </div>
          
          <PersonalDietPlan plan={selectedPlan} />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Unlock Your Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Get lifetime access to your personalized diet plan for just $29.99</p>
              <PurchaseButton 
                programId={selectedPlan.id}
                programTitle={selectedPlan.title}
                price={29.99}
                onSuccess={handlePurchaseSuccess}
              />
              <Button 
                variant="outline" 
                onClick={() => setStep('form')} 
                className="ml-2"
              >
                Back to Form
              </Button>
            </CardContent>
          </Card>
        </>
      )}
      
      {step === 'purchased' && selectedPlan && (
        <>
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 text-green-600">Welcome to Your Journey!</h1>
            <p className="text-gray-600">Your personal diet plan is now activated</p>
          </div>
          
          <PersonalDietPlan plan={selectedPlan} />
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Congratulations!</h3>
              <p className="text-green-700">You now have lifetime access to your personalized diet plan. Start your journey to success today!</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default PersonalPathToSuccess;