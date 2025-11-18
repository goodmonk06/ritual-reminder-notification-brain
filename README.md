# Ritual Reminder Notification Brain

> **An intelligent, personalized reminder scheduling system for recurring rituals and work events**
> Part of a larger AI-driven community/civilization OS ecosystem

毎日のワーク・週間儀式・月次イベントを、個々の状況に合わせてリマインドする「儀式リマインダ脳」（unified-notification連携）。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

The **Ritual Reminder Notification Brain** is a sophisticated microservice that manages intelligent, context-aware reminder scheduling for recurring team rituals and personal work events. Unlike generic notification systems, this brain understands the temporal and social dynamics of recurring rituals, balancing the need to remind people without creating notification fatigue.

###  Key Features

- **Smart Scheduling**: Automatically computes reminder times based on ritual schedules and personal preferences
- **Personalization**: Member-specific opt-in levels, quiet hours, and timezone support
- **Multi-Channel**: Email, Slack, Push, and SMS notifications via pluggable adapters
- **Participation Tracking**: Full RSVP and attendance management for ritual instances
- **Audit Trail**: Complete notification history and analytics
- **Extensible Architecture**: Plugin system for custom notification providers
- **Rich Domain Model**: Templates, instances, participants, groups, custom rules
- **Production Ready**: Comprehensive error handling, logging, metrics, and testing

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 18+ |
| **Language** | TypeScript 5.3 (strict mode) |
| **API Framework** | Fastify 4.x |
| **Database** | PostgreSQL 15+ |
| **ORM** | Prisma 5.x |
| **Validation** | Zod |
| **Scheduling** | node-cron |
| **Logging** | Pino |
| **Testing** | Jest |
| **Containerization** | Docker + Docker Compose |

## Domain Model

### Core Entities & Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                      Domain Architecture                         │
└─────────────────────────────────────────────────────────────────┘

RitualReminderTemplate (1) ────┬──── (N) RitualInstance
  │                             │         │
  │ (defines)                   │         │ (creates)
  │                             │         │
  │                             └──────── (N) RitualParticipant
  │                                       │
  │                                       │ (links to)
  │                                       │
  │                             ┌─────────▼──────────────┐
  └───────(config)──────────────► MemberRitualPreference │
                                 └────────────────────────┘
                                       │
                                       │ (belongs to)
                                       │
                                       ▼
                          MemberGroup ◄──► MemberGroupMembership


ScheduledReminder ─────► RitualInstance (optional)
     │
     │ (creates)
     │
     ▼
NotificationLog ─────► RitualInstance (optional)
```

### Entity Descriptions

**RitualReminderTemplate**
Defines reusable ritual types (e.g., "Weekly Review", "Daily Standup"). Contains default timing offsets, channel preferences, category tags, and priority.

**RitualInstance**
Actual scheduled occurrences of rituals. Tracks participants, status (scheduled/in_progress/completed/cancelled), and metadata specific to this instance.

**RitualParticipant**
Junction table tracking member participation status (invited/confirmed/declined/attended) for each ritual instance.

**MemberRitualPreference**
Member-specific notification preferences including opt-in levels per template, quiet hours with timezone, and pause status.

**ScheduledReminder**
Individual reminders queued for delivery. Tracks status, retries, priority, and links to ritual instances.

**ReminderRule**
Custom per-member reminder rules that override template defaults for specific members.

**MemberGroup & MemberGroupMembership**
Support for bulk operations and cohort-based ritual management.

**NotificationLog**
Complete audit trail of all sent notifications with delivery status and external IDs.

## Architecture

### System Flow

```
1. Create Template ────────────────┐
   (define ritual type)            │
                                    ▼
2. Members Set Preferences ────────┼───► Preference Store
   (opt-in levels, quiet hours)    │
                                    ▼
3. Schedule Ritual Instance ────────┼───► Scheduling Engine
   (with participants)              │         │
                                    │         │ (computes)
                                    │         │
                                    │         ▼
                                    │    Calculate Times
                                    │    Apply Preferences
                                    │    Respect Quiet Hours
                                    │         │
                                    │         ▼
                                    │    Create Reminders
                                    │         │
                                    ▼         ▼
4. Cron Job (every minute) ────────┼───► Fetch Due Reminders
                                    │         │
                                    │         ▼
                                    │    Adapter Registry
                                    │         │
                                    │         ▼
                                    │    Send via Channel
                                    │         │
                                    │         ▼
                                    │    Log Delivery
                                    │         │
                                    ▼         ▼
5. Notification Delivered ─────────► Update Status & Metrics
```

### Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│  API Layer (Fastify Routes)                         │
│  - Templates, Preferences, Instances, Scheduling    │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  Service Layer                                       │
│  - Business Logic, Domain Rules, Orchestration      │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  Adapter Layer (Extensible)                         │
│  - Notification Adapters (Stub, Email, Slack, ...)  │
│  - Scheduling Strategies                            │
│  - Analytics Providers                              │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  Infrastructure Layer                               │
│  - Database (Prisma + PostgreSQL)                   │
│  - Cron Jobs (node-cron)                            │
│  - Logging (Pino), Metrics, Error Handling          │
└─────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **PostgreSQL** 15.0 or higher
- **Docker** and **Docker Compose** (optional, for containerized setup)

### Quick Start with Docker

The fastest way to get started:

```bash
# 1. Clone the repository
git clone <repository-url>
cd ritual-reminder-notification-brain

# 2. Copy environment variables
cp .env.example .env

# 3. Start everything with Docker Compose
docker-compose up -d

# 4. The API is now running at http://localhost:3000
```

That's it! The system will automatically run migrations and seed demo data.

### Local Development Setup

For development without Docker:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npm run db:generate

# 3. Start PostgreSQL (via Docker or locally)
npm run docker:dev  # or start your local PostgreSQL

# 4. Run database migrations
npm run db:migrate

# 5. Seed the database with demo data
npm run db:seed:enhanced

# 6. Start the development server
npm run dev
```

The server will start at `http://localhost:3000` with hot reload enabled.

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ritual_reminder?schema=public"

# Server
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Notification Hub (external service)
NOTIFICATION_HUB_URL=http://localhost:4000
NOTIFICATION_HUB_API_KEY=your_api_key_here

# Scheduling
REMINDER_CHECK_INTERVAL="*/1 * * * *"  # Every minute
```

## Example Flows

### Flow 1: Complete Ritual Lifecycle

**Create a Weekly Team Retrospective**

```bash
# 1. Create a ritual instance
curl -X POST http://localhost:3000/api/ritual-instances \
  -H "Content-Type: application/json" \
  -d '{
    "templateKey": "weekly-retro",
    "scheduledAt": "2024-01-19T15:00:00Z",
    "participantIds": ["alice@example.com", "bob@example.com", "carol@example.com"],
    "autoScheduleReminders": true
  }'

# Response: ritual instance with ID

# 2. Members confirm attendance
curl -X PATCH http://localhost:3000/api/ritual-instances/{id}/participants/alice@example.com \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'

# 3. System automatically sends reminders based on preferences
# - Alice gets reminders 48h and 3h before (she opted for "all")
# - Bob gets reminder 3h before (he opted for "normal")
# - Carol gets reminder 3h before (she opted for "minimal")

# 4. View participation stats
curl http://localhost:3000/api/ritual-instances/{id}/stats

# 5. Mark ritual as completed
curl -X POST http://localhost:3000/api/ritual-instances/{id}/complete
```

### Flow 2: Personal Preference Management

**Configure Custom Notification Preferences**

```bash
# Set quiet hours and opt-in levels
curl -X POST http://localhost:3000/api/member-preferences \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "dave@example.com",
    "optInLevelsJson": {
      "daily-standup": "minimal",
      "weekly-review": "all",
      "monthly-planning": "normal"
    },
    "quietHoursJson": {
      "start": "22:00",
      "end": "08:00",
      "timezone": "America/New_York"
    }
  }'

# The system will now:
# - Only send 1 reminder for daily standup (minimal)
# - Send all configured reminders for weekly review (all)
# - Send up to 2 reminders for monthly planning (normal)
# - Never send reminders between 10 PM and 8 AM Eastern Time
```

### Flow 3: Bulk Group Operations

**Schedule a Ritual for an Entire Team**

```bash
# 1. Create a member group
curl -X POST http://localhost:3000/api/member-groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering Team",
    "description": "All engineering team members",
    "memberIds": ["alice@example.com", "bob@example.com", "carol@example.com"]
  }'

# 2. Schedule ritual for the entire group
curl -X POST http://localhost:3000/api/schedule-ritual \
  -H "Content-Type: application/json" \
  -d '{
    "ritualInstanceRef": {
      "ritualId": "sprint-planning-2024-01",
      "ritualDate": "2024-01-22T10:00:00Z",
      "ritualType": "sprint-planning",
      "title": "Sprint Planning - Q1 2024"
    },
    "templateKey": "sprint-planning",
    "targetGroup": "engineering-team-id"
  }'
```

## API Reference

### Templates

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/templates` | GET | List all templates |
| `/api/templates` | POST | Create a template |
| `/api/templates/:key` | GET | Get template by key |
| `/api/templates/:key` | PATCH | Update template |
| `/api/templates/:key` | DELETE | Delete template |

### Ritual Instances

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ritual-instances` | GET | List ritual instances |
| `/api/ritual-instances` | POST | Create ritual instance |
| `/api/ritual-instances/:id` | GET | Get instance details |
| `/api/ritual-instances/:id` | PATCH | Update instance |
| `/api/ritual-instances/:id` | DELETE | Delete instance |
| `/api/ritual-instances/:id/participants` | GET | Get participants |
| `/api/ritual-instances/:id/participants` | POST | Add participants |
| `/api/ritual-instances/:id/participants/:memberId` | PATCH | Update RSVP status |
| `/api/ritual-instances/:id/stats` | GET | Get participation stats |
| `/api/ritual-instances/:id/start` | POST | Mark as in progress |
| `/api/ritual-instances/:id/complete` | POST | Mark as completed |
| `/api/ritual-instances/:id/cancel` | POST | Cancel the ritual |

### Member Preferences

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/member-preferences` | GET | List all preferences |
| `/api/member-preferences` | POST | Create/update preference |
| `/api/member-preferences/:memberId` | GET | Get member preference |
| `/api/member-preferences/:memberId` | PATCH | Update preference |
| `/api/member-preferences/:memberId` | DELETE | Delete preference |

### Scheduling

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/schedule-ritual` | POST | Schedule reminders for a ritual |
| `/api/reminders` | GET | List reminders |
| `/api/reminders/member/:memberId` | GET | Get member's reminders |
| `/api/reminders/:id` | GET | Get reminder details |
| `/api/reminders/:id` | DELETE | Delete reminder |

### Health & Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Basic health check |
| `/health/detailed` | GET | Detailed system health |

## Extension & Integration

### Pluggable Notification Adapters

The system uses an adapter pattern for sending notifications, making it easy to integrate with different providers:

```typescript
import { BaseNotificationAdapter, NotificationMessage, NotificationResult } from './lib/adapters/notification.adapter';

export class SlackAdapter extends BaseNotificationAdapter {
  readonly name = 'slack';
  readonly supportedChannels = ['slack'];

  async send(message: NotificationMessage): Promise<NotificationResult> {
    // Implement Slack API integration
    const response = await slackClient.chat.postMessage({
      channel: message.memberId,
      text: message.body,
    });

    return {
      success: true,
      notificationId: response.ts,
      message: 'Sent via Slack',
    };
  }
}

// Register the adapter
import { adapterRegistry } from './lib/adapters/adapter-registry';
adapterRegistry.register(new SlackAdapter());
```

### Event System (Future)

The system is designed to support domain events for integration with other services:

```typescript
// Example future event handler
eventBus.on('ritual.completed', async (event) => {
  // Trigger analytics
  // Update external systems
  // Send summary emails
});
```

### Integration with Other Services

**Common Integration Scenarios:**

1. **Authentication Service**: Validate member IDs and permissions
2. **User Profile Service**: Fetch member timezones and preferences
3. **Calendar Service**: Sync ritual instances with external calendars
4. **Analytics Service**: Export metrics and participation data
5. **Notification Hub**: Route notifications through a unified hub

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run start            # Start production server

# Type Checking & Quality
npm run typecheck        # Run TypeScript compiler checks
npm run lint             # Lint code with ESLint
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run check            # Run typecheck, lint, and tests

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Database
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Run migrations (dev)
npm run db:migrate:deploy # Deploy migrations (prod)
npm run db:push          # Push schema changes (dev)
npm run db:seed          # Run basic seed
npm run db:seed:enhanced # Run comprehensive seed
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (WARNING)

# Docker
npm run docker:up        # Start production containers
npm run docker:down      # Stop production containers
npm run docker:dev       # Start dev PostgreSQL only
npm run docker:dev:down  # Stop dev containers
npm run docker:logs      # Tail container logs

# Setup
npm run setup            # Install + generate Prisma Client
npm run clean            # Remove build artifacts
```

### Project Structure

```
ritual-reminder-notification-brain/
├── src/
│   ├── app.ts                 # Fastify app setup
│   ├── index.ts               # Entry point
│   ├── config/                # Configuration
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── logger.ts
│   ├── lib/                   # Shared utilities
│   │   ├── adapters/          # Pluggable adapters
│   │   ├── errors.ts          # Error classes
│   │   └── metrics.ts         # Metrics collection
│   ├── routes/                # API routes
│   │   ├── health.routes.ts
│   │   ├── templates.routes.ts
│   │   ├── member-preferences.routes.ts
│   │   ├── ritual-instances.routes.ts
│   │   └── scheduling.routes.ts
│   ├── services/              # Business logic
│   │   ├── template.service.ts
│   │   ├── member-preference.service.ts
│   │   ├── ritual-instance.service.ts
│   │   ├── scheduling-engine.service.ts
│   │   ├── reminder.service.ts
│   │   ├── reminder-processor.service.ts
│   │   ├── notification-hub.service.ts
│   │   ├── notification-log.service.ts
│   │   └── cron.service.ts
│   ├── types/                 # TypeScript types & Zod schemas
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   └── timing.ts
│   └── scripts/               # CLI scripts
│       ├── seed.ts
│       └── seed-enhanced.ts
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration files
├── docs/                      # Documentation
│   └── PHASE3_OVERVIEW.md
├── tests/                     # Test files
├── docker-compose.yml         # Production Docker setup
├── docker-compose.dev.yml     # Development Docker setup
├── Dockerfile                 # App container definition
├── package.json
├── tsconfig.json
└── README.md
```

## Demo Data

After running `npm run db:seed:enhanced`, you'll have:

### Demo Users

| Email | Profile | Timezone | Opt-In Style |
|-------|---------|----------|--------------|
| `alice@example.com` | Team Lead, Power User | America/New_York | All notifications |
| `bob@example.com` | Engineer, Balanced | America/Los_Angeles | Normal frequency |
| `carol@example.com` | Designer, Minimal | Europe/London | Essential only |
| `david@example.com` | Product Manager, International | Asia/Tokyo | Normal frequency |
| `eve@example.com` | Engineer, On Leave | America/Chicago | Paused |

### Demo Templates

- **Daily**: Team Standup, Personal Reflection
- **Weekly**: Review & Planning, Team Retrospective
- **Monthly**: Planning Session, 1-on-1 Check-ins
- **Quarterly**: OKR Review
- **Ad-hoc**: Project Kickoffs

### Demo Ritual Instances

- Today's standup (2 hours from seed time)
- This week's retrospective
- Next month's planning session

All with participants, scheduled reminders, and sample notification logs.

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Coverage Goals

- **Unit Tests**: Core utilities and service logic
- **Integration Tests**: API endpoints and database interactions
- **E2E Tests**: Complete user workflows

Current test files:
- `src/utils/timing.test.ts` - Timing calculation tests
- `src/services/template.service.test.ts` - Template service tests

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `DATABASE_URL` for production database
- [ ] Set up proper logging level (`LOG_LEVEL=warn` or `LOG_LEVEL=error`)
- [ ] Configure notification hub credentials
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy for PostgreSQL
- [ ] Review and adjust `REMINDER_CHECK_INTERVAL`
- [ ] Set up SSL/TLS for API endpoints

### Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale if needed
docker-compose up -d --scale app=3
```

### Database Migrations

```bash
# In production, use deploy command (doesn't prompt)
npm run db:migrate:deploy
```

## Future Extensions

### Planned Features

- **Advanced Scheduling**:
  - Recurring ritual schedules (daily, weekly, monthly patterns)
  - Smart rescheduling based on participation rates
  - Holiday and blackout date support

- **Rich Notifications**:
  - Custom message templates
  - Markdown/HTML email formatting
  - Attachment support

- **Analytics Dashboard**:
  - Participation trends over time
  - Notification effectiveness metrics
  - Member engagement scores

- **AI/ML Integration**:
  - Optimal reminder time prediction
  - Automatic quiet hours detection
  - Participation likelihood scoring

- **Webhook System**:
  - Event webhooks for external systems
  - Incoming webhook endpoints for ritual triggers

- **Mobile App**:
  - Native push notifications
  - Quick RSVP interface
  - Ritual calendar view

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

### Development Guidelines

1. Follow the existing code style (use `npm run format`)
2. Add tests for new features
3. Update documentation
4. Ensure all checks pass (`npm run check`)

## License

MIT

## Support

For issues and questions:
- **Issues**: [GitHub Issues](https://github.com/your-org/ritual-reminder-notification-brain/issues)
- **Documentation**: See `/docs` directory
- **Email**: support@example.com

---

**Built with ❤️ for better team rituals and personal productivity**
