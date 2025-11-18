import { logger } from '../config/logger';
import { memberPreferenceService } from './member-preference.service';
import { notificationHubService } from './notification-hub.service';
import { reminderService } from './reminder.service';

export class ReminderProcessorService {
  private isProcessing = false;

  /**
   * Process all pending reminders that are due
   * This should be called periodically by the cron job
   */
  async processPendingReminders() {
    if (this.isProcessing) {
      logger.debug('Reminder processing already in progress, skipping');
      return;
    }

    this.isProcessing = true;

    try {
      const now = new Date();
      logger.info({ now }, 'Processing pending reminders');

      // Get all pending reminders that are due
      const pendingReminders = await reminderService.getPendingReminders(now);

      logger.info({ count: pendingReminders.length }, 'Found pending reminders');

      // Process each reminder
      for (const reminder of pendingReminders) {
        await this.processReminder(reminder);
      }

      logger.info('Finished processing reminders');
    } catch (error) {
      logger.error({ error }, 'Error processing reminders');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single reminder
   */
  private async processReminder(reminder: any) {
    try {
      logger.info({ reminderId: reminder.id, memberId: reminder.memberId }, 'Processing reminder');

      // Send notification via notification hub
      const response = await notificationHubService.sendNotification({
        memberId: reminder.memberId,
        channel: reminder.channel,
        templateKey: reminder.templateKey,
        ritualInstanceRef: reminder.ritualInstanceRefJson,
        metadata: {
          reminderId: reminder.id,
          sendAt: reminder.sendAt,
        },
      });

      if (response.success) {
        // Mark as sent
        await reminderService.updateReminderStatus(
          reminder.id,
          'sent',
          undefined,
          JSON.stringify(response)
        );

        // Update member's last notified time
        await memberPreferenceService.updateLastNotified(reminder.memberId);

        logger.info(
          { reminderId: reminder.id, notificationId: response.notificationId },
          'Reminder sent successfully'
        );
      } else {
        // Mark as failed
        await reminderService.updateReminderStatus(
          reminder.id,
          'failed',
          response.error || 'Unknown error',
          JSON.stringify(response)
        );

        logger.error(
          { reminderId: reminder.id, error: response.error },
          'Failed to send reminder'
        );
      }
    } catch (error: any) {
      logger.error({ error, reminderId: reminder.id }, 'Error processing reminder');

      // Mark as failed
      await reminderService.updateReminderStatus(
        reminder.id,
        'failed',
        error.message || 'Unknown error'
      );
    }
  }

  /**
   * Get processing status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
    };
  }
}

export const reminderProcessorService = new ReminderProcessorService();
