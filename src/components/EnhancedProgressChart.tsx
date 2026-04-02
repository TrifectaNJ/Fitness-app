import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, Activity } from 'lucide-react';

interface ProgressData {
  date: string;
  weight?: number;
  water?: number;
  steps?: number;
  calories?: number;
  workouts?: number;
}

interface EnhancedProgressChartProps {
  data: ProgressData[];
  type: 'weight' | 'water' | 'steps' | 'calories' | 'workouts';
  title: string;
  color: string;
  unit?: string;
}

const EnhancedProgressChart: React.FC<EnhancedProgressChartProps> = ({
  data,
  type,
  title,
  color,
  unit = ''
}) => {
  const formatValue = (value: number) => {
    if (type === 'steps' && value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  const getIcon = () => {
    switch (type) {
      case 'weight':
        return <TrendingUp className="w-4 h-4" />;
      case 'workouts':
        return <Activity className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const ChartComponent = type === 'workouts' ? BarChart : LineChart;
  const DataComponent = type === 'workouts' ? Bar : Line;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {getIcon()}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                fontSize={12}
                tickFormatter={formatValue}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} ${unit}`, title]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <DataComponent
                dataKey={type}
                stroke={color}
                fill={color}
                strokeWidth={type === 'workouts' ? 0 : 2}
                dot={type !== 'workouts' ? { fill: color, strokeWidth: 2, r: 4 } : undefined}
                activeDot={type !== 'workouts' ? { r: 6, stroke: color, strokeWidth: 2 } : undefined}
              />
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedProgressChart;