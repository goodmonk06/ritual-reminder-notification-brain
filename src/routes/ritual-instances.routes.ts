import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ritualInstanceService } from '../services/ritual-instance.service';
import { schedulingEngineService } from '../services/scheduling-engine.service';

const createRitualInstanceSchema = z.object({
  templateKey: z.string().min(1),
  scheduledAt: z.string().datetime(),
  title: z.string().optional(),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  createdBy: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  participantIds: z.array(z.string()).optional(),
  autoScheduleReminders: z.boolean().optional().default(true),
});

const updateRitualInstanceSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateParticipantStatusSchema = z.object({
  status: z.enum(['invited', 'confirmed', 'declined', 'attended']),
  response: z.record(z.any()).optional(),
});

export async function ritualInstanceRoutes(fastify: FastifyInstance) {
  // Create ritual instance
  fastify.post('/ritual-instances', async (request, reply) => {
    const validation = createRitualInstanceSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const data = validation.data;
    const instance = await ritualInstanceService.createInstance(data);

    // Auto-schedule reminders if requested
    if (data.autoScheduleReminders) {
      await schedulingEngineService.scheduleRitualReminders({
        ritualInstanceRef: {
          ritualId: instance.id,
          ritualDate: instance.scheduledAt.toISOString(),
          ritualType: instance.templateKey,
          title: instance.title,
        },
        templateKey: instance.templateKey,
        targetMembers: data.participantIds,
      });
    }

    return reply.status(201).send(instance);
  });

  // List ritual instances
  fastify.get('/ritual-instances', async (request, reply) => {
    const query = request.query as any;

    const filters = {
      templateKey: query.templateKey,
      status: query.status,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
    };

    const result = await ritualInstanceService.listInstances(filters);
    return reply.send(result);
  });

  // Get ritual instance by ID
  fastify.get<{ Params: { id: string } }>('/ritual-instances/:id', async (request, reply) => {
    const instance = await ritualInstanceService.getInstance(request.params.id);
    return reply.send(instance);
  });

  // Update ritual instance
  fastify.patch<{ Params: { id: string } }>('/ritual-instances/:id', async (request, reply) => {
    const validation = updateRitualInstanceSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const instance = await ritualInstanceService.updateInstance(
      request.params.id,
      validation.data
    );
    return reply.send(instance);
  });

  // Delete ritual instance
  fastify.delete<{ Params: { id: string } }>('/ritual-instances/:id', async (request, reply) => {
    await ritualInstanceService.deleteInstance(request.params.id);
    return reply.status(204).send();
  });

  // Get participants for a ritual instance
  fastify.get<{ Params: { id: string } }>(
    '/ritual-instances/:id/participants',
    async (request, reply) => {
      const participants = await ritualInstanceService.getParticipants(request.params.id);
      return reply.send(participants);
    }
  );

  // Add participants to a ritual instance
  fastify.post<{ Params: { id: string }; Body: { memberIds: string[] } }>(
    '/ritual-instances/:id/participants',
    async (request, reply) => {
      const { memberIds } = request.body;

      if (!Array.isArray(memberIds) || memberIds.length === 0) {
        return reply.status(400).send({ error: 'memberIds must be a non-empty array' });
      }

      await ritualInstanceService.addParticipants(request.params.id, memberIds);
      const participants = await ritualInstanceService.getParticipants(request.params.id);

      return reply.status(201).send(participants);
    }
  );

  // Update participant status
  fastify.patch<{ Params: { id: string; memberId: string } }>(
    '/ritual-instances/:id/participants/:memberId',
    async (request, reply) => {
      const validation = updateParticipantStatusSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const { status, response } = validation.data;

      await ritualInstanceService.updateParticipantStatus(
        request.params.id,
        request.params.memberId,
        status,
        response
      );

      const participants = await ritualInstanceService.getParticipants(request.params.id);
      return reply.send(participants);
    }
  );

  // Get participation stats
  fastify.get<{ Params: { id: string } }>(
    '/ritual-instances/:id/stats',
    async (request, reply) => {
      const stats = await ritualInstanceService.getParticipationStats(request.params.id);
      return reply.send(stats);
    }
  );

  // Start ritual
  fastify.post<{ Params: { id: string } }>(
    '/ritual-instances/:id/start',
    async (request, reply) => {
      const instance = await ritualInstanceService.startRitual(request.params.id);
      return reply.send(instance);
    }
  );

  // Complete ritual
  fastify.post<{ Params: { id: string } }>(
    '/ritual-instances/:id/complete',
    async (request, reply) => {
      const instance = await ritualInstanceService.completeRitual(request.params.id);
      return reply.send(instance);
    }
  );

  // Cancel ritual
  fastify.post<{ Params: { id: string } }>(
    '/ritual-instances/:id/cancel',
    async (request, reply) => {
      const instance = await ritualInstanceService.cancelRitual(request.params.id);
      return reply.send(instance);
    }
  );
}
