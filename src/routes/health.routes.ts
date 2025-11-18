import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { cronService } from '../services/cron.service';
import { reminderProcessorService } from '../services/reminder-processor.service';

export async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check
  fastify.get('/health', async (request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // Detailed health check
  fastify.get('/health/detailed', async (request, reply) => {
    const dbHealthy = await checkDatabaseHealth();
    const cronStatus = cronService.getStatus();
    const processorStatus = reminderProcessorService.getStatus();

    return reply.send({
      status: dbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealthy,
      },
      cron: cronStatus,
      processor: processorStatus,
    });
  });
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}
