import { env } from '../config/env';
import { logger } from '../config/logger';
import { NotificationChannel, RitualInstanceRef } from '../types';
import { adapterRegistry } from '../lib/adapters/adapter-registry';
import { notificationLogService } from './notification-log.service';

export interface SendNotificationRequest {
  memberId: string;
  channel: NotificationChannel;
  templateKey: string;
  ritualInstanceRef: RitualInstanceRef;
  metadata?: Record<string, any>;
}

export interface SendNotificationResponse {
  success: boolean;
  notificationId?: string;
  message?: string;
  error?: string;
}

export class NotificationHubService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor() {
    this.baseUrl = env.NOTIFICATION_HUB_URL;
    this.apiKey = env.NOTIFICATION_HUB_API_KEY;
  }

  async sendNotification(
    request: SendNotificationRequest
  ): Promise<SendNotificationResponse> {
    try {
      logger.info({ request }, 'Sending notification to hub');

      // Use adapter registry to send notification
      const result = await adapterRegistry.send({
        memberId: request.memberId,
        channel: request.channel,
        templateKey: request.templateKey,
        ritualInstanceRef: request.ritualInstanceRef,
        body: this.buildNotificationBody(request),
        metadata: request.metadata,
      });

      // Log the notification
      await notificationLogService.createLog({
        memberId: request.memberId,
        notificationType: 'reminder',
        channel: request.channel,
        templateKey: request.templateKey,
        ritualInstanceId: request.metadata?.ritualInstanceId,
        content: {
          ritualInstanceRef: request.ritualInstanceRef,
          metadata: request.metadata,
        },
        status: result.success ? 'sent' : 'failed',
        externalId: result.notificationId,
        errorMessage: result.error,
        hubResponse: result.metadata,
      });

      logger.info({ response: result }, 'Notification sent via adapter');

      return {
        success: result.success,
        notificationId: result.notificationId,
        message: result.message,
        error: result.error,
      };
    } catch (error: any) {
      logger.error({ error, request }, 'Failed to send notification');

      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  private buildNotificationBody(request: SendNotificationRequest): string {
    // Build notification body from request
    const { ritualInstanceRef, templateKey } = request;

    return `
Reminder: ${ritualInstanceRef.title || templateKey}
Scheduled: ${new Date(ritualInstanceRef.ritualDate).toLocaleString()}
Type: ${ritualInstanceRef.ritualType}
    `.trim();
  }

  private async stubNotificationHubCall(
    request: SendNotificationRequest
  ): Promise<SendNotificationResponse> {
    // Stub implementation - simulate HTTP call to unified-notification-hub
    // In production, replace with actual fetch/axios call:
    //
    // const response = await fetch(`${this.baseUrl}/api/notifications/send`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${this.apiKey}`,
    //   },
    //   body: JSON.stringify(request),
    // });
    //
    // return await response.json();

    // Simulate successful response
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

    return {
      success: true,
      notificationId: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      message: `Notification sent via ${request.channel} to member ${request.memberId}`,
    };
  }

  async getNotificationStatus(notificationId: string): Promise<any> {
    // Stub for checking notification status
    logger.info({ notificationId }, 'Checking notification status');

    return {
      notificationId,
      status: 'delivered',
      sentAt: new Date().toISOString(),
    };
  }
}

export const notificationHubService = new NotificationHubService();
