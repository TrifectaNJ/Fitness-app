import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, Hash, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender_name?: string;
  receiver_name?: string;
}

interface MessageSearchPanelProps {
  currentUserId: string;
  onMessageSelect: (messageId: string, conversationId: string) => void;
}

export const MessageSearchPanel: React.FC<MessageSearchPanelProps> = ({
  currentUserId,
  onMessageSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    sender: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    keywords: [] as string[]
  });
  const [showFilters, setShowFilters] = useState(false);
  const [users, setUsers] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() || filters.sender || filters.dateFrom || filters.dateTo) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery, filters]);

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .neq('id', currentUserId);
      
      setUsers(data?.map(u => ({ id: u.id, name: u.full_name || 'Unknown' })) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim() && !filters.sender && !filters.dateFrom && !filters.dateTo) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('messages')
        .select(`
          id, message, created_at, sender_id, receiver_id,
          sender:user_profiles!messages_sender_id_fkey(full_name),
          receiver:user_profiles!messages_receiver_id_fkey(full_name)
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      if (searchQuery.trim()) {
        query = query.ilike('message', `%${searchQuery}%`);
      }

      if (filters.sender) {
        query = query.or(`sender_id.eq.${filters.sender},receiver_id.eq.${filters.sender}`);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedResults = data?.map(msg => ({
        ...msg,
        sender_name: msg.sender?.full_name || 'Unknown',
        receiver_name: msg.receiver?.full_name || 'Unknown'
      })) || [];

      setResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = (keyword: string) => {
    if (keyword && !filters.keywords.includes(keyword)) {
      setFilters(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
    }
  };

  const removeKeyword = (keyword: string) => {
    setFilters(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const clearFilters = () => {
    setFilters({
      sender: '',
      dateFrom: null,
      dateTo: null,
      keywords: []
    });
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-1"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </Button>
        {(searchQuery || filters.sender || filters.dateFrom || filters.dateTo) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showFilters && (
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Sender</label>
              <Select value={filters.sender} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, sender: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select sender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All senders</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, 'MMM dd') : 'From'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, 'MMM dd') : 'To'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {filters.keywords.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Keywords</label>
              <div className="flex flex-wrap gap-2">
                {filters.keywords.map(keyword => (
                  <Badge key={keyword} variant="secondary" className="flex items-center space-x-1">
                    <Hash className="h-3 w-3" />
                    <span>{keyword}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeKeyword(keyword)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="space-y-2">
        {loading && (
          <div className="text-center py-4 text-gray-500">
            Searching messages...
          </div>
        )}
        
        {!loading && results.length === 0 && (searchQuery || filters.sender) && (
          <div className="text-center py-4 text-gray-500">
            No messages found matching your search criteria.
          </div>
        )}

        {results.map(result => (
          <Card 
            key={result.id}
            className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onMessageSelect(result.id, 
              result.sender_id === currentUserId ? result.receiver_id : result.sender_id
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">
                    {result.sender_id === currentUserId ? 'You' : result.sender_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    to {result.receiver_id === currentUserId ? 'You' : result.receiver_name}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {result.message}
                </p>
              </div>
              <span className="text-xs text-gray-500 ml-2">
                {format(new Date(result.created_at), 'MMM dd, HH:mm')}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};