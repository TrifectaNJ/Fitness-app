import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Edit, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminDietPlanManagerForm from './AdminDietPlanManagerForm';

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

const AdminDietPlanManager: React.FC = () => {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const emptyPlan: DietPlan = {
    title: '',
    goal: '',
    calorie_range_min: 1200,
    calorie_range_max: 2000,
    water_intake: 64,
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: '',
    suggested_steps: 8000,
    min_weight: 100,
    max_weight: 300,
    min_height: 4,
    max_height: 7,
    min_age: 18,
    max_age: 80,
    target_gender: 'any'
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPlans(data || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const savePlan = async () => {
    if (!editingPlan) return;
    
    setLoading(true);
    try {
      if (editingPlan.id) {
        const { error } = await supabase
          .from('diet_plans')
          .update(editingPlan)
          .eq('id', editingPlan.id);
        
        if (error) throw error;
        setMessage({ type: 'success', text: 'Plan updated successfully!' });
      } else {
        const { error } = await supabase
          .from('diet_plans')
          .insert([editingPlan]);
        
        if (error) throw error;
        setMessage({ type: 'success', text: 'Plan created successfully!' });
      }
      
      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      const { error } = await supabase
        .from('diet_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setMessage({ type: 'success', text: 'Plan deleted successfully!' });
      fetchPlans();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Diet Plan Manager</h2>
        <Button onClick={() => setEditingPlan(emptyPlan)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Plan
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {editingPlan && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPlan.id ? 'Edit Plan' : 'Create New Plan'}</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminDietPlanManagerForm
              editingPlan={editingPlan}
              setEditingPlan={setEditingPlan}
              onSave={savePlan}
              onCancel={() => setEditingPlan(null)}
              loading={loading}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{plan.title}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {plan.goal} • {plan.calorie_range_min}-{plan.calorie_range_max} cal
                  </p>
                  {(plan.min_weight || plan.max_weight || plan.min_height || plan.max_height || plan.min_age || plan.max_age || plan.target_gender !== 'any') && (
                    <p className="text-xs text-gray-500 mt-1">
                      Criteria: {plan.min_weight && `${plan.min_weight}-${plan.max_weight}lbs`} 
                      {plan.min_height && ` • ${plan.min_height}-${plan.max_height}ft`}
                      {plan.min_age && ` • ${plan.min_age}-${plan.max_age}y`}
                      {plan.target_gender !== 'any' && ` • ${plan.target_gender}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingPlan(plan)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deletePlan(plan.id!)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDietPlanManager;