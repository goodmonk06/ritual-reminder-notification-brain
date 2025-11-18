import { logger } from '../config/logger';
import {
  NotificationChannel,
  OptInLevel,
  RitualInstanceRef,
  ScheduleRitualInput,
} from '../types';
import { adjustForQuietHours, calculateReminderTime } from '../utils/timing';
import { memberPreferenceService } from './member-preference.service';
import { reminderService } from './reminder.service';
import { templateService } from './template.service';

export class SchedulingEngineService {
  /**
   * Schedule reminders for a ritual instance
   * This is the core scheduling logic that:
   * 1. Finds the template
   * 2. Gets all opted-in members (or specific members if provided)
   * 3. Calculates reminder times based on template timing offsets
   * 4. Adjusts for member preferences (quiet hours, opt-in level)
   * 5. Creates scheduled reminders
   */
  async scheduleRitualReminders(input: ScheduleRitualInput) {
    logger.info({ input }, 'Scheduling ritual reminders');

    // 1. Get the template
    const template = await templateService.getTemplateByKey(input.templateKey);
    if (!template) {
      throw new Error(`Template not found: ${input.templateKey}`);
    }

    // 2. Parse ritual instance time
    const ritualTime = new Date(input.ritualInstanceRef.ritualDate);
    if (isNaN(ritualTime.getTime())) {
      throw new Error('Invalid ritual date');
    }

    // 3. Get members to notify
    const memberIds = input.targetMembers || (await this.getOptedInMembers(template.key));

    logger.info({ memberIds, templateKey: template.key }, 'Found members to notify');

    // 4. Create reminders for each member
    const createdReminders = [];

    for (const memberId of memberIds) {
      try {
        const reminders = await this.createRemindersForMember(
          memberId,
          template,
          ritualTime,
          input.ritualInstanceRef
        );
        createdReminders.push(...reminders);
      } catch (error: any) {
        logger.error({ error, memberId }, 'Failed to create reminders for member');
      }
    }

    logger.info({ count: createdReminders.length }, 'Created reminders');

    return createdReminders;
  }

  /**
   * Create reminders for a specific member based on template and their preferences
   */
  private async createRemindersForMember(
    memberId: string,
    template: any,
    ritualTime: Date,
    ritualInstanceRef: RitualInstanceRef
  ) {
    const preference = await memberPreferenceService.getPreference(memberId);

    // If no preference exists, create a default one
    if (!preference) {
      logger.warn({ memberId }, 'No preference found, creating default');
      await memberPreferenceService.createOrUpdatePreference({
        memberId,
        optInLevelsJson: { [template.key]: 'normal' },
        metaJson: {},
      });
    }

    // Check if member is paused
    if (preference?.metaJson?.pausedUntil) {
      const pausedUntil = new Date(preference.metaJson.pausedUntil);
      if (pausedUntil > new Date()) {
        logger.info({ memberId, pausedUntil }, 'Member is paused, skipping');
        return [];
      }
    }

    // Get opt-in level for this template
    const optInLevel: OptInLevel =
      preference?.optInLevelsJson?.[template.key] || 'none';

    if (optInLevel === 'none') {
      logger.info({ memberId, templateKey: template.key }, 'Member opted out');
      return [];
    }

    // Filter timing offsets based on opt-in level
    const timingOffsets = this.filterTimingOffsetsByOptInLevel(
      template.defaultTimingJson,
      optInLevel
    );

    // Get preferred channels
    const channels = this.getPreferredChannels(template.channelPreferencesJson);

    // Create reminders
    const reminders = [];

    for (const offset of timingOffsets) {
      for (const channel of channels) {
        let sendAt = calculateReminderTime(ritualTime, offset);

        // Adjust for quiet hours if configured
        if (preference?.quietHoursJson) {
          sendAt = adjustForQuietHours(sendAt, preference.quietHoursJson);
        }

        // Don't create reminders for past times
        if (sendAt <= new Date()) {
          logger.debug({ sendAt, offset }, 'Skipping past reminder time');
          continue;
        }

        const reminder = await reminderService.createReminder({
          memberId,
          ritualInstanceRefJson: ritualInstanceRef,
          sendAt,
          channel,
          templateKey: template.key,
        });

        reminders.push(reminder);
      }
    }

    return reminders;
  }

  /**
   * Filter timing offsets based on member's opt-in level
   */
  private filterTimingOffsetsByOptInLevel(
    offsets: string[],
    optInLevel: OptInLevel
  ): string[] {
    if (optInLevel === 'all') {
      return offsets;
    }

    if (optInLevel === 'minimal') {
      // Only send the closest reminder (last in the array, e.g., "-1h")
      return offsets.slice(-1);
    }

    if (optInLevel === 'normal') {
      // Send up to 2 reminders
      return offsets.slice(-2);
    }

    return [];
  }

  /**
   * Get list of enabled notification channels from preferences
   */
  private getPreferredChannels(
    channelPreferences: Record<string, boolean>
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    for (const [channel, enabled] of Object.entries(channelPreferences)) {
      if (enabled) {
        channels.push(channel as NotificationChannel);
      }
    }

    // Default to email if no channels specified
    if (channels.length === 0) {
      channels.push('email');
    }

    return channels;
  }

  /**
   * Get all member IDs that have opted in to a specific template
   */
  private async getOptedInMembers(templateKey: string): Promise<string[]> {
    const allPreferences = await memberPreferenceService.getAllPreferences();

    return allPreferences
      .filter((pref) => {
        const optInLevel = pref.optInLevelsJson?.[templateKey];
        return optInLevel && optInLevel !== 'none';
      })
      .map((pref) => pref.memberId);
  }
}

export const schedulingEngineService = new SchedulingEngineService();
