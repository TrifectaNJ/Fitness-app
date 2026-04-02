import { supabase } from '@/lib/supabase';

export interface CreateNotificationParams {
  userId: string;
  type: 'message' | 'mention' | 'system' | 'goal_achievement' | 'program_completion' | 'diet_plan' | 'workout_reminder';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export async function createNotification(params: CreateNotificationParams) {
  const {
    userId,
    type,
    title,
    message,
    data = {},
    priority = 'normal'
  } = params;

  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        priority,
        read: false,
        delivered: false,
        delivery_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// Helper functions for specific notification types
export async function notifyNewDietPlan(userId: string, dietPlanName: string) {
  return createNotification({
    userId,
    type: 'diet_plan',
    title: 'New Diet Plan Available',
    message: `A new diet plan "${dietPlanName}" has been added to your account.`,
    priority: 'high',
    data: { dietPlanName }
  });
}

export async function notifyCoachMessage(userId: string, coachName: string, messagePreview: string) {
  return createNotification({
    userId,
    type: 'message',
    title: `New message from ${coachName}`,
    message: messagePreview,
    priority: 'high',
    data: { coachName }
  });
}

export async function notifyWorkoutReminder(userId: string, workoutName: string) {
  return createNotification({
    userId,
    type: 'workout_reminder',
    title: 'Workout Reminder',
    message: `Don't forget to complete your "${workoutName}" workout today!`,
    priority: 'normal',
    data: { workoutName }
  });
}

export async function notifyProgressMilestone(userId: string, milestone: string, achievement: string) {
  return createNotification({
    userId,
    type: 'goal_achievement',
    title: `🎉 ${milestone} Achieved!`,
    message: achievement,
    priority: 'high',
    data: { milestone, achievement }
  });
}

export async function notifyProgramCompletion(userId: string, programName: string) {
  return createNotification({
    userId,
    type: 'program_completion',
    title: 'Program Completed!',
    message: `Congratulations! You've completed the "${programName}" program.`,
    priority: 'high',
    data: { programName }
  });
}
