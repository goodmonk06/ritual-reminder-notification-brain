import { FastifyInstance } from 'fastify';
import { createTemplateSchema, updateTemplateSchema } from '../types';
import { templateService } from '../services/template.service';

export async function templateRoutes(fastify: FastifyInstance) {
  // Create a new template
  fastify.post('/templates', async (request, reply) => {
    const validation = createTemplateSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    try {
      const template = await templateService.createTemplate(validation.data);
      return reply.status(201).send(template);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.status(409).send({
          error: 'Template with this key already exists',
        });
      }
      throw error;
    }
  });

  // Get all templates
  fastify.get('/templates', async (request, reply) => {
    const templates = await templateService.getAllTemplates();
    return reply.send(templates);
  });

  // Get template by key
  fastify.get<{ Params: { key: string } }>('/templates/:key', async (request, reply) => {
    const template = await templateService.getTemplateByKey(request.params.key);

    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    return reply.send(template);
  });

  // Update template
  fastify.patch<{ Params: { key: string } }>('/templates/:key', async (request, reply) => {
    const validation = updateTemplateSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    try {
      const template = await templateService.updateTemplate(
        request.params.key,
        validation.data
      );
      return reply.send(template);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ error: 'Template not found' });
      }
      throw error;
    }
  });

  // Delete template
  fastify.delete<{ Params: { key: string } }>('/templates/:key', async (request, reply) => {
    try {
      await templateService.deleteTemplate(request.params.key);
      return reply.status(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ error: 'Template not found' });
      }
      throw error;
    }
  });
}
