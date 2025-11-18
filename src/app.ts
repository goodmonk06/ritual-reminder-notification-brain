import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { logger } from './config/logger';
import { healthRoutes } from './routes/health.routes';
import { templateRoutes } from './routes/templates.routes';
import { memberPreferenceRoutes } from './routes/member-preferences.routes';
import { schedulingRoutes } from './routes/scheduling.routes';
import { ritualInstanceRoutes } from './routes/ritual-instances.routes';
import { formatErrorResponse } from './lib/errors';

export async function buildApp() {
  const fastify = Fastify({
    logger: logger,
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true,
  });

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(templateRoutes, { prefix: '/api' });
  await fastify.register(memberPreferenceRoutes, { prefix: '/api' });
  await fastify.register(schedulingRoutes, { prefix: '/api' });
  await fastify.register(ritualInstanceRoutes, { prefix: '/api' });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error({ error, url: request.url, method: request.method }, 'Request error');

    const errorResponse = formatErrorResponse(error, request.url);

    reply.status(errorResponse.error.statusCode).send(errorResponse);
  });

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: 'Not Found',
      statusCode: 404,
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  return fastify;
}
