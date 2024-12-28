export interface TestResult {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  command: string;
  interval: number;
  measurements: Measurement[];
}

export interface Measurement {
  timestamp: string;
  value: number;
  unit: string;
}

export interface TestGraphData {
  timestamp: number;
  value: number;
}

export interface Command {
  command: string;
  runOnce: boolean;
  noTimeout: boolean;
  waitAfter: number;
}