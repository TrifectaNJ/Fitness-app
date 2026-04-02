import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  TrendingUp, 
  Calendar,
  Target,
  Activity
} from 'lucide-react';

interface ProgressEntry {
  date: string;
  value: string;
  note?: string;
}

interface ProgressDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  color: string;
  currentValue: string;
  target: string;
  progress: number;
  trend: number;
  chartData: number[];
  entries: ProgressEntry[];
}

const ProgressDetailPanel: React.FC<ProgressDetailPanelProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  color,
  currentValue,
  target,
  progress,
  trend,
  chartData,
  entries
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white ${color}`}>
              {icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title} Progress</h2>
              <p className="text-gray-600 text-sm">Detailed view and history</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Current</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{currentValue}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Target</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{target}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{progress}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Trend</span>
                </div>
                <div className="flex items-center gap-1">
                  <p className={`text-2xl font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend >= 0 ? '+' : ''}{trend}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">7-Day Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-32 gap-2">
                {chartData.map((value, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`bg-current opacity-70 rounded-sm w-full ${color}`}
                      style={{
                        height: `${(value / Math.max(...chartData)) * 100}%`,
                        minHeight: '8px'
                      }}
                    />
                    <span className="text-xs text-gray-500">
                      {new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Entries Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Entries</CardTitle>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  Read Only
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">{entry.date}</p>
                        {entry.note && (
                          <p className="text-sm text-gray-600">{entry.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{entry.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {entries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No entries found for this tracker</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProgressDetailPanel;