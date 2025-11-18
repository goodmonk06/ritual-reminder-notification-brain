import { prisma } from '../config/database';
import { logger } from '../config/logger';

/**
 * Enhanced seed script with comprehensive, realistic data
 * Creates multiple templates, members, groups, ritual instances, and more
 */

async function seedEnhanced() {
  logger.info('Starting enhanced database seed...');

  try {
    // Clean existing data
    logger.info('Cleaning existing data...');
    await prisma.notificationLog.deleteMany();
    await prisma.ritualParticipant.deleteMany();
    await prisma.scheduledReminder.deleteMany();
    await prisma.ritualInstance.deleteMany();
    await prisma.reminderRule.deleteMany();
    await prisma.memberGroupMembership.deleteMany();
    await prisma.memberGroup.deleteMany();
    await prisma.memberRitualPreference.deleteMany();
    await prisma.ritualReminderTemplate.deleteMany();

    // Create comprehensive templates
    logger.info('Creating ritual reminder templates...');

    const templates = await Promise.all([
      // Daily rituals
      prisma.ritualReminderTemplate.create({
        data: {
          key: 'daily-standup',
          name: 'Daily Team Standup',
          descriptionMarkdown: `
# Daily Standup

Quick 15-minute sync to align the team.

**Agenda:**
- What did you accomplish yesterday?
- What are you working on today?
- Any blockers or challenges?
          `.trim(),
          defaultTimingJson: JSON.stringify(['-15m', '-5m']),
          channelPreferencesJson: JSON.stringify({ slack: true, push: true }),
          category: 'daily',
          tags: ['team', 'sync', 'agile'],
          priority: 4,
          metadataJson: JSON.stringify({ duration: 15, recurring: 'daily' }),
        },
      }),

      prisma.ritualReminderTemplate.create({
        data: {
          key: 'daily-reflection',
          name: 'Personal Daily Reflection',
          descriptionMarkdown: `
# Daily Reflection

Take 10 minutes to reflect on your day.

**Questions:**
- What went well today?
- What could have gone better?
- What did you learn?
- What are you grateful for?
          `.trim(),
          defaultTimingJson: JSON.stringify(['-30m']),
          channelPreferencesJson: JSON.stringify({ email: true, push: true }),
          category: 'daily',
          tags: ['personal', 'reflection', 'growth'],
          priority: 3,
          metadataJson: JSON.stringify({ duration: 10, recurring: 'daily' }),
        },
      }),

      // Weekly rituals
      prisma.ritualReminderTemplate.create({
        data: {
          key: 'weekly-review',
          name: 'Weekly Review & Planning',
          descriptionMarkdown: `
# Weekly Review & Planning

Reflect on the past week and plan for the next.

**Review:**
- Wins and accomplishments
- Challenges and learnings
- Incomplete tasks

**Planning:**
- Priorities for next week
- Goals and milestones
- Resource needs
          `.trim(),
          defaultTimingJson: JSON.stringify(['-24h', '-2h']),
          channelPreferencesJson: JSON.stringify({ email: true, slack: true }),
          category: 'weekly',
          tags: ['planning', 'review', 'productivity'],
          priority: 5,
          metadataJson: JSON.stringify({ duration: 60, recurring: 'weekly' }),
        },
      }),

      prisma.ritualReminderTemplate.create({
        data: {
          key: 'weekly-retro',
          name: 'Team Retrospective',
          descriptionMarkdown: `
# Team Retrospective

A safe space to reflect on team dynamics and processes.

**Format:**
- What went well?
- What didn't go well?
- What should we try differently?
- Action items
          `.trim(),
          defaultTimingJson: JSON.stringify(['-48h', '-3h']),
          channelPreferencesJson: JSON.stringify({ slack: true, email: true }),
          category: 'weekly',
          tags: ['team', 'retro', 'improvement'],
          priority: 4,
          metadataJson: JSON.stringify({ duration: 90, recurring: 'weekly' }),
        },
      }),

      // Monthly rituals
      prisma.ritualReminderTemplate.create({
        data: {
          key: 'monthly-planning',
          name: 'Monthly Planning Session',
          descriptionMarkdown: `
# Monthly Planning Session

Strategic planning and goal setting for the month ahead.

**Agenda:**
1. Review previous month's goals
2. Analyze metrics and KPIs
3. Set priorities for upcoming month
4. Resource allocation
5. Risk assessment
          `.trim(),
          defaultTimingJson: JSON.stringify(['-72h', '-24h', '-2h']),
          channelPreferencesJson: JSON.stringify({ email: true, slack: true, push: true }),
          category: 'monthly',
          tags: ['planning', 'strategy', 'goals'],
          priority: 5,
          metadataJson: JSON.stringify({ duration: 120, recurring: 'monthly' }),
        },
      }),

      prisma.ritualReminderTemplate.create({
        data: {
          key: 'monthly-1on1',
          name: 'Monthly 1-on-1 Check-in',
          descriptionMarkdown: `
# Monthly 1-on-1

Personal development and career discussion.

**Topics:**
- Recent achievements
- Challenges and support needed
- Career goals and growth
- Feedback (both ways)
          `.trim(),
          defaultTimingJson: JSON.stringify(['-48h', '-4h']),
          channelPreferencesJson: JSON.stringify({ email: true }),
          category: 'monthly',
          tags: ['1on1', 'growth', 'feedback'],
          priority: 4,
          metadataJson: JSON.stringify({ duration: 45, recurring: 'monthly' }),
        },
      }),

      // Quarterly rituals
      prisma.ritualReminderTemplate.create({
        data: {
          key: 'quarterly-okr-review',
          name: 'Quarterly OKR Review',
          descriptionMarkdown: `
# Quarterly OKR Review

Review progress on Objectives and Key Results.

**Agenda:**
1. Review Q OKRs and progress
2. Celebrate wins
3. Analyze misses
4. Set next quarter's OKRs
5. Align with company goals
          `.trim(),
          defaultTimingJson: JSON.stringify(['-168h', '-72h', '-24h']), // 1 week, 3 days, 1 day
          channelPreferencesJson: JSON.stringify({ email: true, slack: true }),
          category: 'quarterly',
          tags: ['okr', 'goals', 'review'],
          priority: 5,
          metadataJson: JSON.stringify({ duration: 180, recurring: 'quarterly' }),
        },
      }),

      // Ad-hoc rituals
      prisma.ritualReminderTemplate.create({
        data: {
          key: 'project-kickoff',
          name: 'Project Kickoff Meeting',
          descriptionMarkdown: `
# Project Kickoff

Launch a new project with aligned expectations.

**Agenda:**
- Project vision and goals
- Scope and deliverables
- Team roles and responsibilities
- Timeline and milestones
- Communication plan
          `.trim(),
          defaultTimingJson: JSON.stringify(['-24h', '-1h']),
          channelPreferencesJson: JSON.stringify({ email: true, slack: true }),
          category: 'adhoc',
          tags: ['project', 'kickoff', 'planning'],
          priority: 4,
          metadataJson: JSON.stringify({ duration: 90, recurring: 'none' }),
        },
      }),
    ]);

    logger.info(`Created ${templates.length} templates`);

    // Create member preferences with diverse profiles
    logger.info('Creating member preferences...');

    const members = await Promise.all([
      // Power user - wants all notifications
      prisma.memberRitualPreference.create({
        data: {
          memberId: 'alice@example.com',
          optInLevelsJson: JSON.stringify({
            'daily-standup': 'all',
            'daily-reflection': 'all',
            'weekly-review': 'all',
            'weekly-retro': 'all',
            'monthly-planning': 'all',
            'monthly-1on1': 'all',
            'quarterly-okr-review': 'all',
          }),
          quietHoursJson: JSON.stringify({
            start: '22:00',
            end: '07:00',
            timezone: 'America/New_York',
          }),
          timezone: 'America/New_York',
          isPaused: false,
          metaJson: JSON.stringify({ preferredLanguage: 'en', role: 'team-lead' }),
        },
      }),

      // Balanced user - normal notifications
      prisma.memberRitualPreference.create({
        data: {
          memberId: 'bob@example.com',
          optInLevelsJson: JSON.stringify({
            'daily-standup': 'normal',
            'weekly-review': 'normal',
            'weekly-retro': 'all',
            'monthly-planning': 'normal',
          }),
          quietHoursJson: JSON.stringify({
            start: '21:00',
            end: '08:00',
            timezone: 'America/Los_Angeles',
          }),
          timezone: 'America/Los_Angeles',
          isPaused: false,
          metaJson: JSON.stringify({ preferredLanguage: 'en', role: 'engineer' }),
        },
      }),

      // Minimal user - only essential notifications
      prisma.memberRitualPreference.create({
        data: {
          memberId: 'carol@example.com',
          optInLevelsJson: JSON.stringify({
            'daily-standup': 'minimal',
            'weekly-review': 'minimal',
            'monthly-planning': 'normal',
          }),
          quietHoursJson: JSON.stringify({
            start: '23:00',
            end: '09:00',
            timezone: 'Europe/London',
          }),
          timezone: 'Europe/London',
          isPaused: false,
          metaJson: JSON.stringify({ preferredLanguage: 'en', role: 'designer' }),
        },
      }),

      // International user
      prisma.memberRitualPreference.create({
        data: {
          memberId: 'david@example.com',
          optInLevelsJson: JSON.stringify({
            'daily-standup': 'normal',
            'weekly-review': 'all',
            'monthly-planning': 'all',
          }),
          quietHoursJson: JSON.stringify({
            start: '22:00',
            end: '08:00',
            timezone: 'Asia/Tokyo',
          }),
          timezone: 'Asia/Tokyo',
          isPaused: false,
          metaJson: JSON.stringify({ preferredLanguage: 'ja', role: 'product-manager' }),
        },
      }),

      // Temporarily paused user
      prisma.memberRitualPreference.create({
        data: {
          memberId: 'eve@example.com',
          optInLevelsJson: JSON.stringify({
            'weekly-review': 'normal',
            'monthly-planning': 'normal',
          }),
          timezone: 'America/Chicago',
          isPaused: true,
          metaJson: JSON.stringify({
            preferredLanguage: 'en',
            role: 'engineer',
            pausedReason: 'on-leave',
            pausedUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          }),
        },
      }),
    ]);

    logger.info(`Created ${members.length} member preferences`);

    // Create member groups
    logger.info('Creating member groups...');

    const engineeringGroup = await prisma.memberGroup.create({
      data: {
        name: 'Engineering Team',
        description: 'All engineering team members',
        metadataJson: JSON.stringify({ department: 'engineering', size: 'medium' }),
      },
    });

    const leadershipGroup = await prisma.memberGroup.create({
      data: {
        name: 'Leadership',
        description: 'Team leads and managers',
        metadataJson: JSON.stringify({ level: 'leadership' }),
      },
    });

    // Add members to groups
    await Promise.all([
      prisma.memberGroupMembership.create({
        data: {
          groupId: engineeringGroup.id,
          memberId: 'bob@example.com',
          role: 'member',
        },
      }),
      prisma.memberGroupMembership.create({
        data: {
          groupId: engineeringGroup.id,
          memberId: 'eve@example.com',
          role: 'member',
        },
      }),
      prisma.memberGroupMembership.create({
        data: {
          groupId: leadershipGroup.id,
          memberId: 'alice@example.com',
          role: 'lead',
        },
      }),
      prisma.memberGroupMembership.create({
        data: {
          groupId: leadershipGroup.id,
          memberId: 'david@example.com',
          role: 'member',
        },
      }),
    ]);

    logger.info('Created member groups and memberships');

    // Create ritual instances for the next week
    logger.info('Creating ritual instances...');

    const now = new Date();
    const instances = [];

    // Today's standup
    instances.push(
      await prisma.ritualInstance.create({
        data: {
          templateKey: 'daily-standup',
          scheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
          title: 'Daily Team Standup',
          durationMinutes: 15,
          status: 'scheduled',
          createdBy: 'alice@example.com',
        },
      })
    );

    // This week's review
    const fridayReview = new Date(now);
    fridayReview.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
    fridayReview.setHours(16, 0, 0, 0);

    instances.push(
      await prisma.ritualInstance.create({
        data: {
          templateKey: 'weekly-review',
          scheduledAt: fridayReview,
          title: 'Weekly Review - End of Sprint',
          durationMinutes: 60,
          status: 'scheduled',
          createdBy: 'alice@example.com',
        },
      })
    );

    // Next month's planning
    const nextMonthPlanning = new Date(now);
    nextMonthPlanning.setMonth(now.getMonth() + 1);
    nextMonthPlanning.setDate(1);
    nextMonthPlanning.setHours(10, 0, 0, 0);

    instances.push(
      await prisma.ritualInstance.create({
        data: {
          templateKey: 'monthly-planning',
          scheduledAt: nextMonthPlanning,
          title: 'Monthly Planning Session - Q1 Goals',
          durationMinutes: 120,
          status: 'scheduled',
          createdBy: 'alice@example.com',
        },
      })
    );

    logger.info(`Created ${instances.length} ritual instances`);

    // Add participants to ritual instances
    logger.info('Adding participants to ritual instances...');

    await prisma.ritualParticipant.createMany({
      data: [
        // Daily standup participants
        {
          ritualInstanceId: instances[0].id,
          memberId: 'alice@example.com',
          status: 'confirmed',
        },
        {
          ritualInstanceId: instances[0].id,
          memberId: 'bob@example.com',
          status: 'confirmed',
        },
        {
          ritualInstanceId: instances[0].id,
          memberId: 'carol@example.com',
          status: 'invited',
        },
        // Weekly review participants
        {
          ritualInstanceId: instances[1].id,
          memberId: 'alice@example.com',
          status: 'confirmed',
        },
        {
          ritualInstanceId: instances[1].id,
          memberId: 'bob@example.com',
          status: 'invited',
        },
        {
          ritualInstanceId: instances[1].id,
          memberId: 'david@example.com',
          status: 'confirmed',
        },
        // Monthly planning participants
        {
          ritualInstanceId: instances[2].id,
          memberId: 'alice@example.com',
          status: 'invited',
        },
        {
          ritualInstanceId: instances[2].id,
          memberId: 'david@example.com',
          status: 'invited',
        },
      ],
    });

    logger.info('Added participants to ritual instances');

    // Create some sample scheduled reminders
    logger.info('Creating sample scheduled reminders...');

    await prisma.scheduledReminder.createMany({
      data: [
        {
          memberId: 'alice@example.com',
          ritualInstanceRefJson: JSON.stringify({
            ritualId: instances[0].id,
            ritualDate: instances[0].scheduledAt.toISOString(),
            ritualType: 'daily-standup',
            title: instances[0].title,
          }),
          sendAt: new Date(instances[0].scheduledAt.getTime() - 15 * 60 * 1000),
          channel: 'slack',
          templateKey: 'daily-standup',
          status: 'pending',
          priority: 4,
          ritualInstanceId: instances[0].id,
        },
        {
          memberId: 'bob@example.com',
          ritualInstanceRefJson: JSON.stringify({
            ritualId: instances[0].id,
            ritualDate: instances[0].scheduledAt.toISOString(),
            ritualType: 'daily-standup',
            title: instances[0].title,
          }),
          sendAt: new Date(instances[0].scheduledAt.getTime() - 15 * 60 * 1000),
          channel: 'slack',
          templateKey: 'daily-standup',
          status: 'pending',
          priority: 4,
          ritualInstanceId: instances[0].id,
        },
      ],
    });

    logger.info('Created sample scheduled reminders');

    // Create some historical notification logs
    logger.info('Creating sample notification logs...');

    await prisma.notificationLog.createMany({
      data: [
        {
          memberId: 'alice@example.com',
          notificationType: 'reminder',
          channel: 'slack',
          templateKey: 'daily-standup',
          contentJson: JSON.stringify({
            title: 'Daily Standup Reminder',
            body: 'Your daily standup starts in 15 minutes',
          }),
          status: 'sent',
          externalId: 'notif_123456',
          sentAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
        {
          memberId: 'bob@example.com',
          notificationType: 'reminder',
          channel: 'email',
          templateKey: 'weekly-review',
          contentJson: JSON.stringify({
            title: 'Weekly Review Tomorrow',
            body: 'Don\'t forget about the weekly review tomorrow',
          }),
          status: 'sent',
          externalId: 'notif_123457',
          sentAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          memberId: 'carol@example.com',
          notificationType: 'reminder',
          channel: 'push',
          templateKey: 'daily-standup',
          contentJson: JSON.stringify({
            title: 'Standup in 5 minutes',
            body: 'Quick reminder about the standup',
          }),
          status: 'failed',
          errorMessage: 'Push notification token expired',
          sentAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        },
      ],
    });

    logger.info('Created sample notification logs');

    // Print summary
    logger.info('✅ Enhanced database seed completed successfully!');

    const [
      templateCount,
      preferenceCount,
      groupCount,
      instanceCount,
      participantCount,
      reminderCount,
      logCount,
    ] = await Promise.all([
      prisma.ritualReminderTemplate.count(),
      prisma.memberRitualPreference.count(),
      prisma.memberGroup.count(),
      prisma.ritualInstance.count(),
      prisma.ritualParticipant.count(),
      prisma.scheduledReminder.count(),
      prisma.notificationLog.count(),
    ]);

    logger.info('Summary:', {
      templates: templateCount,
      memberPreferences: preferenceCount,
      memberGroups: groupCount,
      ritualInstances: instanceCount,
      participants: participantCount,
      scheduledReminders: reminderCount,
      notificationLogs: logCount,
    });

    logger.info('\nDemo Users:');
    logger.info('- alice@example.com (Power User, Team Lead, NY timezone)');
    logger.info('- bob@example.com (Balanced User, Engineer, LA timezone)');
    logger.info('- carol@example.com (Minimal User, Designer, London timezone)');
    logger.info('- david@example.com (International User, PM, Tokyo timezone)');
    logger.info('- eve@example.com (Paused User, Engineer, on leave)');
  } catch (error) {
    logger.error('❌ Enhanced seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedEnhanced().catch((error) => {
  console.error(error);
  process.exit(1);
});
