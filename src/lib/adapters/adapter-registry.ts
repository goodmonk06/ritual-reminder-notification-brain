/**
 * Adapter registry for managing notification adapters
 * Supports multiple adapters with fallback strategies
 */

import { logger } from '../../config/logger';
import { NotificationChannel } from '../../types';
import {
  INotificationAdapter,
  NotificationMessage,
  NotificationResult,
} from './notification.adapter';
import { StubNotificationAdapter } from './stub-notification.adapter';

export class AdapterRegistry {
  private adapters: Map<string, INotificationAdapter> = new Map();
  private defaultAdapter: INotificationAdapter;

  constructor() {
    // Register default stub adapter
    this.defaultAdapter = new StubNotificationAdapter();
    this.register(this.defaultAdapter);
  }

  /**
   * Register a new adapter
   */
  register(adapter: INotificationAdapter): void {
    this.adapters.set(adapter.name, adapter);
    logger.info({ adapterName: adapter.name, channels: adapter.supportedChannels }, 'Adapter registered');
  }

  /**
   * Unregister an adapter
   */
  unregister(adapterName: string): void {
    this.adapters.delete(adapterName);
    logger.info({ adapterName }, 'Adapter unregistered');
  }

  /**
   * Get adapter by name
   */
  getAdapter(name: string): INotificationAdapter | undefined {
    return this.adapters.get(name);
  }

  /**
   * Get all registered adapters
   */
  getAllAdapters(): INotificationAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Find adapter that supports a given channel
   */
  findAdapterForChannel(channel: NotificationChannel): INotificationAdapter | undefined {
    for (const adapter of this.adapters.values()) {
      if (adapter.supports(channel)) {
        return adapter;
      }
    }
    return undefined;
  }

  /**
   * Send notification using appropriate adapter
   * Falls back to default adapter if no specific adapter is found
   */
  async send(message: NotificationMessage, preferredAdapter?: string): Promise<NotificationResult> {
    let adapter: INotificationAdapter | undefined;

    // Try preferred adapter first
    if (preferredAdapter) {
      adapter = this.getAdapter(preferredAdapter);
      if (adapter && !adapter.supports(message.channel)) {
        logger.warn(
          { adapter: preferredAdapter, channel: message.channel },
          'Preferred adapter does not support channel'
        );
        adapter = undefined;
      }
    }

    // Fall back to channel-compatible adapter
    if (!adapter) {
      adapter = this.findAdapterForChannel(message.channel);
    }

    // Fall back to default adapter
    if (!adapter) {
      logger.warn({ channel: message.channel }, 'No adapter found for channel, using default');
      adapter = this.defaultAdapter;
    }

    try {
      logger.debug({ adapter: adapter.name, channel: message.channel }, 'Sending notification via adapter');
      return await adapter.send(message);
    } catch (error: any) {
      logger.error({ error, adapter: adapter.name }, 'Adapter send failed');
      return {
        success: false,
        error: error.message || 'Unknown adapter error',
        metadata: {
          adapter: adapter.name,
        },
      };
    }
  }

  /**
   * Health check all adapters
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, adapter] of this.adapters.entries()) {
      try {
        results[name] = await adapter.healthCheck();
      } catch (error) {
        logger.error({ error, adapter: name }, 'Adapter health check failed');
        results[name] = false;
      }
    }

    return results;
  }
}

// Singleton instance
export const adapterRegistry = new AdapterRegistry();
