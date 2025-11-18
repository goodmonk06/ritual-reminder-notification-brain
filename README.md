# Ritual Reminder Notification Brain

毎日のワーク・週間儀式・月次イベントを、個々の状況に合わせてリマインドする「儀式リマインダ脳」（unified-notification連携）。

A sophisticated reminder system that plans and triggers personalized notifications for rituals and recurring work events. It adapts timing based on member preferences, time zones, past behavior, and integrates with a unified notification hub downstream.

## Features

- **Template-Based Reminders**: Define reusable ritual templates with configurable timing offsets
- **Personal Preferences**: Member-specific opt-in levels, quiet hours, and timezone support
- **Smart Scheduling**: Automatically computes reminder times and adjusts for personal preferences
- **Multi-Channel Support**: Email, Slack, Push, and SMS notifications
- **Cron-Based Processing**: Automated reminder delivery via scheduled jobs
- **Unified Hub Integration**: Seamless integration with downstream notification services

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Ritual Reminder Brain                       │
│                                                              │
│  ┌──────────────┐     ┌─────────────────┐                   │
│  │  Templates   │     │   Preferences   │                   │
│  │  Management  │     │   Management    │                   │
│  └──────┬───────┘     └────────┬────────┘                   │
│         │                      │                            │
│         └──────────┬───────────┘                            │
│                    │                                        │
│         ┌──────────▼───────────┐                            │
│         │  Scheduling Engine   │                            │
│         │  - Compute Times     │                            │
│         │  - Apply Preferences │                            │
│         │  - Create Reminders  │                            │
│         └──────────┬───────────┘                            │
│                    │                                        │
│         ┌──────────▼───────────┐                            │
│         │ Scheduled Reminders  │                            │
│         │     (Database)       │                            │
│         └──────────┬───────────┘                            │
│                    │                                        │
│         ┌──────────▼───────────┐                            │
│         │   Cron Processor     │                            │
│         │  (Every minute)      │                            │
│         └──────────┬───────────┘                            │
│                    │                                        │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Notification Hub      │
        │  - Email               │
        │  - Slack               │
        │  - Push                │
        │  - SMS                 │
        └────────────────────────┘
```

### Domain Model

**RitualReminderTemplate**
- Defines the blueprint for a ritual type
- Contains default timing offsets (e.g., -24h, -1h before ritual)
- Specifies preferred notification channels
- Examples: "Weekly Review", "Daily Standup", "Monthly Planning"

**MemberRitualPreference**
- Member-specific notification preferences
- Opt-in levels per ritual: none, minimal, normal, all
- Quiet hours with timezone support
- Last notified timestamp for rate limiting

**ScheduledReminder**
- Individual reminder to be sent
- References a ritual instance (ID, date, type)
- Specifies when to send, which channel, and status
- Tracks delivery status and errors

### Flow Diagram

```
1. Create Ritual Template
   │
   ▼
2. Members Set Preferences
   │
   ▼
3. Schedule Ritual Instance
   │
   ├─→ Fetch Template
   │
   ├─→ Find Opted-In Members
   │
   ├─→ For Each Member:
   │   ├─→ Get Preferences
   │   ├─→ Calculate Reminder Times
   │   ├─→ Adjust for Quiet Hours
   │   ├─→ Create Scheduled Reminders
   │
   ▼
4. Cron Job (Every Minute)
   │
   ├─→ Fetch Due Reminders
   │
   ├─→ For Each Reminder:
   │   ├─→ Send to Notification Hub
   │   ├─→ Update Status (sent/failed)
   │   └─→ Update Last Notified Time
   │
   ▼
5. Notification Delivered
```

## Tech Stack

- **Backend**: Node.js + Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Scheduling**: node-cron
- **Validation**: Zod
- **Testing**: Jest
- **Containerization**: Docker + Docker Compose

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional, for containerized setup)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ritual-reminder-notification-brain
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start PostgreSQL (using Docker):
```bash
docker-compose -f docker-compose.dev.yml up -d
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed the database with sample data:
```bash
npm run seed
```

7. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Docker Setup

To run the entire application with Docker:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- The ritual reminder brain application

## API Documentation

### Templates

**Create Template**
```http
POST /api/templates
Content-Type: application/json

{
  "key": "weekly-review",
  "name": "Weekly Review",
  "descriptionMarkdown": "Weekly reflection ritual",
  "defaultTimingJson": ["-24h", "-1h"],
  "channelPreferencesJson": {
    "email": true,
    "slack": true
  }
}
```

**Get All Templates**
```http
GET /api/templates
```

**Get Template by Key**
```http
GET /api/templates/:key
```

**Update Template**
```http
PATCH /api/templates/:key
Content-Type: application/json

{
  "name": "Updated Name",
  "defaultTimingJson": ["-2h"]
}
```

**Delete Template**
```http
DELETE /api/templates/:key
```

### Member Preferences

**Create/Update Member Preference**
```http
POST /api/member-preferences
Content-Type: application/json

{
  "memberId": "member-001",
  "optInLevelsJson": {
    "weekly-review": "all",
    "daily-standup": "normal"
  },
  "quietHoursJson": {
    "start": "22:00",
    "end": "08:00",
    "timezone": "America/New_York"
  },
  "metaJson": {
    "preferredLanguage": "en"
  }
}
```

**Get Member Preference**
```http
GET /api/member-preferences/:memberId
```

**Update Member Preference**
```http
PATCH /api/member-preferences/:memberId
Content-Type: application/json

{
  "optInLevelsJson": {
    "weekly-review": "minimal"
  }
}
```

