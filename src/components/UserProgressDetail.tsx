import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Droplets, Weight, Footprints, Flame, Dumbbell, 
  TrendingUp, Calendar, ArrowLeft, Target, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface UserProgressDetailProps {
  user: any;
  trackerData: any;
  workoutProgress: any[];
  onBack: () => void;
}

export const UserProgressDetail: React.FC<UserProgressDetailProps> = ({
  user, trackerData, workoutProgress, onBack
}) => {
  const getLatest = (data: any[], field: string) => data?.[0]?.[field] || 0;
  const getToday = (data: any[], field: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return data?.find(e => e.date?.startsWith(today))?.[field] || 0;
  };
  const getAvg = (data: any[], field: string) => {
    if (!data?.length) return 0;
    return Math.round(data.reduce((a, e) => a + (e[field] || 0), 0) / data.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {user.full_name?.[0] || user.email?.[0]}
          </div>
          <div>
            <p className="font-semibold">{user.full_name || 'Unknown'}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="trackers" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="trackers">Health Trackers</TabsTrigger>
          <TabsTrigger value="workouts">Workout Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="trackers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  Water Intake
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {getToday(trackerData?.water, 'amount')} ml
                    </p>
                    <p className="text-xs text-gray-500">Today</p>
                  </div>
                  <Progress value={(getToday(trackerData?.water, 'amount') / 2000) * 100} />
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      Avg: {getAvg(trackerData?.water, 'amount')} ml/day
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Footprints className="w-4 h-4 text-green-500" />
                  Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {getToday(trackerData?.steps, 'steps').toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Today</p>
                  </div>
                  <Progress value={(getToday(trackerData?.steps, 'steps') / 10000) * 100} />
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      Avg: {getAvg(trackerData?.steps, 'steps').toLocaleString()}/day
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Weight className="w-4 h-4 text-purple-500" />
                  Weight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {getLatest(trackerData?.weight, 'weight')} lbs
                    </p>
                    <p className="text-xs text-gray-500">Current</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      Entries: {trackerData?.weight?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Calories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {getToday(trackerData?.calories, 'calories')}
                    </p>
                    <p className="text-xs text-gray-500">Today</p>
                  </div>
                  <Progress value={(getToday(trackerData?.calories, 'calories') / 2000) * 100} />
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      Avg: {getAvg(trackerData?.calories, 'calories')} kcal/day
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trackerData?.water?.slice(0, 5).map((entry: any, idx: number) => (
                  <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{format(new Date(entry.date), 'MMM dd')}</span>
                    <span className="text-sm font-medium">{entry.amount} ml</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workouts" className="space-y-4">
          <div className="grid gap-4">
            {workoutProgress?.map((prog) => (
              <Card key={prog.programId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Dumbbell className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{prog.programName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={prog.type === 'coach_program' ? 'default' : 'secondary'}>
                            {prog.type === 'coach_program' ? 'Coach Program' : 'Program'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {prog.completedDays}/{prog.totalDays} days
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">{prog.percentage}%</p>
                      <p className="text-xs text-gray-500">Complete</p>
                    </div>
                  </div>
                  <Progress value={prog.percentage} className="mt-3" />
                  {prog.lastActivity && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last activity: {format(new Date(prog.lastActivity), 'MMM dd, yyyy')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProgressDetail;