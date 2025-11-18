import { env } from '../config/env';
import { logger } from '../config/logger';
import { NotificationChannel, RitualInstanceRef } from '../types';

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

      // In a real implementation, this would make an HTTP request
      // For now, we'll simulate the call with a stub
      const response = await this.stubNotificationHubCall(request);

      logger.info({ response }, 'Notification hub response');

      return response;
    } catch (error: any) {
      logger.error({ error, request }, 'Failed to send notification');

      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
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
