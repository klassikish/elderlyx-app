/**
 * Notification Service
 * Handles all notification operations: creation, delivery, read status
 */

import { base44 } from '@/api/base44Client';

export const notificationService = {
  /**
   * Send a notification to a user
   */
  async send(userEmail, { type, title, body, actionUrl }) {
    if (!userEmail || !type || !title || !body) {
      throw new Error('Missing required notification fields');
    }

    return base44.entities.Notification.create({
      user_email: userEmail,
      type,
      title,
      body,
      action_url: actionUrl || null,
      is_read: false,
    });
  },

  /**
   * Get unread notifications for a user
   */
  async getUnread(userEmail, limit = 10) {
    return base44.entities.Notification.filter(
      { user_email: userEmail, is_read: false },
      '-created_date',
      limit
    );
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    return base44.entities.Notification.update(notificationId, {
      is_read: true,
      read_at: new Date().toISOString(),
    });
  },

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead(userEmail) {
    const unread = await this.getUnread(userEmail, 100);
    return Promise.all(unread.map(n => this.markAsRead(n.id)));
  },

  /**
   * Get notification history
   */
  async getHistory(userEmail, limit = 50) {
    return base44.entities.Notification.filter(
      { user_email: userEmail },
      '-created_date',
      limit
    );
  },

  /**
   * Send booking notification
   */
  async notifyBookingCreated(familyEmail, caregiverName, seniorName, scheduledDate) {
    return this.send(familyEmail, {
      type: 'booking',
      title: `Care scheduled with ${caregiverName}`,
      body: `${caregiverName} is booked to visit ${seniorName} on ${new Date(scheduledDate).toLocaleDateString()}`,
    });
  },

  /**
   * Send alert for critical event
   */
  async sendAlert(userEmail, title, body) {
    return this.send(userEmail, {
      type: 'alert',
      title,
      body,
    });
  },
};