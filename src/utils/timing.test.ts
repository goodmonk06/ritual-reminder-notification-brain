import {
  parseTimingOffset,
  calculateReminderTime,
  isInQuietHours,
  adjustForQuietHours,
} from './timing';
import { QuietHours } from '../types';

describe('Timing Utilities', () => {
  describe('parseTimingOffset', () => {
    it('should parse minutes correctly', () => {
      expect(parseTimingOffset('-30m')).toBe(-30 * 60 * 1000);
      expect(parseTimingOffset('15m')).toBe(15 * 60 * 1000);
    });

    it('should parse hours correctly', () => {
      expect(parseTimingOffset('-1h')).toBe(-1 * 60 * 60 * 1000);
      expect(parseTimingOffset('-24h')).toBe(-24 * 60 * 60 * 1000);
    });

    it('should parse days correctly', () => {
      expect(parseTimingOffset('-1d')).toBe(-1 * 24 * 60 * 60 * 1000);
      expect(parseTimingOffset('-7d')).toBe(-7 * 24 * 60 * 60 * 1000);
    });

    it('should throw error for invalid format', () => {
      expect(() => parseTimingOffset('invalid')).toThrow();
      expect(() => parseTimingOffset('1x')).toThrow();
    });
  });

  describe('calculateReminderTime', () => {
    it('should calculate reminder time correctly', () => {
      const ritualTime = new Date('2024-01-15T10:00:00Z');

      const reminder1h = calculateReminderTime(ritualTime, '-1h');
      expect(reminder1h.toISOString()).toBe('2024-01-15T09:00:00.000Z');

      const reminder24h = calculateReminderTime(ritualTime, '-24h');
      expect(reminder24h.toISOString()).toBe('2024-01-14T10:00:00.000Z');

      const reminder30m = calculateReminderTime(ritualTime, '-30m');
      expect(reminder30m.toISOString()).toBe('2024-01-15T09:30:00.000Z');
    });
  });

  describe('isInQuietHours', () => {
    const quietHours: QuietHours = {
      start: '22:00',
      end: '08:00',
      timezone: 'UTC',
    };

    it('should detect time in quiet hours', () => {
      const nightTime = new Date('2024-01-15T23:00:00Z');
      expect(isInQuietHours(nightTime, quietHours)).toBe(true);

      const earlyMorning = new Date('2024-01-15T07:00:00Z');
      expect(isInQuietHours(earlyMorning, quietHours)).toBe(true);
    });

    it('should detect time outside quiet hours', () => {
      const afternoon = new Date('2024-01-15T14:00:00Z');
      expect(isInQuietHours(afternoon, quietHours)).toBe(false);

      const morning = new Date('2024-01-15T09:00:00Z');
      expect(isInQuietHours(morning, quietHours)).toBe(false);
    });
  });

  describe('adjustForQuietHours', () => {
    const quietHours: QuietHours = {
      start: '22:00',
      end: '08:00',
      timezone: 'UTC',
    };

    it('should not adjust time outside quiet hours', () => {
      const afternoon = new Date('2024-01-15T14:00:00Z');
      const adjusted = adjustForQuietHours(afternoon, quietHours);
      expect(adjusted).toEqual(afternoon);
    });

    it('should adjust time in quiet hours to end of quiet hours', () => {
      const nightTime = new Date('2024-01-15T23:00:00Z');
      const adjusted = adjustForQuietHours(nightTime, quietHours);

      // Should be moved to 08:00 the next day
      const adjustedHours = adjusted.getUTCHours();
      expect(adjustedHours).toBe(8);
    });
  });
});