### Scheduling

**Schedule Ritual Reminders**
```http
POST /api/schedule-ritual
Content-Type: application/json

{
  "ritualInstanceRef": {
    "ritualId": "weekly-review-2024-w01",
    "ritualDate": "2024-01-15T10:00:00Z",
    "ritualType": "weekly-review",
    "title": "Week 1 Review"
  },
  "templateKey": "weekly-review",
  "targetMembers": ["member-001", "member-002"]
}
```

**Get Reminders**
```http
GET /api/reminders
```

**Get Reminders by Member**
```http
GET /api/reminders/member/:memberId
```

### Health Check

```http
GET /health
```

```http
GET /health/detailed
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 3000 |
| `HOST` | Server host | 0.0.0.0 |
| `NODE_ENV` | Environment (development/production/test) | development |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | info |
| `NOTIFICATION_HUB_URL` | URL of notification hub service | http://localhost:4000 |
| `NOTIFICATION_HUB_API_KEY` | API key for notification hub | Optional |
| `REMINDER_CHECK_INTERVAL` | Cron expression for reminder processing | */1 * * * * |

### Timing Offsets

Timing offsets define when to send reminders relative to the ritual time:

- `m` = minutes (e.g., "-15m" = 15 minutes before)
- `h` = hours (e.g., "-1h" = 1 hour before)
- `d` = days (e.g., "-1d" = 1 day before)

### Opt-In Levels

- **none**: No reminders
- **minimal**: Only the closest reminder (e.g., -1h)
- **normal**: Up to 2 reminders (e.g., -24h, -1h)
- **all**: All configured reminders

## Development

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Lint Code

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

### Database Operations

```bash
# Generate Prisma Client
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Seed database
npm run seed
```

## Project Structure

```
ritual-reminder-notification-brain/
├── src/
│   ├── config/          # Configuration (env, database, logger)
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript types and Zod schemas
│   ├── utils/           # Utility functions
│   ├── scripts/         # CLI scripts (seed, etc.)
│   ├── app.ts           # Fastify app setup
│   └── index.ts         # Entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── docker-compose.yml   # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup
├── Dockerfile           # Application Docker image
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

### 1. Template Definition

Administrators create ritual templates defining:
- Unique key (e.g., "weekly-review")
- Display name and description
- Default timing offsets (when to send reminders)
- Preferred notification channels

### 2. Member Preferences

Members configure their notification preferences:
- Opt-in levels for each ritual type
- Quiet hours (time range when not to send notifications)
- Timezone for accurate time calculations
- Additional metadata (language, pause status, etc.)

### 3. Scheduling Ritual Instances

When a ritual is scheduled:
1. System fetches the template
2. Identifies all opted-in members (or uses provided member list)
3. For each member:
   - Retrieves their preferences
   - Calculates reminder times based on template offsets
   - Adjusts times to avoid quiet hours
   - Filters reminders based on opt-in level
   - Creates scheduled reminder records

### 4. Reminder Processing

A cron job runs every minute (configurable):
1. Fetches all pending reminders due for delivery
2. For each reminder:
   - Sends notification request to unified hub
   - Updates reminder status (sent/failed/skipped)
   - Updates member's last notified timestamp
   - Logs delivery results

### 5. Notification Delivery

The notification hub service (external):
- Receives notification requests
- Routes to appropriate channel (email, Slack, etc.)
- Returns delivery status

## Notification Hub Integration

The system integrates with a unified notification hub via HTTP API. The integration is currently stubbed in `src/services/notification-hub.service.ts`.

**Expected API Contract:**

```typescript
// Request
POST /api/notifications/send
{
  "memberId": "member-001",
  "channel": "email",
  "templateKey": "weekly-review",
  "ritualInstanceRef": {
    "ritualId": "weekly-review-2024-w01",
    "ritualDate": "2024-01-15T10:00:00Z",
    "ritualType": "weekly-review"
  },
  "metadata": {
    "reminderId": "uuid",
    "sendAt": "2024-01-14T10:00:00Z"
  }
}

// Response
{
  "success": true,
  "notificationId": "notif_123",
  "message": "Notification sent"
}
```

To enable real notifications, update the stub in `notification-hub.service.ts` with actual HTTP calls.

## Examples

### Example 1: Weekly Review

1. Create template:
```bash
curl -X POST http://localhost:3000/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "key": "weekly-review",
    "name": "Weekly Review",
    "descriptionMarkdown": "Reflect on your week",
    "defaultTimingJson": ["-24h", "-1h"],
    "channelPreferencesJson": {"email": true}
  }'
```

2. Member opts in:
```bash
curl -X POST http://localhost:3000/api/member-preferences \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "alice",
    "optInLevelsJson": {"weekly-review": "all"},
    "quietHoursJson": {
      "start": "22:00",
      "end": "08:00",
      "timezone": "America/New_York"
    }
  }'
```

3. Schedule ritual:
```bash
curl -X POST http://localhost:3000/api/schedule-ritual \
  -H "Content-Type: application/json" \
  -d '{
    "ritualInstanceRef": {
      "ritualId": "weekly-review-2024-w01",
      "ritualDate": "2024-01-15T15:00:00Z",
      "ritualType": "weekly-review",
      "title": "Week 1 Review"
    },
    "templateKey": "weekly-review"
  }'
```

This creates two reminders for Alice:
- 24 hours before (Jan 14, 3 PM)
- 1 hour before (Jan 15, 2 PM)

Both adjusted for quiet hours if necessary.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please open an issue on the GitHub repository.
