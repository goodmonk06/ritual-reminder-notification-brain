import { prisma } from '../config/database';
import { CreateMemberPreference, UpdateMemberPreference } from '../types';

export class MemberPreferenceService {
  async createOrUpdatePreference(data: CreateMemberPreference) {
    const existing = await prisma.memberRitualPreference.findUnique({
      where: { memberId: data.memberId },
    });

    if (existing) {
      return this.updatePreference(data.memberId, data);
    }

    const preference = await prisma.memberRitualPreference.create({
      data: {
        memberId: data.memberId,
        optInLevelsJson: JSON.stringify(data.optInLevelsJson || {}),
        quietHoursJson: JSON.stringify(data.quietHoursJson || null),
        metaJson: JSON.stringify(data.metaJson || {}),
      },
    });

    return this.formatPreference(preference);
  }

  async getPreference(memberId: string) {
    const preference = await prisma.memberRitualPreference.findUnique({
      where: { memberId },
    });

    return preference ? this.formatPreference(preference) : null;
  }

  async updatePreference(memberId: string, data: UpdateMemberPreference) {
    const updateData: any = {};

    if (data.optInLevelsJson !== undefined)
      updateData.optInLevelsJson = JSON.stringify(data.optInLevelsJson);
    if (data.quietHoursJson !== undefined)
      updateData.quietHoursJson = JSON.stringify(data.quietHoursJson);
    if (data.metaJson !== undefined) updateData.metaJson = JSON.stringify(data.metaJson);

    const preference = await prisma.memberRitualPreference.update({
      where: { memberId },
      data: updateData,
    });

    return this.formatPreference(preference);
  }

  async updateLastNotified(memberId: string) {
    await prisma.memberRitualPreference.update({
      where: { memberId },
      data: { lastNotifiedAt: new Date() },
    });
  }

  async getAllPreferences() {
    const preferences = await prisma.memberRitualPreference.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return preferences.map((p) => this.formatPreference(p));
  }

  async deletePreference(memberId: string) {
    await prisma.memberRitualPreference.delete({
      where: { memberId },
    });
  }

  private formatPreference(preference: any) {
    return {
      ...preference,
      optInLevelsJson: JSON.parse(preference.optInLevelsJson),
      quietHoursJson: preference.quietHoursJson
        ? JSON.parse(preference.quietHoursJson)
        : null,
      metaJson: JSON.parse(preference.metaJson),
    };
  }
}

export const memberPreferenceService = new MemberPreferenceService();
