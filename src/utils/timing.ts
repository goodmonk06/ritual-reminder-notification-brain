import { QuietHours } from '../types';

/**
 * Parse timing offset string (e.g., "-24h", "-1h", "-30m") and return milliseconds
 */
export function parseTimingOffset(offset: string): number {
  const match = offset.match(/^(-?\d+)([mhd])$/);
  if (!match) {
    throw new Error(`Invalid timing offset format: ${offset}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const msPerUnit: Record<string, number> = {
    m: 60 * 1000, // minutes
    h: 60 * 60 * 1000, // hours
    d: 24 * 60 * 60 * 1000, // days
  };

  return value * msPerUnit[unit];
}

/**
 * Calculate reminder time based on ritual time and offset
 */
export function calculateReminderTime(ritualTime: Date, offset: string): Date {
  const offsetMs = parseTimingOffset(offset);
  return new Date(ritualTime.getTime() + offsetMs);
}

/**
 * Check if a given time falls within quiet hours
 */
export function isInQuietHours(time: Date, quietHours: QuietHours): boolean {
  try {
    // Convert the time to the member's timezone
    const timeInTz = new Date(
      time.toLocaleString('en-US', { timeZone: quietHours.timezone })
    );

    const hours = timeInTz.getHours();
    const minutes = timeInTz.getMinutes();
    const currentTime = hours * 60 + minutes; // minutes since midnight

    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle cases where quiet hours span midnight
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    return false; // Default to not quiet hours if there's an error
  }
}

/**
 * Adjust reminder time to avoid quiet hours
 * If the time falls in quiet hours, move it to the end of quiet hours
 */
export function adjustForQuietHours(time: Date, quietHours: QuietHours): Date {
  if (!isInQuietHours(time, quietHours)) {
    return time;
  }

  // Move to end of quiet hours
  const [endHour, endMin] = quietHours.end.split(':').map(Number);

  const adjustedTime = new Date(
    time.toLocaleString('en-US', { timeZone: quietHours.timezone })
  );
  adjustedTime.setHours(endHour, endMin, 0, 0);

  return adjustedTime;
}
