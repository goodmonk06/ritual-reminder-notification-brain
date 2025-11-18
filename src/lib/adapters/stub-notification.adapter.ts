/**
 * Stub notification adapter for testing and development
 * Simulates sending notifications without actually sending them
 */

import { logger } from '../../config/logger';
import { NotificationChannel } from '../../types';
import {
  BaseNotificationAdapter,
  NotificationMessage,
  NotificationResult,
} from './notification.adapter';

export class StubNotificationAdapter extends BaseNotificationAdapter {
  readonly name = 'stub';
  readonly supportedChannels: NotificationChannel[] = ['email', 'slack', 'push', 'sms'];

  private sentMessages: NotificationMessage[] = [];

  async send(message: NotificationMessage): Promise<NotificationResult> {
    logger.info({ message }, 'Stub adapter: Simulating notification send');

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Store message for testing
    this.sentMessages.push(message);

    // Simulate 95% success rate
    const success = Math.random() > 0.05;

    if (success) {
      return {
        success: true,
        notificationId: `stub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        message: `Notification sent via ${message.channel} to ${message.memberId}`,
        metadata: {
          adapter: this.name,
          simulatedDelay: 100,
        },
      };
    } else {
      return {
        success: false,
        error: 'Simulated random failure (5% chance)',
        metadata: {
          adapter: this.name,
        },
      };
    }
  }

  /**
   * Get all sent messages (for testing)
   */
  getSentMessages(): NotificationMessage[] {
    return [...this.sentMessages];
  }

  /**
   * Clear sent messages (for testing)
   */
  clearSentMessages(): void {
    this.sentMessages = [];
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
