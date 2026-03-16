/**
 * Battery Health Service
 * 
 * Handles the core logic for calculating battery consumption rates and determining
 * which devices need battery replacement based on daily usage metrics.
 * 
 * Key Concepts:
 * - A battery is unhealthy if it consumes >30% per day on average
 * - Calculation is based on intervals between recorded data points
 * - Charging intervals (battery level increases) are excluded
 * - Weighting mechanism: intervals are weighted by duration
 * - Single data point devices have "unknown" status
 */

import batteryData from '@/data/battery.json';

export interface BatteryReading {
  academyId: number;
  batteryLevel: number;
  employeeId: string;
  serialNumber: string;
  timestamp: string;
}

export interface DeviceHealthMetrics {
  serialNumber: string;
  dailyUsagePercentage: number | null;
  status: 'healthy' | 'unhealthy' | 'unknown';
  readingCount: number;
  timeSpanHours: number;
}

export interface SchoolBatteryData {
  academyId: number;
  totalDevices: number;
  unhealthyDevices: number;
  unknownDevices: number;
  percentUnhealthy: number;
  deviceDetails: DeviceHealthMetrics[];
}

/**
 * Groups battery readings by device (serialNumber)
 */
function groupByDevice(readings: BatteryReading[]): Map<string, BatteryReading[]> {
  const grouped = new Map<string, BatteryReading[]>();
  
  for (const reading of readings) {
    if (!grouped.has(reading.serialNumber)) {
      grouped.set(reading.serialNumber, []);
    }
    grouped.get(reading.serialNumber)!.push(reading);
  }
  
  // Sort readings by timestamp for each device
  for (const readings of grouped.values()) {
    readings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  
  return grouped;
}

/**
 * Calculates the daily battery usage percentage by:
 * 1. Finding all discharge intervals (excluding charging periods)
 * 2. Computing the total battery drop and total time
 * 3. Using duration-weighted averaging to normalize to 24 hours
 * 
 * Example:
 * - Reading 1: 100% at 9 AM
 * - Reading 2: 90% at 9 PM (12 hours later)
 * - Drop: 10%, Time: 12 hours
 * - Daily Usage: (10 / 12) * 24 = 20%
 * 
 * @param readings - Sorted array of battery readings for a single device
 * @returns Daily usage percentage or null if insufficient data
 */
function calculateDailyUsage(readings: BatteryReading[]): number | null {
  // If only one reading, we cannot calculate usage
  if (readings.length < 2) {
    return null;
  }

  let totalBatteryDrop = 0; // in percentage points
  let totalTimeHours = 0;

  // Calculate intervals between consecutive readings
  for (let i = 0; i < readings.length - 1; i++) {
    const current = readings[i];
    const next = readings[i + 1];

    const currentLevel = current.batteryLevel;
    const nextLevel = next.batteryLevel;

    // Calculate time difference in hours (count all intervals)
    const currentTime = new Date(current.timestamp).getTime();
    const nextTime = new Date(next.timestamp).getTime();
    const timeHours = (nextTime - currentTime) / (1000 * 60 * 60);

    // Always add time to total (including charging intervals)
    totalTimeHours += timeHours;

    // Only count battery drop for discharge intervals (skip charging)
    if (nextLevel < currentLevel) {
      const batteryDrop = (currentLevel - nextLevel) * 100;
      totalBatteryDrop += batteryDrop;
    }
  }

  // If no valid discharge intervals (all charging), return null
  if (totalBatteryDrop === 0) {
    return null;
  }

  // If no time has passed, return null
  if (totalTimeHours === 0) {
    return null;
  }

  // Normalize to 24-hour daily average
  const dailyUsage = (totalBatteryDrop / totalTimeHours) * 24;
  return dailyUsage;
}

/**
 * Determines device health status based on daily usage
 */
function getHealthStatus(dailyUsage: number | null): 'healthy' | 'unhealthy' | 'unknown' {
  if (dailyUsage === null) {
    return 'unknown';
  }
  return dailyUsage > 30 ? 'unhealthy' : 'healthy';
}

/**
 * Calculates health metrics for a single device
 */
function calculateDeviceMetrics(serialNumber: string, readings: BatteryReading[]): DeviceHealthMetrics {
  const dailyUsage = calculateDailyUsage(readings);
  const status = getHealthStatus(dailyUsage);
  
  // Calculate time span in hours
  let timeSpanHours = 0;
  if (readings.length >= 2) {
    const firstTime = new Date(readings[0].timestamp).getTime();
    const lastTime = new Date(readings[readings.length - 1].timestamp).getTime();
    timeSpanHours = (lastTime - firstTime) / (1000 * 60 * 60);
  }

  return {
    serialNumber,
    dailyUsagePercentage: dailyUsage ? Math.round(dailyUsage * 10) / 10 : null,
    status,
    readingCount: readings.length,
    timeSpanHours: Math.round(timeSpanHours * 10) / 10,
  };
}

/**
 * Main function: Processes all battery data and returns analysis by school
 */
export function analyzeBatteryHealth(readings?: BatteryReading[]): SchoolBatteryData[] {
  const data = readings || (batteryData as BatteryReading[]);
  
  // Group readings by device
  const deviceReadingsBySerial = groupByDevice(data);

  // Calculate metrics for each device and group by school
  const schoolDataMap = new Map<number, { devices: DeviceHealthMetrics[]; totalDevices: number; unhealthy: number; unknown: number }>();

  for (const [serialNumber, readings] of deviceReadingsBySerial.entries()) {
    const metrics = calculateDeviceMetrics(serialNumber, readings);
    
    // Group by academyId (school)
    const academyId = readings[0].academyId;
    if (!schoolDataMap.has(academyId)) {
      schoolDataMap.set(academyId, { devices: [], totalDevices: 0, unhealthy: 0, unknown: 0 });
    }

    const schoolData = schoolDataMap.get(academyId)!;
    schoolData.devices.push(metrics);
    schoolData.totalDevices += 1;
    if (metrics.status === 'unhealthy') {
      schoolData.unhealthy += 1;
    }
    if (metrics.status === 'unknown') {
      schoolData.unknown += 1;
    }
  }

  // Convert map to array and sort by unhealthy device count (descending)
  const result: SchoolBatteryData[] = Array.from(schoolDataMap.entries()).map(
    ([academyId, data]) => ({
      academyId,
      totalDevices: data.totalDevices,
      unhealthyDevices: data.unhealthy,
      unknownDevices: data.unknown,
      percentUnhealthy: Math.round((data.unhealthy / data.totalDevices) * 100),
      deviceDetails: data.devices.sort((a, b) => {
        // Sort by status priority: unhealthy first, then unknown, then healthy
        const statusOrder = { unhealthy: 0, unknown: 1, healthy: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }),
    })
  );

  // Sort schools by number of unhealthy devices (descending)
  return result.sort((a, b) => b.unhealthyDevices - a.unhealthyDevices);
}

/**
 * Utility: Get a specific device's health metrics
 */
export function getDeviceMetrics(serialNumber: string, readings?: BatteryReading[]): DeviceHealthMetrics | null {
  const data = readings || (batteryData as BatteryReading[]);
  const deviceReadings = groupByDevice(data);
  const readings_ = deviceReadings.get(serialNumber);
  
  if (!readings_) {
    return null;
  }

  return calculateDeviceMetrics(serialNumber, readings_);
}
