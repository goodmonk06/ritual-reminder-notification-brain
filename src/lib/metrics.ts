/**
 * Metrics collection and monitoring utilities
 * Currently stores metrics in-memory; can be extended to integrate with
 * external monitoring systems (Prometheus, Datadog, etc.)
 */

import { logger } from '../config/logger';

export interface MetricLabels {
  [key: string]: string | number;
}

export interface Metric {
  name: string;
  value: number;
  labels: MetricLabels;
  timestamp: Date;
  type: 'counter' | 'gauge' | 'histogram';
}

class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels: MetricLabels = {}, value: number = 1) {
    const key = this.getMetricKey(name, labels);
    const currentValue = this.counters.get(key) || 0;
    this.counters.set(key, currentValue + value);

    this.recordMetric({
      name,
      value: currentValue + value,
      labels,
      timestamp: new Date(),
      type: 'counter',
    });

    logger.debug({ name, labels, value: currentValue + value }, 'Counter incremented');
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels: MetricLabels = {}) {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, value);

    this.recordMetric({
      name,
      value,
      labels,
      timestamp: new Date(),
      type: 'gauge',
    });

    logger.debug({ name, labels, value }, 'Gauge set');
  }

  /**
   * Record histogram value (for timing, sizes, etc.)
   */
  recordHistogram(name: string, value: number, labels: MetricLabels = {}) {
    this.recordMetric({
      name,
      value,
      labels,
      timestamp: new Date(),
      type: 'histogram',
    });

    logger.debug({ name, labels, value }, 'Histogram recorded');
  }

  /**
   * Get current counter value
   */
  getCounter(name: string, labels: MetricLabels = {}): number {
    const key = this.getMetricKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get current gauge value
   */
  getGauge(name: string, labels: MetricLabels = {}): number {
    const key = this.getMetricKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  /**
   * Get all metrics for a given name
   */
  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }

    // Return all metrics
    const allMetrics: Metric[] = [];
    this.metrics.forEach((metrics) => {
      allMetrics.push(...metrics);
    });
    return allMetrics;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    return {
      totalMetrics: this.metrics.size,
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
    };
  }

  private recordMetric(metric: Metric) {
    const existing = this.metrics.get(metric.name) || [];
    existing.push(metric);

    // Keep only last 1000 metrics per name
    if (existing.length > 1000) {
      existing.shift();
    }

    this.metrics.set(metric.name, existing);
  }

  private getMetricKey(name: string, labels: MetricLabels): string {
    const labelPairs = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');

    return labelPairs ? `${name}{${labelPairs}}` : name;
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

// Helper functions for common metrics
export const metricsHelpers = {
  /**
   * Track reminder sent
   */
  reminderSent(channel: string, templateKey: string) {
    metrics.incrementCounter('reminders_sent_total', { channel, templateKey });
  },

  /**
   * Track reminder failed
   */
  reminderFailed(channel: string, templateKey: string, reason: string) {
    metrics.incrementCounter('reminders_failed_total', { channel, templateKey, reason });
  },

  /**
   * Track API request
   */
  apiRequest(method: string, path: string, statusCode: number) {
    metrics.incrementCounter('api_requests_total', {
      method,
      path,
      status: statusCode,
    });
  },

  /**
   * Track API response time
   */
  apiResponseTime(method: string, path: string, durationMs: number) {
    metrics.recordHistogram('api_response_time_ms', durationMs, { method, path });
  },

  /**
   * Set active reminders count
   */
  setActiveReminders(count: number) {
    metrics.setGauge('active_reminders', count);
  },

  /**
   * Set templates count
   */
  setTemplatesCount(count: number) {
    metrics.setGauge('templates_total', count);
  },

  /**
   * Set members count
   */
  setMembersCount(count: number) {
    metrics.setGauge('members_total', count);
  },
};
