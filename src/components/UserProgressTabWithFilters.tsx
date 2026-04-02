import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Shield, TrendingUp, Activity, Droplets, Scale, Footprints, Flame, Dumbbell, Calendar } from 'lucide-react';
import { useUserProgressData } from '../hooks/useUserProgressData';
import { useRolePermissions } from '../hooks/useRolePermissions';
import { ProgressDetailPanel } from './ProgressDetailPanel';
import { ProgressFilters } from './ProgressFilters';
import { downloadCSV, downloadPDF, ExportData } from '../utils/exportUtils';
import { format, subDays } from 'date-fns';

interface UserProgressTabWithFiltersProps {
  currentUserId: string;
  userRole: string;
}

export function UserProgressTabWithFilters({ currentUserId, userRole }: UserProgressTabWithFiltersProps) {
  const { canViewAllUsers, canViewAssignedUsers } = useRolePermissions(userRole);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailType, setDetailType] = useState<string>('');
  
  // Filter states
  const [dateRange, setDateRange] = useState<string>('30');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [progressType, setProgressType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const { 
    progressData, 
    users, 
    loading, 
    error, 
    hasPermission 
  } = useUserProgressData(currentUserId, userRole, selectedUserId);

  // Calculate date range
  const getDateRange = () => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return { start: customStartDate, end: customEndDate };
    }
    const days = parseInt(dateRange);
    return {
      start: subDays(new Date(), days),
      end: new Date()
    };
  };

  // Filter progress data
  const filteredProgressData = progressData.filter(item => {
    const { start, end } = getDateRange();
    const itemDate = new Date(item.date);
    
    const dateInRange = itemDate >= start && itemDate <= end;
    const typeMatch = progressType === 'all' || item.type === progressType;
    
    return dateInRange && typeMatch;
  });

  const handleExportCSV = async () => {
    if (!hasPermission) return;
    
    setIsExporting(true);
    try {
      const exportData: ExportData[] = filteredProgressData.map(item => ({
        userId: item.userId,
        userName: item.userName,
        userEmail: item.userEmail,
        date: format(new Date(item.date), 'yyyy-MM-dd'),
        type: item.type,
        value: item.value,
        unit: item.unit,
        target: item.target
      }));

      const filename = `user-progress-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      downloadCSV(exportData, filename);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!hasPermission) return;
    
    setIsExporting(true);
    try {
      const exportData: ExportData[] = filteredProgressData.map(item => ({
        userId: item.userId,
        userName: item.userName,
        userEmail: item.userEmail,
        date: format(new Date(item.date), 'yyyy-MM-dd'),
        type: item.type,
        value: item.value,
        unit: item.unit,
        target: item.target
      }));

      const filename = `user-progress-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      downloadPDF(exportData, filename);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className="p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view user progress data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Error loading progress data: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Group data by type for display
  const groupedData = filteredProgressData.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, typeof filteredProgressData>);

  const getIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets className="h-5 w-5" />;
      case 'weight': return <Scale className="h-5 w-5" />;
      case 'steps': return <Footprints className="h-5 w-5" />;
      case 'calories': return <Flame className="h-5 w-5" />;
      case 'workouts': return <Dumbbell className="h-5 w-5" />;
      case 'programs': return <Calendar className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Progress</h2>
        <Badge variant="secondary">
          {userRole} View
        </Badge>
      </div>

      <ProgressFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        progressType={progressType}
        setProgressType={setProgressType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        userRole={userRole}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        isExporting={isExporting}
        canSearch={canViewAllUsers}
        users={users}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedData).map(([type, data]) => {
          const latestEntry = data[data.length - 1];
          const totalValue = data.reduce((sum, item) => sum + item.value, 0);
          const avgValue = totalValue / data.length;
          const progress = latestEntry?.target ? calculateProgress(latestEntry.value, latestEntry.target) : 0;

          return (
            <Card 
              key={type} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setDetailUserId(selectedUserId === 'all' ? latestEntry?.userId : selectedUserId);
                setDetailType(type);
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                  {getIcon(type)}
                  {type}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {type === 'weight' ? avgValue.toFixed(1) : Math.round(totalValue)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {latestEntry?.unit || ''}
                  </span>
                </div>
                {latestEntry?.target && (
                  <>
                    <Progress value={progress} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {latestEntry.value} / {latestEntry.target} {latestEntry.unit}
                    </p>
                  </>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {data.length} entries in selected period
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {Object.keys(groupedData).length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No progress data found for the selected filters.</p>
          </CardContent>
        </Card>
      )}

      {detailUserId && detailType && (
        <ProgressDetailPanel
          userId={detailUserId}
          progressType={detailType}
          onClose={() => {
            setDetailUserId(null);
            setDetailType('');
          }}
          dateRange={getDateRange()}
        />
      )}
    </div>
  );
}