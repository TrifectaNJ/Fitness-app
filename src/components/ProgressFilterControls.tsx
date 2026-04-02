import React from 'react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, Filter, RefreshCw, Calendar, Users, Target } from 'lucide-react';

interface ProgressFilterControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  programFilter: string;
  onProgramFilterChange: (value: string) => void;
  trackerFilter: string;
  onTrackerFilterChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
  totalUsers: number;
  selectedUser: string | null;
}

export const ProgressFilterControls: React.FC<ProgressFilterControlsProps> = ({
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  programFilter,
  onProgramFilterChange,
  trackerFilter,
  onTrackerFilterChange,
  onRefresh,
  loading,
  totalUsers,
  selectedUser
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="w-full lg:w-48">
            <Select value={dateFilter} onValueChange={onDateFilterChange}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 2 weeks</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Program Filter */}
          <div className="w-full lg:w-48">
            <Select value={programFilter} onValueChange={onProgramFilterChange}>
              <SelectTrigger>
                <Target className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="active">Active Programs</SelectItem>
                <SelectItem value="completed">Completed Programs</SelectItem>
                <SelectItem value="coach_programs">Coach Programs</SelectItem>
                <SelectItem value="user_programs">User Programs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tracker Filter */}
          <div className="w-full lg:w-48">
            <Select value={trackerFilter} onValueChange={onTrackerFilterChange}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Trackers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trackers</SelectItem>
                <SelectItem value="water">Water Only</SelectItem>
                <SelectItem value="weight">Weight Only</SelectItem>
                <SelectItem value="steps">Steps Only</SelectItem>
                <SelectItem value="calories">Calories Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Button */}
          <Button 
            onClick={onRefresh} 
            disabled={loading}
            variant="outline"
            className="w-full lg:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Status Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {totalUsers} Users
          </Badge>
          
          {selectedUser && (
            <Badge variant="default" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              User Selected
            </Badge>
          )}

          {searchTerm && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Searching: "{searchTerm}"
            </Badge>
          )}

          {dateFilter !== '30' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateFilter === '7' ? '7 days' : 
               dateFilter === '14' ? '2 weeks' :
               dateFilter === '90' ? '3 months' :
               dateFilter === '180' ? '6 months' :
               dateFilter === '365' ? '1 year' : `${dateFilter} days`}
            </Badge>
          )}

          {programFilter !== 'all' && (
            <Badge variant="outline">
              Program: {programFilter.replace('_', ' ')}
            </Badge>
          )}

          {trackerFilter !== 'all' && (
            <Badge variant="outline">
              Tracker: {trackerFilter}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};