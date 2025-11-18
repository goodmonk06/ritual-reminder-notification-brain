import { FastifyInstance } from 'fastify';
import { scheduleRitualInputSchema } from '../types';
import { schedulingEngineService } from '../services/scheduling-engine.service';
import { reminderService } from '../services/reminder.service';

export async function schedulingRoutes(fastify: FastifyInstance) {
  // Schedule reminders for a ritual instance
  fastify.post('/schedule-ritual', async (request, reply) => {
    const validation = scheduleRitualInputSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    try {
      const reminders = await schedulingEngineService.scheduleRitualReminders(
        validation.data
      );

      return reply.status(201).send({
        success: true,
        remindersCreated: reminders.length,
        reminders,
      });
    } catch (error: any) {
      return reply.status(400).send({
        error: error.message || 'Failed to schedule reminders',
      });
    }
  });

  // Get all reminders (with optional filters)
  fastify.get('/reminders', async (request, reply) => {
    // In a real app, you'd want to add pagination and filtering
    // For now, just return a subset
    const reminders = await reminderService.getPendingReminders(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
    );
    return reply.send(reminders);
  });

  // Get reminders for a specific member
  fastify.get<{ Params: { memberId: string } }>(
    '/reminders/member/:memberId',
    async (request, reply) => {
      const reminders = await reminderService.getRemindersByMember(
        request.params.memberId
      );
      return reply.send(reminders);
    }
  );

  // Get a specific reminder
  fastify.get<{ Params: { id: string } }>(
    '/reminders/:id',
    async (request, reply) => {
      const reminder = await reminderService.getReminder(request.params.id);

      if (!reminder) {
        return reply.status(404).send({ error: 'Reminder not found' });
      }

      return reply.send(reminder);
    }
  );

  // Delete a reminder
  fastify.delete<{ Params: { id: string } }>(
    '/reminders/:id',
    async (request, reply) => {
      try {
        await reminderService.deleteReminder(request.params.id);
        return reply.status(204).send();
      } catch (error: any) {
        if (error.code === 'P2025') {
          return reply.status(404).send({ error: 'Reminder not found' });
        }
        throw error;
      }
    }
  );
}
