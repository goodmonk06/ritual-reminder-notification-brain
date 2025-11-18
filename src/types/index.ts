import { z } from 'zod';

// Timing offset schema (e.g., "-24h", "-1h", "-30m")
export const timingOffsetSchema = z.string().regex(/^-?\d+[mhd]$/);

// Channel preferences
export const channelPreferencesSchema = z.record(z.boolean());

export type ChannelPreferences = z.infer<typeof channelPreferencesSchema>;

// Opt-in levels
export const optInLevelSchema = z.enum(['none', 'minimal', 'normal', 'all']);

export type OptInLevel = z.infer<typeof optInLevelSchema>;

export const optInLevelsSchema = z.record(optInLevelSchema);

export type OptInLevels = z.infer<typeof optInLevelsSchema>;

// Quiet hours
export const quietHoursSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm format
  end: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string(),
});

export type QuietHours = z.infer<typeof quietHoursSchema>;

// Member metadata
export const memberMetaSchema = z.object({
  preferredLanguage: z.string().optional(),
  pausedUntil: z.string().datetime().optional(),
});

export type MemberMeta = z.infer<typeof memberMetaSchema>;

// Ritual instance reference
export const ritualInstanceRefSchema = z.object({
  ritualId: z.string(),
  ritualDate: z.string().datetime(),
  ritualType: z.string(),
  title: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type RitualInstanceRef = z.infer<typeof ritualInstanceRefSchema>;

// Reminder status
export const reminderStatusSchema = z.enum(['pending', 'sent', 'skipped', 'failed']);

export type ReminderStatus = z.infer<typeof reminderStatusSchema>;

// Notification channels
export const notificationChannelSchema = z.enum(['email', 'slack', 'push', 'sms']);

export type NotificationChannel = z.infer<typeof notificationChannelSchema>;

// Template creation/update schemas
export const createTemplateSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  descriptionMarkdown: z.string().default(''),
  defaultTimingJson: z.array(timingOffsetSchema).default([]),
  channelPreferencesJson: channelPreferencesSchema.default({}),
});

export type CreateTemplate = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = createTemplateSchema.partial();

export type UpdateTemplate = z.infer<typeof updateTemplateSchema>;

// Member preference creation/update schemas
export const createMemberPreferenceSchema = z.object({
  memberId: z.string().min(1),
  optInLevelsJson: optInLevelsSchema.default({}),
  quietHoursJson: quietHoursSchema.optional(),
  metaJson: memberMetaSchema.default({}),
});

export type CreateMemberPreference = z.infer<typeof createMemberPreferenceSchema>;

export const updateMemberPreferenceSchema = createMemberPreferenceSchema.partial().omit({
  memberId: true,
});

export type UpdateMemberPreference = z.infer<typeof updateMemberPreferenceSchema>;

// Scheduled reminder creation schema
export const createScheduledReminderSchema = z.object({
  memberId: z.string().min(1),
  ritualInstanceRefJson: ritualInstanceRefSchema,
  sendAt: z.string().datetime().or(z.date()),
  channel: notificationChannelSchema,
  templateKey: z.string().min(1),
});

export type CreateScheduledReminder = z.infer<typeof createScheduledReminderSchema>;

// Ritual instance input for scheduling
export const scheduleRitualInputSchema = z.object({
  ritualInstanceRef: ritualInstanceRefSchema,
  templateKey: z.string().min(1),
  targetMembers: z.array(z.string()).optional(), // If not provided, schedule for all opted-in members
});

export type ScheduleRitualInput = z.infer<typeof scheduleRitualInputSchema>;
