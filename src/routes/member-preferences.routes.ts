import { FastifyInstance } from 'fastify';
import {
  createMemberPreferenceSchema,
  updateMemberPreferenceSchema,
} from '../types';
import { memberPreferenceService } from '../services/member-preference.service';

export async function memberPreferenceRoutes(fastify: FastifyInstance) {
  // Create or update member preference
  fastify.post('/member-preferences', async (request, reply) => {
    const validation = createMemberPreferenceSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const preference = await memberPreferenceService.createOrUpdatePreference(
      validation.data
    );
    return reply.status(201).send(preference);
  });

  // Get all member preferences
  fastify.get('/member-preferences', async (request, reply) => {
    const preferences = await memberPreferenceService.getAllPreferences();
    return reply.send(preferences);
  });

  // Get member preference by member ID
  fastify.get<{ Params: { memberId: string } }>(
    '/member-preferences/:memberId',
    async (request, reply) => {
      const preference = await memberPreferenceService.getPreference(
        request.params.memberId
      );

      if (!preference) {
        return reply.status(404).send({ error: 'Member preference not found' });
      }

      return reply.send(preference);
    }
  );

  // Update member preference
  fastify.patch<{ Params: { memberId: string } }>(
    '/member-preferences/:memberId',
    async (request, reply) => {
      const validation = updateMemberPreferenceSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      try {
        const preference = await memberPreferenceService.updatePreference(
          request.params.memberId,
          validation.data
        );
        return reply.send(preference);
      } catch (error: any) {
        if (error.code === 'P2025') {
          return reply.status(404).send({ error: 'Member preference not found' });
        }
        throw error;
      }
    }
  );

  // Delete member preference
  fastify.delete<{ Params: { memberId: string } }>(
    '/member-preferences/:memberId',
    async (request, reply) => {
      try {
        await memberPreferenceService.deletePreference(request.params.memberId);
        return reply.status(204).send();
      } catch (error: any) {
        if (error.code === 'P2025') {
          return reply.status(404).send({ error: 'Member preference not found' });
        }
        throw error;
      }
    }
  );
}
