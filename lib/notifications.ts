"use client";

const NOTIFICATION_KEY = 'notifications_enabled';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;

  try {
    const permission = await Notification.requestPermission();
    const isEnabled = permission === 'granted';
    localStorage.setItem(NOTIFICATION_KEY, String(isEnabled));
    return isEnabled;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export function areNotificationsEnabled(): boolean {
  if (!('Notification' in window)) return false;
  return localStorage.getItem(NOTIFICATION_KEY) === 'true';
}

export function sendNotification(title: string, options?: NotificationOptions) {
  if (!areNotificationsEnabled()) return;

  try {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

export function scheduleNotification(
  title: string,
  options?: NotificationOptions,
  delay: number = 0
) {
  setTimeout(() => sendNotification(title, options), delay);
}

export function scheduleRecurringNotification(
  title: string,
  options?: NotificationOptions,
  interval: number = 86400000 // Default to daily (24 hours)
) {
  const scheduleNext = () => {
    sendNotification(title, options);
    setTimeout(scheduleNext, interval);
  };

  setTimeout(scheduleNext, interval);
}

export function scheduleWeeklyNotification(
  title: string,
  options?: NotificationOptions,
  dayOfWeek: number = 1, // Monday by default
  hour: number = 9 // 9 AM by default
) {
  const now = new Date();
  const targetDay = new Date();
  
  targetDay.setDate(now.getDate() + ((7 + dayOfWeek - now.getDay()) % 7));
  targetDay.setHours(hour, 0, 0, 0);

  if (targetDay < now) {
    targetDay.setDate(targetDay.getDate() + 7);
  }

  const delay = targetDay.getTime() - now.getTime();
  scheduleRecurringNotification(title, options, 604800000); // Weekly interval
  setTimeout(() => sendNotification(title, options), delay);
}

export function cancelAllNotifications() {
  // This is a placeholder for future implementation
  // Currently, the Web Notifications API doesn't provide a way to cancel scheduled notifications
  console.warn('Cancelling scheduled notifications is not supported in the current implementation');
}