import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Users, DollarSign, TrendingUp, Eye } from 'lucide-react';
import AdminDietPlanManager from './AdminDietPlanManager';
import { supabase } from '@/lib/supabase';

interface UserPurchase {
  id: string;
  user_email: string;
  diet_plan_title: string;
  purchase_date: string;
  amount: number;
}

const AdminPersonalPathManager: React.FC = () => {
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [stats, setStats] = useState({
    totalPlans: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { count: plansCount } = await supabase
        .from('diet_plans')
        .select('*', { count: 'exact', head: true });
      
      const { data: purchasesData } = await supabase
        .from('user_diet_plans')
        .select('id, created_at')
        .order('created_at', { ascending: false });
      
      const formattedPurchases = purchasesData?.map(p => ({
        id: p.id,
        user_email: 'User',
        diet_plan_title: 'Personal Diet Plan',
        purchase_date: new Date(p.created_at).toLocaleDateString(),
        amount: 29.99
      })) || [];
      
      setPurchases(formattedPurchases);
      setStats({
        totalPlans: plansCount || 0,
        totalPurchases: formattedPurchases.length,
        totalRevenue: formattedPurchases.length * 29.99,
        activeUsers: formattedPurchases.length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-8 h-8 text-pink-600" />
        <div>
          <h2 className="text-2xl font-bold">Personal Path to Success</h2>
          <p className="text-gray-600">Manage diet plans and track user engagement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Plans</p>
                <p className="text-2xl font-bold">{stats.totalPlans}</p>
              </div>
              <Heart className="w-8 h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Purchases</p>
                <p className="text-2xl font-bold">{stats.totalPurchases}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList>
          <TabsTrigger value="plans">Diet Plans</TabsTrigger>
          <TabsTrigger value="purchases">User Purchases</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="mt-6">
          <AdminDietPlanManager />
        </TabsContent>
        
        <TabsContent value="purchases" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No purchases yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{purchase.user_email}</p>
                        <p className="text-sm text-gray-600">{purchase.diet_plan_title}</p>
                        <p className="text-xs text-gray-500">{purchase.purchase_date}</p>
                      </div>
                      <Badge variant="secondary">${purchase.amount}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPersonalPathManager;