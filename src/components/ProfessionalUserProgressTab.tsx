import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, RefreshCw, Droplets, Weight, Footprints, Flame, Dumbbell, TrendingUp } from 'lucide-react';
import { ProgressDetailModal } from './ProgressDetailModal';

interface ProgressData {
  water: { value: number; target: number; entries: any[] };
  weight: { value: number; target: number; entries: any[] };
  steps: { value: number; target: number; entries: any[] };
  calories: { value: number; target: number; entries: any[] };
  workouts: { completed: number; total: number; entries: any[] };
}

interface UserProgressData {
  id: string;
  name: string;
  email: string;
  progress: ProgressData;
}

interface ModalState {
  isOpen: boolean;
  title: string;
  color: string;
  unit: string;
  entries: any[];
  userName: string;
}

export const ProfessionalUserProgressTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('30');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    color: '',
    unit: '',
    entries: [],
    userName: ''
  });

  const mockUsers: UserProgressData[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      progress: {
        water: { value: 1800, target: 2000, entries: [] },
        weight: { value: 75.2, target: 70, entries: [] },
        steps: { value: 8500, target: 10000, entries: [] },
        calories: { value: 1850, target: 2200, entries: [] },
        workouts: { completed: 4, total: 5, entries: [] }
      }
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      progress: {
        water: { value: 2200, target: 2000, entries: [] },
        weight: { value: 62.8, target: 65, entries: [] },
        steps: { value: 12000, target: 10000, entries: [] },
        calories: { value: 1950, target: 1800, entries: [] },
        workouts: { completed: 5, total: 5, entries: [] }
      }
    }
  ];