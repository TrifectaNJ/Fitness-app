import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProgramAssignment {
  id: string;
  program_name: string;
  assigned_user_name: string;
  assigned_user_email: string;
  status: string;
  start_date: string;
  end_date: string;
  progress_percentage: number;
}

interface ProgramAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: ProgramAssignment | null;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProgramAssignmentModal: React.FC<ProgramAssignmentModalProps> = ({
  open,
  onOpenChange,
  assignment,
  onEdit,
  onDelete
}) => {
  const [loading, setLoading] = useState(false);

  if (!assignment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Program Assignment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{assignment.program_name}</h3>
                  <Badge className={getStatusColor(assignment.status)}>
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{assignment.assigned_user_name}</p>
                    <p className="text-sm text-gray-600">{assignment.assigned_user_email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-sm text-gray-600">
                      {new Date(assignment.start_date).toLocaleDateString()} - {new Date(assignment.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {assignment.status === 'active' && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Progress</span>
                    <span className="text-sm text-gray-600">{assignment.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${assignment.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={onEdit}>
              Edit Program
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};