import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timer, Play, Pause, RotateCcw, Plus, Edit, Trash2, Clock } from 'lucide-react';

interface TimerPreset {
  id: string;
  name: string;
  description?: string;
  duration: number;
  type: 'workout' | 'rest' | 'warmup' | 'cooldown' | 'custom';
  color: string;
  createdAt: string;
}

const AdminTimerManager: React.FC = () => {
  const [timers, setTimers] = useState<TimerPreset[]>([
    { id: '1', name: 'Quick Rest', duration: 30, type: 'rest', color: '#10B981', createdAt: new Date().toISOString() },
    { id: '2', name: 'Standard Workout', duration: 45, type: 'workout', color: '#F59E0B', createdAt: new Date().toISOString() },
    { id: '3', name: 'Long Rest', duration: 60, type: 'rest', color: '#10B981', createdAt: new Date().toISOString() }
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingTimer, setEditingTimer] = useState<TimerPreset | null>(null);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', duration: 30, type: 'workout' as TimerPreset['type'], color: '#F59E0B'
  });

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsRunning(false);
            setActiveTimer(null);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = (timer: TimerPreset) => {
    setActiveTimer(timer.id);
    setTimeLeft(timer.duration);
    setIsRunning(true);
  };

  const handlePauseResume = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    const timer = timers.find(t => t.id === activeTimer);
    if (timer) {
      setTimeLeft(timer.duration);
      setIsRunning(false);
    }
  };

  const handleStopTimer = () => {
    setActiveTimer(null);
    setTimeLeft(0);
    setIsRunning(false);
  };

  const handleSaveTimer = () => {
    if (editingTimer) {
      setTimers(prev => prev.map(t => t.id === editingTimer.id ? { ...t, ...formData } : t));
    } else {
      const newTimer: TimerPreset = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setTimers(prev => [...prev, newTimer]);
    }
    handleCloseForm();
  };

  const handleEdit = (timer: TimerPreset) => {
    setEditingTimer(timer);
    setFormData({
      name: timer.name,
      description: timer.description || '',
      duration: timer.duration,
      type: timer.type,
      color: timer.color
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this timer?')) {
      setTimers(prev => prev.filter(t => t.id !== id));
      if (activeTimer === id) {
        handleStopTimer();
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTimer(null);
    setFormData({ name: '', description: '', duration: 30, type: 'workout', color: '#F59E0B' });
  };

  const activeTimerData = timers.find(t => t.id === activeTimer);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Timer Manager
          </h1>
          <p className="text-gray-600 mt-1">Create and manage workout timers</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Timer
        </Button>
      </div>

      {activeTimer && activeTimerData && (
        <Card className="border-2" style={{ borderColor: activeTimerData.color }}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeTimerData.color }} />
                <h2 className="text-xl font-semibold">{activeTimerData.name}</h2>
              </div>
              <div className="text-6xl font-mono font-bold" style={{ color: activeTimerData.color }}>
                {formatTime(timeLeft)}
              </div>
              <div className="flex justify-center gap-2">
                <Button onClick={handlePauseResume} size="lg">
                  {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg">
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button onClick={handleStopTimer} variant="destructive" size="lg">
                  Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['workout', 'rest', 'warmup', 'cooldown'].map(type => {
          const count = timers.filter(t => t.type === type).length;
          return (
            <Card key={type}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">{type} Timers</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {timers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No timers yet</h3>
            <p className="text-gray-500 text-center mb-4">Create your first timer preset</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />Create Timer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timers.map((timer) => (
            <Card key={timer.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: timer.color }} />
                    <h3 className="font-semibold">{timer.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(timer)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(timer.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-mono font-bold" style={{ color: timer.color }}>
                    {formatTime(timer.duration)}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">{timer.type} timer</div>
                  {timer.description && (
                    <p className="text-sm text-gray-500">{timer.description}</p>
                  )}
                  <Button 
                    onClick={() => handleStartTimer(timer)} 
                    className="w-full" 
                    disabled={activeTimer === timer.id}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {activeTimer === timer.id ? 'Running' : 'Start Timer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTimer ? 'Edit Timer' : 'Create New Timer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Timer Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Quick Rest"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Timer description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                />
              </div>
              <div>
                <Label>Timer Type</Label>
                <Select value={formData.type} onValueChange={(value: TimerPreset['type']) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workout">Workout</SelectItem>
                    <SelectItem value="rest">Rest</SelectItem>
                    <SelectItem value="warmup">Warm-up</SelectItem>
                    <SelectItem value="cooldown">Cool-down</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="color">Timer Color</Label>
              <div className="flex gap-2 mt-2">
                {['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#F97316'].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseForm}>Cancel</Button>
              <Button onClick={handleSaveTimer}>{editingTimer ? 'Update' : 'Create'} Timer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTimerManager;