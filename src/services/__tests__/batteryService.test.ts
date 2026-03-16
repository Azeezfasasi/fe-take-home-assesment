import { describe, it, expect } from 'vitest';
import type { BatteryReading } from '@/services/batteryService';
import { analyzeBatteryHealth, getDeviceMetrics } from '@/services/batteryService';

describe('Battery Service - Core Calculations', () => {
  /**
   * Test Case 1: Simple 12-hour discharge
   * 
   * Scenario:
   * - Device has 2 readings
   * - Reading 1: 100% at 9:00 AM
   * - Reading 2: 90% at 9:00 PM (12 hours later)
   * - Battery drop: 10 percentage points
   * - Time span: 12 hours
   * 
   * Expected calculation:
   * - Daily usage = (10% / 12 hours) * 24 hours = 20%
   * - Status: Healthy (< 30%)
   */
  it('should correctly calculate 20% daily usage for 10% drop over 12 hours', () => {
    const readings: BatteryReading[] = [
      {
        academyId: 1,
        batteryLevel: 1.0, // 100%
        employeeId: 'E001',
        serialNumber: 'SN001',
        timestamp: '2019-05-17T09:00:00Z',
      },
      {
        academyId: 1,
        batteryLevel: 0.9, // 90%
        employeeId: 'E001',
        serialNumber: 'SN001',
        timestamp: '2019-05-17T21:00:00Z', // 12 hours later
      },
    ];

    const schools = analyzeBatteryHealth(readings);
    expect(schools).toHaveLength(1);

    const device = schools[0].deviceDetails[0];
    expect(device.dailyUsagePercentage).toBeCloseTo(20, 0);
    expect(device.status).toBe('healthy');
  });

  /**
   * Test Case 2: Three readings with non-uniform intervals
   * 
   * Scenario:
   * - Reading 1: 100% on Day 1 at 9:00 AM
   * - Reading 2: 90% on Day 1 at 9:00 PM (12 hours = 0.5 day)
   * - Reading 3: 80% on Day 2 at 9:00 PM (36 hours total from start)
   * - Total drop: 20%, Total time: 36 hours
   * 
   * Expected calculation:
   * - Daily usage = (20% / 36 hours) * 24 hours = 13.3%
   * - Status: Healthy
   */
  it('should correctly average across multiple intervals with varying durations', () => {
    const readings: BatteryReading[] = [
      {
        academyId: 1,
        batteryLevel: 1.0, // 100%
        employeeId: 'E001',
        serialNumber: 'SN002',
        timestamp: '2019-05-17T09:00:00Z',
      },
      {
        academyId: 1,
        batteryLevel: 0.9, // 90%
        employeeId: 'E001',
        serialNumber: 'SN002',
        timestamp: '2019-05-17T21:00:00Z', // 12 hours later
      },
      {
        academyId: 1,
        batteryLevel: 0.8, // 80%
        employeeId: 'E001',
        serialNumber: 'SN002',
        timestamp: '2019-05-18T21:00:00Z', // 24 hours later (36 total)
      },
    ];

    const schools = analyzeBatteryHealth(readings);
    const device = schools[0].deviceDetails[0];

    // (20% drop / 36 hours) * 24 = 13.33%
    expect(device.dailyUsagePercentage).toBeCloseTo(13.3, 1);
    expect(device.status).toBe('healthy');
  });

  /**
   * Test Case 3: Charging event is excluded
   * 
   * Scenario:
   * - Reading 1: 80% at time T1
   * - Reading 2: 100% at time T2 (device was charged - should be ignored)
   * - Reading 3: 90% at time T3
   * 
   * Expected:
   * - Only count T1->T3 if it represents a discharge
   * - The charging interval T1->T2 should not affect calculation
   */
  it('should exclude charging intervals from calculation', () => {
    const readings: BatteryReading[] = [
      {
        academyId: 1,
        batteryLevel: 0.8, // 80%
        employeeId: 'E001',
        serialNumber: 'SN003',
        timestamp: '2019-05-17T09:00:00Z',
      },
      {
        academyId: 1,
        batteryLevel: 1.0, // 100% - CHARGING EVENT (excluded)
        employeeId: 'E001',
        serialNumber: 'SN003',
        timestamp: '2019-05-17T15:00:00Z', // 6 hours later
      },
      {
        academyId: 1,
        batteryLevel: 0.9, // 90%
        employeeId: 'E001',
        serialNumber: 'SN003',
        timestamp: '2019-05-17T21:00:00Z', // 6 hours later (12 hours from first reading)
      },
    ];

    const schools = analyzeBatteryHealth(readings);
    const device = schools[0].deviceDetails[0];

    // Only interval 1->3: (80-90)% = 10% drop over 12 hours = (10/12)*24 = 20%
    // The charging interval (1->2) should not be counted
    expect(device.dailyUsagePercentage).toBeCloseTo(20, 0);
    expect(device.status).toBe('healthy');
  });

  /**
   * Test Case 4: Device with single reading returns "unknown"
   * 
   * Scenario:
   * - Only one data point exists
   * 
   * Expected:
   * - Daily usage should be null
   * - Status should be "unknown"
   */
  it('should return unknown status for device with single reading', () => {
    const readings: BatteryReading[] = [
      {
        academyId: 1,
        batteryLevel: 0.75, // 75%
        employeeId: 'E001',
        serialNumber: 'SN004',
        timestamp: '2019-05-17T09:00:00Z',
      },
    ];

    const schools = analyzeBatteryHealth(readings);
    const device = schools[0].deviceDetails[0];

    expect(device.dailyUsagePercentage).toBeNull();
    expect(device.status).toBe('unknown');
  });

  /**
   * Test Case 5: Unhealthy device (>30% daily usage)
   * 
   * Scenario:
   * - Battery drops 32% over 24 hours
   * - Daily usage = 32%
   * 
   * Expected:
   * - Status should be "unhealthy"
   */
  it('should mark device as unhealthy when daily usage exceeds 30%', () => {
    const readings: BatteryReading[] = [
      {
        academyId: 1,
        batteryLevel: 1.0, // 100%
        employeeId: 'E001',
        serialNumber: 'SN005',
        timestamp: '2019-05-17T12:00:00Z',
      },
      {
        academyId: 1,
        batteryLevel: 0.68, // 68%
        employeeId: 'E001',
        serialNumber: 'SN005',
        timestamp: '2019-05-18T12:00:00Z', // 24 hours later
      },
    ];

    const schools = analyzeBatteryHealth(readings);
    const device = schools[0].deviceDetails[0];

    // 32% drop over 24 hours = 32% daily usage
    expect(device.dailyUsagePercentage).toBeCloseTo(32, 0);
    expect(device.status).toBe('unhealthy');
  });

  /**
   * Test Case 6: Multiple devices in one school
   * 
   * Scenario:
   * - 3 devices in the same school (academyId)
   * - Device 1: Unhealthy
   * - Device 2: Healthy
   * - Device 3: Unknown
   * 
   * Expected:
   * - School report shows correct counts
   */
  it('should correctly aggregate multiple devices in one school', () => {
    const readings: BatteryReading[] = [
      // Device 1: Unhealthy (31% daily usage)
      {
        academyId: 100,
        batteryLevel: 1.0,
        employeeId: 'E001',
        serialNumber: 'DEVICE_001',
        timestamp: '2019-05-17T12:00:00Z',
      },
      {
        academyId: 100,
        batteryLevel: 0.69,
        employeeId: 'E001',
        serialNumber: 'DEVICE_001',
        timestamp: '2019-05-18T12:00:00Z',
      },
      // Device 2: Healthy (15% daily usage)
      {
        academyId: 100,
        batteryLevel: 1.0,
        employeeId: 'E002',
        serialNumber: 'DEVICE_002',
        timestamp: '2019-05-17T12:00:00Z',
      },
      {
        academyId: 100,
        batteryLevel: 0.85,
        employeeId: 'E002',
        serialNumber: 'DEVICE_002',
        timestamp: '2019-05-18T12:00:00Z',
      },
      // Device 3: Unknown (single reading)
      {
        academyId: 100,
        batteryLevel: 0.5,
        employeeId: 'E003',
        serialNumber: 'DEVICE_003',
        timestamp: '2019-05-17T12:00:00Z',
      },
    ];

    const schools = analyzeBatteryHealth(readings);
    expect(schools).toHaveLength(1);

    const school = schools[0];
    expect(school.totalDevices).toBe(3);
    expect(school.unhealthyDevices).toBe(1);
    expect(school.deviceDetails.filter((d) => d.status === 'unknown')).toHaveLength(1);
    expect(school.deviceDetails.filter((d) => d.status === 'healthy')).toHaveLength(1);
  });

  /**
   * Test Case 7: Multiple schools are correctly ranked by unhealthy count
   * 
   * Scenario:
   * - School A: 5 unhealthy devices
   * - School B: 2 unhealthy devices
   * - School C: 0 unhealthy devices
   * 
   * Expected:
   * - Schools sorted in descending order: A, B, C
   */
  it('should rank schools by number of unhealthy devices', () => {
    const readings: BatteryReading[] = [
      // School A: 5 unhealthy
      ...Array.from({ length: 5 }).map((_, i) => ({
        academyId: 10,
        batteryLevel: 1.0,
        employeeId: `E${i}`,
        serialNumber: `SCHOOL_A_DEV_${i}`,
        timestamp: '2019-05-17T12:00:00Z',
      })),
      ...Array.from({ length: 5 }).map((_, i) => ({
        academyId: 10,
        batteryLevel: 0.69,
        employeeId: `E${i}`,
        serialNumber: `SCHOOL_A_DEV_${i}`,
        timestamp: '2019-05-18T12:00:00Z',
      })),
      // School B: 2 unhealthy
      ...Array.from({ length: 2 }).map((_, i) => ({
        academyId: 20,
        batteryLevel: 1.0,
        employeeId: `E${i + 100}`,
        serialNumber: `SCHOOL_B_DEV_${i}`,
        timestamp: '2019-05-17T12:00:00Z',
      })),
      ...Array.from({ length: 2 }).map((_, i) => ({
        academyId: 20,
        batteryLevel: 0.69,
        employeeId: `E${i + 100}`,
        serialNumber: `SCHOOL_B_DEV_${i}`,
        timestamp: '2019-05-18T12:00:00Z',
      })),
      // School C: 0 unhealthy
      {
        academyId: 30,
        batteryLevel: 1.0,
        employeeId: 'E200',
        serialNumber: 'SCHOOL_C_DEV',
        timestamp: '2019-05-17T12:00:00Z',
      },
      {
        academyId: 30,
        batteryLevel: 0.9,
        employeeId: 'E200',
        serialNumber: 'SCHOOL_C_DEV',
        timestamp: '2019-05-18T12:00:00Z',
      },
    ] as BatteryReading[];

    const schools = analyzeBatteryHealth(readings);

    expect(schools[0].academyId).toBe(10); // School A first
    expect(schools[0].unhealthyDevices).toBe(5);
    expect(schools[1].academyId).toBe(20); // School B second
    expect(schools[1].unhealthyDevices).toBe(2);
    expect(schools[2].academyId).toBe(30); // School C last
    expect(schools[2].unhealthyDevices).toBe(0);
  });

  /**
   * Test Case 8: Different users on same device
   * 
   * Scenario:
   * - Same device (serialNumber) used by two different employees
   * - All readings should be considered together
   * 
   * Expected:
   * - Device metrics calculated across all readings regardless of user
   */
  it('should calculate health across all users of same device', () => {
    const readings: BatteryReading[] = [
      {
        academyId: 1,
        batteryLevel: 1.0,
        employeeId: 'TEACHER_A',
        serialNumber: 'SHARED_DEVICE',
        timestamp: '2019-05-17T08:00:00Z',
      },
      {
        academyId: 1,
        batteryLevel: 0.9,
        employeeId: 'TEACHER_B', // Different user
        serialNumber: 'SHARED_DEVICE',
        timestamp: '2019-05-17T20:00:00Z',
      },
      {
        academyId: 1,
        batteryLevel: 0.8,
        employeeId: 'TEACHER_A',
        serialNumber: 'SHARED_DEVICE',
        timestamp: '2019-05-18T08:00:00Z',
      },
    ];

    const schools = analyzeBatteryHealth(readings);
    const device = schools[0].deviceDetails[0];

    // Total drop: 20% over 24 hours = 20% daily
    expect(device.dailyUsagePercentage).toBeCloseTo(20, 0);
    expect(device.status).toBe('healthy');
  });
});
