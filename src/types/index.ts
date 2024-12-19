export interface SCPICommand {
  id: string;
  command: string;
  interval: number;
  isRunning: boolean;
}

export interface LogMessage {
  id: string;
  type: 'info' | 'error';
  message: string;
  timestamp: string;
}

export interface Device {
  id: string;
  name: string;
  model: string;
  address: string;
  type: 'SCOPE' | 'DMM' | 'POWER' | 'OTHER';
  isConnected: boolean;
}

export type Theme = 'light' | 'dark';

export type Page = 'tests' | 'temp';