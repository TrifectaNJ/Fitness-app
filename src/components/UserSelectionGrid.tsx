import React from 'react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { User, TrendingUp, Calendar, CheckCircle } from 'lucide-react';

interface UserSelectionGridProps {
  users: any[];
  selectedUser: string | null;
  onUserSelect: (userId: string) => void;
  loading: boolean;
  searchTerm: string;
}

export const UserSelectionGrid: React.FC<UserSelectionGridProps> = ({
  users,
  selectedUser,
  onUserSelect,
  loading,
  searchTerm
}) => {
  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'No users match your search criteria.' : 'No users available to view.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredUsers.map((user) => (
        <Card 
          key={user.id} 
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedUser === user.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => onUserSelect(user.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>
                  {user.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {user.full_name || 'Unknown User'}
                </h3>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {new Date(user.created_at).toLocaleDateString()}
              </span>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                {user.role}
              </Badge>
            </div>

            {user.last_activity && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                Active {new Date(user.last_activity).toLocaleDateString()}
              </div>
            )}

            {selectedUser === user.id && (
              <div className="mt-3 pt-3 border-t">
                <Button size="sm" className="w-full">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  View Progress
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};