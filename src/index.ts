import { buildApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './config/logger';
import { cronService } from './services/cron.service';

async function main() {
  try {
    // Connect to database
    await connectDatabase();

    // Build and start the Fastify app
    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(`Server listening on ${env.HOST}:${env.PORT}`);

    // Start cron jobs
    cronService.start();

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);

        // Stop cron jobs
        cronService.stop();

        // Close server
        await app.close();

        // Disconnect from database
        await disconnectDatabase();

        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

main();
