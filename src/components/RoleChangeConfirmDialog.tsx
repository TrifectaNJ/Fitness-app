import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Crown, Shield, UserCheck, User } from 'lucide-react';

interface RoleChangeConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentRole: string;
  newRole: string;
  userEmail: string;
}

const RoleChangeConfirmDialog: React.FC<RoleChangeConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentRole,
  newRole,
  userEmail
}) => {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'coach': return 'Coach';
      case 'user': return 'User';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'coach': return <UserCheck className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getConfirmationMessage = () => {
    const currentRoleLabel = getRoleLabel(currentRole);
    const newRoleLabel = getRoleLabel(newRole);

    if (newRole === 'user') {
      return `Are you sure you want to change ${userEmail} from ${currentRoleLabel} to ${newRoleLabel}? This will remove all admin access and they will only be able to use the regular user app.`;
    }

    if (currentRole === 'super_admin' && newRole !== 'super_admin') {
      return `Are you sure you want to change ${userEmail} from ${currentRoleLabel} to ${newRoleLabel}? This will remove Super Admin privileges including access to System Control and Admin Invites.`;
    }

    if (currentRole === 'admin' && newRole === 'coach') {
      return `Are you sure you want to change ${userEmail} from ${currentRoleLabel} to ${newRoleLabel}? This will limit their access to content management only and remove Settings access.`;
    }

    if (newRole === 'super_admin') {
      return `Are you sure you want to promote ${userEmail} to ${newRoleLabel}? This will grant full system access including System Control and Admin Invites.`;
    }

    if (newRole === 'admin') {
      return `Are you sure you want to change ${userEmail} to ${newRoleLabel}? This will grant access to most admin features except System Control.`;
    }

    if (newRole === 'coach') {
      return `Are you sure you want to change ${userEmail} to ${newRoleLabel}? This will limit access to content management and user viewing only.`;
    }

    return `Are you sure you want to change ${userEmail} from ${currentRoleLabel} to ${newRoleLabel}?`;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getRoleIcon(newRole)}
            Change Role to {getRoleLabel(newRole)}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {getConfirmationMessage()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={newRole === 'user' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}
          >
            Change Role
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RoleChangeConfirmDialog;