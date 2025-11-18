/**
 * Notification adapter interface for pluggable notification providers
 */

import { NotificationChannel, RitualInstanceRef } from '../../types';

export interface NotificationMessage {
  memberId: string;
  channel: NotificationChannel;
  templateKey: string;
  ritualInstanceRef?: RitualInstanceRef;
  subject?: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  message?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Base notification adapter interface
 * Implementations can send notifications via different providers
 */
export interface INotificationAdapter {
  /**
   * Unique identifier for this adapter
   */
  readonly name: string;

  /**
   * Supported channels for this adapter
   */
  readonly supportedChannels: NotificationChannel[];

  /**
   * Send a notification
   */
  send(message: NotificationMessage): Promise<NotificationResult>;

  /**
   * Check if adapter supports a given channel
   */
  supports(channel: NotificationChannel): boolean;

  /**
   * Health check for the adapter
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Base abstract class for notification adapters
 */
export abstract class BaseNotificationAdapter implements INotificationAdapter {
  abstract readonly name: string;
  abstract readonly supportedChannels: NotificationChannel[];

  abstract send(message: NotificationMessage): Promise<NotificationResult>;

  supports(channel: NotificationChannel): boolean {
    return this.supportedChannels.includes(channel);
  }

  async healthCheck(): Promise<boolean> {
    // Default implementation - can be overridden
    return true;
  }
}
