import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';

interface RawEntry {
  id?: string;
  date: string;
  value: number;
  notes?: string;
  meal_tag?: string;
  created_at?: string;
  // legacy fields (if pre-aggregated data is passed)
  goalMet?: boolean;
}

interface ProgressChartProps {
  data: RawEntry[];
  trackerName: string;
  unit: string;
  dailyGoal: number;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  data,
  trackerName,
  unit,
  dailyGoal
}) => {
  const isWeightTracker = trackerName.toLowerCase().includes('weight');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Aggregate raw entries by day
  const aggregateByDay = (): { date: string; value: number; formattedDate: string; goalMet: boolean }[] => {
    // Collect all unique dates, sorted ascending
    const dateSet = new Set(data.map(e => e.date));
    const sortedDates = Array.from(dateSet).sort();

    return sortedDates.map(date => {
      const dayEntries = data.filter(e => e.date === date);

      let value: number;
      if (isWeightTracker) {
        // Use the last entry of the day (most recent weigh-in)
        // Sort by created_at if available
        const sorted = [...dayEntries].sort((a, b) => {
          if (a.created_at && b.created_at) return a.created_at.localeCompare(b.created_at);
          return 0;
        });
        value = sorted[sorted.length - 1].value;
      } else {
        // Sum all entries for the day
        value = dayEntries.reduce((sum, e) => sum + e.value, 0);
      }

      const goalMet = isWeightTracker
        ? value <= dailyGoal // at or below target weight
        : value >= dailyGoal;

      return {
        date,
        value,
        formattedDate: formatDate(date),
        goalMet
      };
    });
  };

  const chartData = aggregateByDay();

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data to display yet
      </div>
    );
  }

  // Pick chart color by tracker type
  const lineColor = isWeightTracker ? '#9333ea' :
    trackerName.toLowerCase().includes('water') ? '#3b82f6' :
    trackerName.toLowerCase().includes('step') ? '#22c55e' :
    '#f97316';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg text-sm">
          <p className="font-semibold text-gray-800 mb-1">{label}</p>
          <p style={{ color: lineColor }}>
            {isWeightTracker ? 'Weight' : 'Value'}: {point.value.toLocaleString()} {unit}
          </p>
          {dailyGoal > 0 && (
            <p className="text-gray-500">
              {isWeightTracker ? 'Target' : 'Goal'}: {dailyGoal.toLocaleString()} {unit}
            </p>
          )}
          {dailyGoal > 0 && (
            <p className={`font-medium ${point.goalMet ? 'text-green-600' : 'text-red-500'}`}>
              {isWeightTracker
                ? (point.goalMet ? '✓ At/below goal' : '↓ Above goal')
                : (point.goalMet ? '✓ Goal met' : '✗ Goal missed')}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Weight uses line chart to show trend; others use bar chart
  return (
    <div className="space-y-3">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {isWeightTracker ? (
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(v) => v.toFixed(0)}
              />
              <Tooltip content={<CustomTooltip />} />
              {dailyGoal > 0 && (
                <ReferenceLine
                  y={dailyGoal}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{ value: 'Goal', position: 'insideTopRight', fontSize: 11, fill: '#ef4444' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                dot={{ fill: lineColor, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip content={<CustomTooltip />} />
              {dailyGoal > 0 && (
                <ReferenceLine
                  y={dailyGoal}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{ value: 'Goal', position: 'insideTopRight', fontSize: 11, fill: '#ef4444' }}
                />
              )}
              <Bar
                dataKey="value"
                fill={lineColor}
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: lineColor }}></div>
          <span>{isWeightTracker ? 'Weight (lbs)' : `Daily ${unit}`}</span>
        </div>
        {dailyGoal > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-red-500"></div>
            <span>{isWeightTracker ? 'Target weight' : 'Daily goal'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
