# Phase 3 Overview: Ritual Reminder Notification Brain

## Purpose Statement

The **Ritual Reminder Notification Brain** is a specialized microservice within a larger AI-driven community/civilization OS ecosystem that manages intelligent, personalized reminder scheduling for recurring rituals and work events. It solves the problem of notification fatigue and poor timing by adapting reminder delivery based on member preferences, quiet hours, timezone differences, participation history, and ritual importance. Unlike generic notification systems, this brain understands the temporal and social dynamics of recurring team rituals, balancing the need to remind people without overwhelming them.

The system acts as the "temporal cortex" for ritual participation, ensuring that team members are notified at the right time, through the right channel, with the right frequency—all while respecting personal boundaries and preferences.

## Existing Features (Pre-Phase 3)

### Core Domain Models
- **RitualReminderTemplate**: Template definitions for ritual types (e.g., weekly review, daily standup)
- **MemberRitualPreference**: Member-specific notification preferences with opt-in levels and quiet hours
- **ScheduledReminder**: Individual reminders queued for delivery

### Existing Capabilities
- Template CRUD operations with configurable timing offsets
- Member preference management with quiet hours and timezone support
- Smart scheduling engine that computes reminder times
- Cron-based reminder processor (runs every minute)
- Notification hub integration (currently stubbed)
- Multi-channel support (email, slack, push, SMS)
- Opt-in level filtering (none, minimal, normal, all)
- Basic validation and error handling
- Docker containerization
- Seed data script
- Basic test coverage

### Current Limitations
- No concept of actual ritual instances (only templates)
- No participation tracking or attendance records
- No historical notification logs
- Limited extensibility (hard-coded notification adapter)
- No custom reminder rules per member
- No bulk operations or member grouping
- No rich analytics or metrics dashboards
- Missing integration tests
- Limited test fixtures and factories
- No CLI tools for admin operations

## Phase 3 Plan

### 1. Domain Model Expansion ✅ (Completed)

**New Entities Added:**
- **RitualInstance**: Actual scheduled ritual events with participants
- **RitualParticipant**: Track participant status (invited, confirmed, declined, attended)
- **ReminderRule**: Custom reminder rules per member/template pair
- **MemberGroup & MemberGroupMembership**: Bulk member operations and cohort management
- **NotificationLog**: Complete audit trail of all notifications sent

**Enhanced Existing Entities:**
- Templates now have categories, tags, priority, active status
- Members now have explicit timezone and pause status
- Reminders now track retry count, priority, and link to ritual instances

### 2. Services & Business Logic Expansion

**New Services to Implement:**
- **RitualInstanceService**: Create, manage, and track ritual instances
- **ParticipantService**: Handle RSVP, attendance tracking
- **NotificationLogService**: Query notification history
- **MemberGroupService**: Bulk operations and cohort management
- **ReminderRuleService**: Custom per-member reminder logic
- **AnalyticsService**: Metrics and insights dashboard

**Enhanced Existing Services:**
- Template service now handles categories, tags, filtering
- Scheduling engine supports custom rules and priority queuing
- Reminder processor includes retry logic and detailed logging

### 3. Multiple Vertical Slices

**Slice 1: Complete Ritual Lifecycle**
- Create ritual instance from template
- Invite participants
- Schedule reminders for all participants
- Track RSVPs
- Process reminders
- Mark ritual as completed
- View participation stats

**Slice 2: Custom Reminder Rules**
- Member creates custom rule for a template
- System applies custom rule instead of template defaults
- Track effectiveness of custom rules

**Slice 3: Member Groups & Bulk Operations**
- Create member groups
- Schedule ritual for entire group
- View group participation analytics

### 4. Extensibility & Plugin System

**Adapter Interfaces:**
- `INotificationAdapter`: Send notifications via different providers
- `ISchedulingStrategy`: Pluggable scheduling algorithms
- `IAnalyticsProvider`: Export metrics to different systems
- `IRitualTemplateProvider`: Import templates from external sources

**Event System:**
- Domain events for ritual lifecycle (created, started, completed, cancelled)
- Reminder events (scheduled, sent, failed, retried)
- Participation events (invited, confirmed, declined, attended)
- Event handlers for logging, metrics, webhooks

### 5. Testing Infrastructure

**Test Factories:**
- Template factory
- Member preference factory
- Ritual instance factory
- Reminder factory

**Test Suites:**
- Unit tests for all services
- Integration tests for vertical slices
- E2E tests for complete workflows
- Performance tests for scheduling engine

### 6. DX & Tooling

**CLI Commands:**
- `ritual-brain template create <name>`
- `ritual-brain ritual schedule <template-key> <date>`
- `ritual-brain member add <member-id>`
- `ritual-brain stats show`
- `ritual-brain reminders process` (manual trigger)

**Enhanced Scripts:**
- Standardized npm scripts
- Database migration and seeding
- Docker orchestration
- Log tailing and debugging

### 7. Documentation & Examples

**Documentation Structure:**
- Architecture overview with diagrams
- Domain model deep dive
- API reference
- Integration recipes
- Example workflows
- Deployment guide

**Example Scenarios:**
- Weekly team retrospective
- Daily standup reminders
- Monthly planning session
- Custom one-off rituals

### 8. Production Readiness

**Observability:**
- Structured logging with context
- Metrics collection (counters, gauges, histograms)
- Health check endpoints
- Performance monitoring

**Quality:**
- Comprehensive test coverage (>80%)
- Type safety end-to-end
- Input validation on all routes
- Consistent error handling

## Implementation Priority

1. ✅ **Database Schema Expansion** (Completed)
2. **Core Services Implementation** (Next)
   - RitualInstanceService
   - ParticipantService
   - NotificationLogService
3. **API Routes for New Entities**
   - Ritual instances CRUD
   - Participant management
   - Notification logs query
4. **Enhanced Seed Data** (Rich, realistic datasets)
5. **Test Factories & Comprehensive Tests**
6. **Adapter/Plugin System**
7. **CLI Tools**
8. **Documentation Update**

## Success Metrics

- All 3 vertical slices demonstrable end-to-end
- Test coverage >80%
- API response time <100ms (p95)
- Zero unhandled errors in production scenarios
- Complete documentation for integration
- CLI tools functional and documented
- Docker setup works on first try
- Seed data creates realistic demo environment
