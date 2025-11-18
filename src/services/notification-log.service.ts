import { prisma } from '../config/database';
import { logger } from '../config/logger';

export interface CreateNotificationLogInput {
  memberId: string;
  notificationType: string;
  channel: string;
  templateKey?: string;
  ritualInstanceId?: string;
  content: Record<string, any>;
  status?: 'sent' | 'failed' | 'bounced';
  externalId?: string;
  errorMessage?: string;
  hubResponse?: Record<string, any>;
}

export class NotificationLogService {
  /**
   * Create a notification log entry
   */
  async createLog(input: CreateNotificationLogInput) {
    const log = await prisma.notificationLog.create({
      data: {
        memberId: input.memberId,
        notificationType: input.notificationType,
        channel: input.channel,
        templateKey: input.templateKey,
        ritualInstanceId: input.ritualInstanceId,
        contentJson: JSON.stringify(input.content),
        status: input.status || 'sent',
        externalId: input.externalId,
        errorMessage: input.errorMessage,
        hubResponseJson: input.hubResponse ? JSON.stringify(input.hubResponse) : undefined,
        sentAt: new Date(),
      },
    });

    logger.debug({ logId: log.id, memberId: input.memberId }, 'Notification log created');

    return this.formatLog(log);
  }

  /**
   * Get logs by member ID
   */
  async getLogsByMember(memberId: string, options?: { limit?: number; offset?: number }) {
    const logs = await prisma.notificationLog.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return logs.map((log) => this.formatLog(log));
  }

  /**
   * Get logs by template
   */
  async getLogsByTemplate(templateKey: string, options?: { limit?: number; offset?: number }) {
    const logs = await prisma.notificationLog.findMany({
      where: { templateKey },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return logs.map((log) => this.formatLog(log));
  }

  /**
   * Get logs by ritual instance
   */
  async getLogsByRitualInstance(ritualInstanceId: string) {
    const logs = await prisma.notificationLog.findMany({
      where: { ritualInstanceId },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => this.formatLog(log));
  }

  /**
   * Get notification statistics
   */
  async getStatistics(filters?: {
    memberId?: string;
    templateKey?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: any = {};

    if (filters?.memberId) {
      where.memberId = filters.memberId;
    }

    if (filters?.templateKey) {
      where.templateKey = filters.templateKey;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate;
      }
    }

    const [total, sent, failed, bounced, byChannel, byType] = await Promise.all([
      prisma.notificationLog.count({ where }),
      prisma.notificationLog.count({ where: { ...where, status: 'sent' } }),
      prisma.notificationLog.count({ where: { ...where, status: 'failed' } }),
      prisma.notificationLog.count({ where: { ...where, status: 'bounced' } }),
      prisma.notificationLog.groupBy({
        by: ['channel'],
        where,
        _count: true,
      }),
      prisma.notificationLog.groupBy({
        by: ['notificationType'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: {
        sent,
        failed,
        bounced,
      },
      byChannel: Object.fromEntries(
        byChannel.map((item) => [item.channel, item._count])
      ),
      byType: Object.fromEntries(
        byType.map((item) => [item.notificationType, item._count])
      ),
    };
  }

  /**
   * Get recent logs
   */
  async getRecentLogs(limit: number = 100) {
    const logs = await prisma.notificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        ritualInstance: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
          },
        },
      },
    });

    return logs.map((log) => this.formatLog(log));
  }

  /**
   * Get failed notifications
   */
  async getFailedNotifications(options?: { limit?: number; offset?: number }) {
    const logs = await prisma.notificationLog.findMany({
      where: {
        status: {
          in: ['failed', 'bounced'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return logs.map((log) => this.formatLog(log));
  }

  private formatLog(log: any) {
    return {
      ...log,
      contentJson: log.contentJson ? JSON.parse(log.contentJson) : {},
      hubResponseJson: log.hubResponseJson ? JSON.parse(log.hubResponseJson) : undefined,
    };
  }
}

export const notificationLogService = new NotificationLogService();
