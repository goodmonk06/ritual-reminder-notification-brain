import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { logger } from './config/logger';
import { healthRoutes } from './routes/health.routes';
import { templateRoutes } from './routes/templates.routes';
import { memberPreferenceRoutes } from './routes/member-preferences.routes';
import { schedulingRoutes } from './routes/scheduling.routes';

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

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    reply.status(error.statusCode || 500).send({
      error: error.message || 'Internal Server Error',
      statusCode: error.statusCode || 500,
    });
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
