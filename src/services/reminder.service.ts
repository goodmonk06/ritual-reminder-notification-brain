import { prisma } from '../config/database';
import { CreateScheduledReminder, ReminderStatus } from '../types';

export class ReminderService {
  async createReminder(data: CreateScheduledReminder) {
    const reminder = await prisma.scheduledReminder.create({
      data: {
        memberId: data.memberId,
        ritualInstanceRefJson: JSON.stringify(data.ritualInstanceRefJson),
        sendAt: new Date(data.sendAt),
        channel: data.channel,
        templateKey: data.templateKey,
        status: 'pending',
      },
    });

    return this.formatReminder(reminder);
  }

  async getPendingReminders(beforeTime: Date) {
    const reminders = await prisma.scheduledReminder.findMany({
      where: {
        status: 'pending',
        sendAt: {
          lte: beforeTime,
        },
      },
      orderBy: {
        sendAt: 'asc',
      },
    });

    return reminders.map((r) => this.formatReminder(r));
  }

  async getReminder(id: string) {
    const reminder = await prisma.scheduledReminder.findUnique({
      where: { id },
    });

    return reminder ? this.formatReminder(reminder) : null;
  }

  async getRemindersByMember(memberId: string) {
    const reminders = await prisma.scheduledReminder.findMany({
      where: { memberId },
      orderBy: { sendAt: 'desc' },
    });

    return reminders.map((r) => this.formatReminder(r));
  }

  async updateReminderStatus(
    id: string,
    status: ReminderStatus,
    errorMessage?: string,
    notificationHubResponse?: string
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'sent') {
      updateData.sentAt = new Date();
    }

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    if (notificationHubResponse) {
      updateData.notificationHubResponse = notificationHubResponse;
    }

    const reminder = await prisma.scheduledReminder.update({
      where: { id },
      data: updateData,
    });

    return this.formatReminder(reminder);
  }

  async deleteReminder(id: string) {
    await prisma.scheduledReminder.delete({
      where: { id },
    });
  }

  async deleteRemindersByMember(memberId: string) {
    await prisma.scheduledReminder.deleteMany({
      where: { memberId },
    });
  }

  private formatReminder(reminder: any) {
    return {
      ...reminder,
      ritualInstanceRefJson: JSON.parse(reminder.ritualInstanceRefJson),
    };
  }
}

export const reminderService = new ReminderService();
