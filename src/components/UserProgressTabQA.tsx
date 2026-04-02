import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Shield, TrendingUp, Activity, Droplets, Scale, Footprints, Flame, Dumbbell, Calendar, Download, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { useUserProgressDataQA } from '../hooks/useUserProgressDataQA';
import { useUserProgramsData } from '../hooks/useUserProgramsData';
import { ProgressFilters } from './ProgressFilters';
import { UserProgramsSection } from './UserProgramsSection';
import { downloadCSV, downloadPDF } from '../utils/exportUtils';
import { format, subDays } from 'date-fns';

interface UserProgressTabQAProps {
  currentUserId: string;
  userRole: string;
}

export function UserProgressTabQA({ currentUserId, userRole }: UserProgressTabQAProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [progressType, setProgressType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const { progressData, users, loading, error, hasPermission, refetch } = useUserProgressDataQA(
    currentUserId, 
    userRole, 
    selectedUserId
  );

  // Get programs data for selected user
  const { 
    programs, 
    loading: programsLoading, 
    error: programsError 
  } = useUserProgramsData(
    selectedUserId === 'all' ? '' : selectedUserId, 
    currentUserId, 
    userRole
  );

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

  // Filter data
  const filteredData = progressData.filter(item => {
    const { start, end } = getDateRange();
    const itemDate = new Date(item.date);
    const dateInRange = itemDate >= start && itemDate <= end;
    const typeMatch = progressType === 'all' || item.type === progressType;
    const searchMatch = !searchQuery || 
      item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    return dateInRange && typeMatch && searchMatch;
  });

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const exportData = filteredData.map(item => ({
        userId: item.userId,
        userName: item.userName,
        userEmail: item.userEmail,
        date: format(new Date(item.date), 'yyyy-MM-dd'),
        type: item.type,
        value: item.value,
        unit: item.unit,
        target: item.target || ''
      }));
      downloadCSV(exportData, `progress-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const exportData = filteredData.map(item => ({
        userId: item.userId,
        userName: item.userName,
        userEmail: item.userEmail,
        date: format(new Date(item.date), 'yyyy-MM-dd'),
        type: item.type,
        value: item.value,
        unit: item.unit,
        target: item.target || ''
      }));
      downloadPDF(exportData, `progress-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
            You don't have permission to view this user's progress.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
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
          <AlertDescription className="flex items-center justify-between">
            Error loading progress data: {error}
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Group data by type
  const groupedData = filteredData.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, typeof filteredData>);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Progress</h2>
        <div className="flex items-center gap-2">
          {(userRole === 'admin' || userRole === 'super_admin') && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportCSV}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'CSV'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'PDF'}
              </Button>
            </>
          )}
          <Badge variant="secondary">{userRole} View</Badge>
        </div>
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
        canSearch={userRole === 'admin' || userRole === 'super_admin'}
        users={users}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedData).map(([type, data]) => {
          const latest = data[data.length - 1];
          const total = data.reduce((sum, item) => sum + item.value, 0);
          const avg = total / data.length;
          const progress = latest?.target ? Math.min((latest.value / latest.target) * 100, 100) : 0;

          return (
            <Card key={type} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                  {getIcon(type)}
                  {type}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {type === 'weight' ? avg.toFixed(1) : Math.round(total)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {latest?.unit || ''}
                  </span>
                </div>
                {latest?.target && (
                  <>
                    <Progress value={progress} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {latest.value} / {latest.target} {latest.unit}
                    </p>
                  </>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {data.length} entries
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Programs Section */}
      {selectedUserId !== 'all' && (
        <UserProgramsSection 
          programs={programs} 
          loading={programsLoading} 
        />
      )}

      {Object.keys(groupedData).length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No progress data found for the selected filters.</p>
            <Button variant="outline" className="mt-4" onClick={refetch}>
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}