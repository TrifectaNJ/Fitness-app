import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Bell, Volume2, Monitor, Mail, Clock, MessageSquare, AtSign, Settings, Trophy } from 'lucide-react';
import { useNotificationSystem, NotificationPreferences } from '@/hooks/useNotificationSystem';
import { toast } from '@/components/ui/use-toast';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const { preferences, updatePreferences, requestNotificationPermission } = useNotificationSystem(userId);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!preferences) return;

    setSaving(true);
    try {
      await updatePreferences({ [key]: value });
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast({
        title: "Permission granted",
        description: "You'll now receive desktop notifications.",
      });
    } else {
      toast({
        title: "Permission denied",
        description: "Desktop notifications are disabled in your browser.",
        variant: "destructive"
      });
    }
  };

  if (!preferences) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Notification Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Control how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <Label htmlFor="push-enabled">Push Notifications</Label>
                </div>
                <Switch
                  id="push-enabled"
                  checked={preferences.push_enabled}
                  onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  <Label htmlFor="desktop-enabled">Desktop Notifications</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="desktop-enabled"
                    checked={preferences.desktop_enabled}
                    onCheckedChange={(checked) => handleToggle('desktop_enabled', checked)}
                    disabled={saving}
                  />
                  {!('Notification' in window) || Notification.permission === 'denied' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRequestPermission}
                      className="text-xs"
                    >
                      Enable
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <Label htmlFor="email-enabled">Email Notifications</Label>
                </div>
                <Switch
                  id="email-enabled"
                  checked={preferences.email_enabled}
                  onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sound Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Volume2 className="w-5 h-5" />
                Sound Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-enabled">Sound Alerts</Label>
                <Switch
                  id="sound-enabled"
                  checked={preferences.sound_enabled}
                  onCheckedChange={(checked) => handleToggle('sound_enabled', checked)}
                  disabled={saving}
                />
              </div>

              {preferences.sound_enabled && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound-type">Sound Type</Label>
                  <Select
                    value={preferences.sound_type}
                    onValueChange={(value) => handleToggle('sound_type', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="chime">Chime</SelectItem>
                      <SelectItem value="bell">Bell</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Types</CardTitle>
              <CardDescription>
                Choose which types of notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <Label htmlFor="message-notifications">New Messages</Label>
                </div>
                <Switch
                  id="message-notifications"
                  checked={preferences.message_notifications}
                  onCheckedChange={(checked) => handleToggle('message_notifications', checked)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AtSign className="w-4 h-4" />
                  <Label htmlFor="mention-notifications">Mentions</Label>
                </div>
                <Switch
                  id="mention-notifications"
                  checked={preferences.mention_notifications}
                  onCheckedChange={(checked) => handleToggle('mention_notifications', checked)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <Label htmlFor="goal-notifications">Goal Achievements</Label>
                </div>
                <Switch
                  id="goal-notifications"
                  checked={preferences.goal_notifications}
                  onCheckedChange={(checked) => handleToggle('goal_notifications', checked)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <Label htmlFor="system-notifications">System Updates</Label>
                </div>
                <Switch
                  id="system-notifications"
                  checked={preferences.system_notifications}
                  onCheckedChange={(checked) => handleToggle('system_notifications', checked)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5" />
                Quiet Hours
              </CardTitle>
              <CardDescription>
                Disable notifications during specific hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="quiet-hours-enabled">Enable Quiet Hours</Label>
                <Switch
                  id="quiet-hours-enabled"
                  checked={preferences.quiet_hours_enabled}
                  onCheckedChange={(checked) => handleToggle('quiet_hours_enabled', checked)}
                  disabled={saving}
                />
              </div>

              {preferences.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <Select
                      value={preferences.quiet_hours_start}
                      onValueChange={(value) => handleToggle('quiet_hours_start', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quiet-end">End Time</Label>
                    <Select
                      value={preferences.quiet_hours_end}
                      onValueChange={(value) => handleToggle('quiet_hours_end', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};