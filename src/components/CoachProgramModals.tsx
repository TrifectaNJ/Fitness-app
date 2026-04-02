import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';

interface Program {
  id: string;
  title: string;
  description: string;
  user_id: string;
  coach_id: string;
  is_active: boolean;
  created_at: string;
  user_name?: string;
  structure?: { weeks: any[] };
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface CoachProgramModalsProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  showDetailModal: boolean;
  setShowDetailModal: (show: boolean) => void;
  selectedProgram: Program | null;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  selectedUserId: string;
  setSelectedUserId: (userId: string) => void;
  users: User[];
  saving: boolean;
  handleCreateProgram: () => void;
  handleEditProgram: () => void;
}

export const CoachProgramModals: React.FC<CoachProgramModalsProps> = ({
  showCreateModal,
  setShowCreateModal,
  showEditModal,
  setShowEditModal,
  showDetailModal,
  setShowDetailModal,
  selectedProgram,
  title,
  setTitle,
  description,
  setDescription,
  selectedUserId,
  setSelectedUserId,
  users,
  saving,
  handleCreateProgram,
  handleEditProgram
}) => {
  return (
    <>
      {/* Create Program Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Coach Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Program Title *</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter program title" 
                disabled={saving} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe the program" 
                rows={3} 
                disabled={saving} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Assign to User *</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name} (${user.email})` 
                        : user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleCreateProgram} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Program
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Program Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Program Title *</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter program title" 
                disabled={saving} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe the program" 
                rows={3} 
                disabled={saving} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Assign to User *</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name} (${user.email})` 
                        : user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleEditProgram} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Program
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Program Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProgram?.title} - Program Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProgram?.structure?.weeks?.map((week, weekIndex) => (
              <Card key={week.id || weekIndex}>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{week.title}</h4>
                  <div className="space-y-2">
                    {week.days?.map((day: any, dayIndex: number) => (
                      <div key={day.id || dayIndex} className="p-2 bg-gray-50 rounded">
                        <span className="font-medium">{day.title}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({day.exercises?.length || 0} exercises)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};