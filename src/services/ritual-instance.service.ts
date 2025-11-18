import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { NotFoundError } from '../lib/errors';

export interface CreateRitualInstanceInput {
  templateKey: string;
  scheduledAt: Date | string;
  title?: string;
  description?: string;
  durationMinutes?: number;
  createdBy?: string;
  metadata?: Record<string, any>;
  participantIds?: string[];
}

export interface UpdateRitualInstanceInput {
  title?: string;
  description?: string;
  durationMinutes?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  metadata?: Record<string, any>;
}

export class RitualInstanceService {
  /**
   * Create a new ritual instance
   */
  async createInstance(input: CreateRitualInstanceInput) {
    // Verify template exists
    const template = await prisma.ritualReminderTemplate.findUnique({
      where: { key: input.templateKey },
    });

    if (!template) {
      throw new NotFoundError('Template', input.templateKey);
    }

    // Create ritual instance
    const instance = await prisma.ritualInstance.create({
      data: {
        templateKey: input.templateKey,
        scheduledAt: new Date(input.scheduledAt),
        title: input.title || template.name,
        description: input.description || template.descriptionMarkdown,
        durationMinutes: input.durationMinutes,
        createdBy: input.createdBy,
        metadataJson: JSON.stringify(input.metadata || {}),
      },
      include: {
        template: true,
      },
    });

    // Add participants if provided
    if (input.participantIds && input.participantIds.length > 0) {
      await this.addParticipants(instance.id, input.participantIds);
    }

    logger.info({ ritualInstanceId: instance.id, templateKey: input.templateKey }, 'Ritual instance created');

    return this.formatInstance(instance);
  }

  /**
   * Get ritual instance by ID
   */
  async getInstance(id: string) {
    const instance = await prisma.ritualInstance.findUnique({
      where: { id },
      include: {
        template: true,
        participants: true,
        reminders: true,
        notificationLogs: true,
      },
    });

    if (!instance) {
      throw new NotFoundError('Ritual instance', id);
    }

    return this.formatInstance(instance);
  }

  /**
   * List ritual instances with filters
   */
  async listInstances(filters?: {
    templateKey?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.templateKey) {
      where.templateKey = filters.templateKey;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.scheduledAt = {};
      if (filters.fromDate) {
        where.scheduledAt.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.scheduledAt.lte = filters.toDate;
      }
    }

    const [instances, total] = await Promise.all([
      prisma.ritualInstance.findMany({
        where,
        include: {
          template: true,
          participants: true,
        },
        orderBy: { scheduledAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.ritualInstance.count({ where }),
    ]);

    return {
      instances: instances.map((i) => this.formatInstance(i)),
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  }

  /**
   * Update ritual instance
   */
  async updateInstance(id: string, input: UpdateRitualInstanceInput) {
    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.durationMinutes !== undefined) updateData.durationMinutes = input.durationMinutes;
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === 'completed') {
        updateData.completedAt = new Date();
      }
    }
    if (input.metadata !== undefined) {
      updateData.metadataJson = JSON.stringify(input.metadata);
    }

    const instance = await prisma.ritualInstance.update({
      where: { id },
      data: updateData,
      include: {
        template: true,
      },
    });

    logger.info({ ritualInstanceId: id, updates: input }, 'Ritual instance updated');

    return this.formatInstance(instance);
  }

  /**
   * Delete ritual instance
   */
  async deleteInstance(id: string) {
    await prisma.ritualInstance.delete({
      where: { id },
    });

    logger.info({ ritualInstanceId: id }, 'Ritual instance deleted');
  }

  /**
   * Add participants to a ritual instance
   */
  async addParticipants(ritualInstanceId: string, memberIds: string[]) {
    const participants = await prisma.ritualParticipant.createMany({
      data: memberIds.map((memberId) => ({
        ritualInstanceId,
        memberId,
        status: 'invited',
      })),
      skipDuplicates: true,
    });

    logger.info(
      { ritualInstanceId, participantCount: participants.count },
      'Participants added to ritual instance'
    );

    return participants;
  }

  /**
   * Update participant status
   */
  async updateParticipantStatus(
    ritualInstanceId: string,
    memberId: string,
    status: 'invited' | 'confirmed' | 'declined' | 'attended',
    response?: Record<string, any>
  ) {
    const participant = await prisma.ritualParticipant.updateMany({
      where: {
        ritualInstanceId,
        memberId,
      },
      data: {
        status,
        responseJson: response ? JSON.stringify(response) : undefined,
      },
    });

    logger.info({ ritualInstanceId, memberId, status }, 'Participant status updated');

    return participant;
  }

  /**
   * Get participants for a ritual instance
   */
  async getParticipants(ritualInstanceId: string) {
    const participants = await prisma.ritualParticipant.findMany({
      where: { ritualInstanceId },
      orderBy: { createdAt: 'asc' },
    });

    return participants.map((p) => ({
      ...p,
      responseJson: p.responseJson ? JSON.parse(p.responseJson) : {},
    }));
  }

  /**
   * Get participation stats for a ritual instance
   */
  async getParticipationStats(ritualInstanceId: string) {
    const participants = await prisma.ritualParticipant.findMany({
      where: { ritualInstanceId },
    });

    const stats = {
      total: participants.length,
      invited: participants.filter((p) => p.status === 'invited').length,
      confirmed: participants.filter((p) => p.status === 'confirmed').length,
      declined: participants.filter((p) => p.status === 'declined').length,
      attended: participants.filter((p) => p.status === 'attended').length,
    };

    return stats;
  }

  /**
   * Mark ritual as in progress
   */
  async startRitual(id: string) {
    return this.updateInstance(id, { status: 'in_progress' });
  }

  /**
   * Mark ritual as completed
   */
  async completeRitual(id: string) {
    return this.updateInstance(id, { status: 'completed' });
  }

  /**
   * Cancel a ritual
   */
  async cancelRitual(id: string) {
    return this.updateInstance(id, { status: 'cancelled' });
  }

  private formatInstance(instance: any) {
    return {
      ...instance,
      metadataJson: instance.metadataJson ? JSON.parse(instance.metadataJson) : {},
    };
  }
}

export const ritualInstanceService = new RitualInstanceService();
