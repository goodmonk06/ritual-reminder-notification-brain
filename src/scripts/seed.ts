import { prisma } from '../config/database';
import { logger } from '../config/logger';

async function seed() {
  logger.info('Starting database seed...');

  try {
    // Clean existing data
    logger.info('Cleaning existing data...');
    await prisma.scheduledReminder.deleteMany();
    await prisma.memberRitualPreference.deleteMany();
    await prisma.ritualReminderTemplate.deleteMany();

    // Create ritual reminder templates
    logger.info('Creating ritual reminder templates...');

    const weeklyReviewTemplate = await prisma.ritualReminderTemplate.create({
      data: {
        key: 'weekly-review',
        name: 'Weekly Review',
        descriptionMarkdown: `
# Weekly Review Ritual

Take time to reflect on your week:
- What went well?
- What could be improved?
- What are your goals for next week?
        `.trim(),
        defaultTimingJson: JSON.stringify(['-24h', '-1h']),
        channelPreferencesJson: JSON.stringify({
          email: true,
          slack: true,
        }),
      },
    });

    const dailyStandupTemplate = await prisma.ritualReminderTemplate.create({
      data: {
        key: 'daily-standup',
        name: 'Daily Standup',
        descriptionMarkdown: `
# Daily Standup

Quick sync with your team:
- What did you do yesterday?
- What will you do today?
- Any blockers?
        `.trim(),
        defaultTimingJson: JSON.stringify(['-15m']),
        channelPreferencesJson: JSON.stringify({
          slack: true,
          push: true,
        }),
      },
    });

    const monthlyPlanningTemplate = await prisma.ritualReminderTemplate.create({
      data: {
        key: 'monthly-planning',
        name: 'Monthly Planning',
        descriptionMarkdown: `
# Monthly Planning Session

Plan your month ahead:
- Review last month's achievements
- Set goals for the new month
- Align with team priorities
        `.trim(),
        defaultTimingJson: JSON.stringify(['-72h', '-24h', '-2h']),
        channelPreferencesJson: JSON.stringify({
          email: true,
          slack: true,
          push: true,
        }),
      },
    });

    logger.info('Created templates:', {
      weeklyReview: weeklyReviewTemplate.key,
      dailyStandup: dailyStandupTemplate.key,
      monthlyPlanning: monthlyPlanningTemplate.key,
    });

    // Create member preferences
    logger.info('Creating member preferences...');

    const member1 = await prisma.memberRitualPreference.create({
      data: {
        memberId: 'member-001',
        optInLevelsJson: JSON.stringify({
          'weekly-review': 'all',
          'daily-standup': 'normal',
          'monthly-planning': 'minimal',
        }),
        quietHoursJson: JSON.stringify({
          start: '22:00',
          end: '08:00',
          timezone: 'America/New_York',
        }),
        metaJson: JSON.stringify({
          preferredLanguage: 'en',
        }),
      },
    });

    const member2 = await prisma.memberRitualPreference.create({
      data: {
        memberId: 'member-002',
        optInLevelsJson: JSON.stringify({
          'weekly-review': 'normal',
          'daily-standup': 'all',
          'monthly-planning': 'normal',
        }),
        quietHoursJson: JSON.stringify({
          start: '21:00',
          end: '07:00',
          timezone: 'America/Los_Angeles',
        }),
        metaJson: JSON.stringify({
          preferredLanguage: 'en',
        }),
      },
    });

    const member3 = await prisma.memberRitualPreference.create({
      data: {
        memberId: 'member-003',
        optInLevelsJson: JSON.stringify({
          'weekly-review': 'minimal',
          'daily-standup': 'none',
          'monthly-planning': 'all',
        }),
        quietHoursJson: JSON.stringify({
          start: '23:00',
          end: '09:00',
          timezone: 'Europe/London',
        }),
        metaJson: JSON.stringify({
          preferredLanguage: 'en',
        }),
      },
    });

    logger.info('Created member preferences:', {
      member1: member1.memberId,
      member2: member2.memberId,
      member3: member3.memberId,
    });

    // Create sample scheduled reminders for the future
    logger.info('Creating sample scheduled reminders...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const reminder1 = await prisma.scheduledReminder.create({
      data: {
        memberId: 'member-001',
        ritualInstanceRefJson: JSON.stringify({
          ritualId: 'weekly-review-2024-w01',
          ritualDate: nextWeek.toISOString(),
          ritualType: 'weekly-review',
          title: 'Week 1 Review',
        }),
        sendAt: new Date(nextWeek.getTime() - 24 * 60 * 60 * 1000), // 24h before
        channel: 'email',
        templateKey: 'weekly-review',
        status: 'pending',
      },
    });

    const reminder2 = await prisma.scheduledReminder.create({
      data: {
        memberId: 'member-002',
        ritualInstanceRefJson: JSON.stringify({
          ritualId: 'daily-standup-2024-001',
          ritualDate: tomorrow.toISOString(),
          ritualType: 'daily-standup',
          title: 'Daily Team Standup',
        }),
        sendAt: new Date(tomorrow.getTime() - 15 * 60 * 1000), // 15m before
        channel: 'slack',
        templateKey: 'daily-standup',
        status: 'pending',
      },
    });

    logger.info('Created sample reminders:', {
      reminder1: reminder1.id,
      reminder2: reminder2.id,
    });

    logger.info('✅ Database seed completed successfully!');

    // Print summary
    const templateCount = await prisma.ritualReminderTemplate.count();
    const preferenceCount = await prisma.memberRitualPreference.count();
    const reminderCount = await prisma.scheduledReminder.count();

    logger.info('Summary:', {
      templates: templateCount,
      memberPreferences: preferenceCount,
      scheduledReminders: reminderCount,
    });
  } catch (error) {
    logger.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
