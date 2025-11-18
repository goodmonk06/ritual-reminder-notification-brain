import { prisma } from '../config/database';
import { CreateTemplate, UpdateTemplate } from '../types';

export class TemplateService {
  async createTemplate(data: CreateTemplate) {
    const template = await prisma.ritualReminderTemplate.create({
      data: {
        key: data.key,
        name: data.name,
        descriptionMarkdown: data.descriptionMarkdown || '',
        defaultTimingJson: JSON.stringify(data.defaultTimingJson || []),
        channelPreferencesJson: JSON.stringify(data.channelPreferencesJson || {}),
      },
    });

    return this.formatTemplate(template);
  }

  async getTemplateByKey(key: string) {
    const template = await prisma.ritualReminderTemplate.findUnique({
      where: { key },
    });

    return template ? this.formatTemplate(template) : null;
  }

  async getAllTemplates() {
    const templates = await prisma.ritualReminderTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return templates.map((t) => this.formatTemplate(t));
  }

  async updateTemplate(key: string, data: UpdateTemplate) {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.descriptionMarkdown !== undefined)
      updateData.descriptionMarkdown = data.descriptionMarkdown;
    if (data.defaultTimingJson !== undefined)
      updateData.defaultTimingJson = JSON.stringify(data.defaultTimingJson);
    if (data.channelPreferencesJson !== undefined)
      updateData.channelPreferencesJson = JSON.stringify(data.channelPreferencesJson);

    const template = await prisma.ritualReminderTemplate.update({
      where: { key },
      data: updateData,
    });

    return this.formatTemplate(template);
  }

  async deleteTemplate(key: string) {
    await prisma.ritualReminderTemplate.delete({
      where: { key },
    });
  }

  private formatTemplate(template: any) {
    return {
      ...template,
      defaultTimingJson: JSON.parse(template.defaultTimingJson),
      channelPreferencesJson: JSON.parse(template.channelPreferencesJson),
    };
  }
}

export const templateService = new TemplateService();
