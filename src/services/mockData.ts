import type { TestResult } from '../types/test';

export const mockTests: TestResult[] = [
  {
    id: '1',
    name: 'Power Supply Voltage Stability Test',
    status: 'completed',
    startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    endTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    command: 'MEAS:VOLT?',
    interval: 30000,
    measurements: Array.from({ length: 120 }, (_, i) => ({
      timestamp: new Date(Date.now() - 3600000 + i * 30000).toISOString(),
      value: 5 + Math.random() * 0.1 - 0.05,
      unit: 'V'
    }))
  },
  {
    id: '2',
    name: 'DMM Current Measurement',
    status: 'running',
    startTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    command: 'MEAS:CURR?',
    interval: 15000,
    measurements: Array.from({ length: 60 }, (_, i) => ({
      timestamp: new Date(Date.now() - 1800000 + i * 15000).toISOString(),
      value: 0.5 + Math.random() * 0.02 - 0.01,
      unit: 'A'
    }))
  },
  {
    id: '3',
    name: 'Oscilloscope Frequency Test',
    status: 'failed',
    startTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    endTime: new Date(Date.now() - 7000000).toISOString(),
    command: 'MEAS:FREQ?',
    interval: 60000,
    measurements: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - 7200000 + i * 60000).toISOString(),
      value: 1000 + Math.random() * 20 - 10,
      unit: 'Hz'
    }))
  }
];