import React, { useState, useMemo, useCallback } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface UserSearchableSelectFixedProps {
  users: User[];
  loading: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onRetry?: () => void;
  placeholder?: string;
  emptyMessage?: string;
  errorMessage?: string;
  className?: string;
  hasError?: boolean;
}

export const UserSearchableSelectFixed: React.FC<UserSearchableSelectFixedProps> = ({
  users,
  loading,
  value,
  onValueChange,
  onRetry,
  placeholder = "Select a user...",
  emptyMessage = "No users found.",
  errorMessage = "Failed to load users.",
  className,
  hasError = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedUser = users.find(user => user.id === value);

  const filteredUsers = useMemo(() => {
    if (!searchValue) return users;
    return users.filter(user => 
      user.full_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      user.email.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [users, searchValue]);

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    }
  }, [onRetry]);

  const renderTriggerContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading users...
        </>
      );
    }
    
    if (hasError) {
      return (
        <>
          <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
          {errorMessage}
        </>
      );
    }
    
    if (selectedUser) {
      return `${selectedUser.full_name} (${selectedUser.email})`;
    }
    
    return placeholder;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading users...
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-4 space-y-2">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-center text-muted-foreground">{errorMessage}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      );
    }

    return (
      <Command>
        <CommandInput 
          placeholder="Search users..." 
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="mt-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>
          </CommandEmpty>
          <CommandGroup>
            {filteredUsers.map((user) => (
              <CommandItem
                key={user.id}
                value={user.id}
                onSelect={() => {
                  onValueChange(user.id === value ? '' : user.id);
                  setOpen(false);
                  setSearchValue('');
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === user.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{user.full_name}</span>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            hasError && "border-red-500 text-red-600",
            className
          )}
          disabled={loading}
        >
          {renderTriggerContent()}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
};