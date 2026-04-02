import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ProgressEntry {
  date: string;
  value: number;
  target?: number;
}

interface ProgressDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  color: string;
  unit: string;
  entries: ProgressEntry[];
  userName: string;
}

export const ProgressDetailModal: React.FC<ProgressDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  color,
  unit,
  entries,
  userName
}) => {
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'purple': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'green': return 'bg-green-50 border-green-200 text-green-700';
      case 'orange': return 'bg-orange-50 border-orange-200 text-orange-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const average = entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.value, 0) / entries.length : 0;
  const trend = entries.length > 1 ? entries[entries.length - 1].value - entries[entries.length - 2].value : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title} Progress - {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={`border ${getColorClasses(color)}`}>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Current Value</div>
                <div className="text-2xl font-bold">
                  {entries.length > 0 ? entries[entries.length - 1].value : 0} {unit}
                </div>
              </CardContent>
            </Card>

            <Card className={`border ${getColorClasses(color)}`}>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Average</div>
                <div className="text-2xl font-bold">
                  {average.toFixed(1)} {unit}
                </div>
              </CardContent>
            </Card>

            <Card className={`border ${getColorClasses(color)}`}>
              <CardContent className="p-4">
                <div className="text-sm font-medium flex items-center gap-2">
                  Trend
                  {entries.length > 1 && getTrendIcon(entries[entries.length - 1].value, entries[entries.length - 2].value)}
                </div>
                <div className="text-2xl font-bold">
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)} {unit}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-gray-500">Chart visualization would go here</div>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Historical Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Value</th>
                      <th className="text-left p-2">Target</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.slice(-10).reverse().map((entry, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{entry.date}</td>
                        <td className="p-2">{entry.value} {unit}</td>
                        <td className="p-2">{entry.target ? `${entry.target} ${unit}` : 'N/A'}</td>
                        <td className="p-2">
                          {entry.target ? (
                            <Badge variant={entry.value >= entry.target ? "default" : "secondary"}>
                              {entry.value >= entry.target ? 'Achieved' : 'Pending'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No Target</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};