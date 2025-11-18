import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { reminderProcessorService } from './reminder-processor.service';

export class CronService {
  private task: cron.ScheduledTask | null = null;

  /**
   * Start the cron job for processing reminders
   */
  start() {
    if (this.task) {
      logger.warn('Cron job already running');
      return;
    }

    const cronExpression = env.REMINDER_CHECK_INTERVAL;

    logger.info({ cronExpression }, 'Starting reminder processing cron job');

    this.task = cron.schedule(cronExpression, async () => {
      logger.debug('Cron job triggered');
      await reminderProcessorService.processPendingReminders();
    });

    logger.info('Cron job started successfully');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Cron job stopped');
    }
  }

  /**
   * Get status of the cron job
   */
  getStatus() {
    return {
      running: this.task !== null,
      interval: env.REMINDER_CHECK_INTERVAL,
    };
  }
}

export const cronService = new CronService();
