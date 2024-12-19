import type { Device } from '../types';

export class MockInstrument {
  private static instance: MockInstrument;
  private constructor() {}

  static getInstance(): MockInstrument {
    if (!MockInstrument.instance) {
      MockInstrument.instance = new MockInstrument();
    }
    return MockInstrument.instance;
  }

  async searchDevices(): Promise<Device[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      {
        id: 'scope1',
        name: 'Keysight DSOX1102G',
        model: 'DSOX1102G',
        address: '192.168.1.100',
        type: 'SCOPE',
        isConnected: false
      },
      {
        id: 'dmm1',
        name: 'Keysight 34461A',
        model: '34461A',
        address: '192.168.1.101',
        type: 'DMM',
        isConnected: false
      }
    ];
  }

  async sendCommand(command: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 100));

    switch (command.toLowerCase()) {
      case '*idn?':
        return 'MOCK,INSTRUMENT,001,1.0.0';
      case 'meas:volt?':
        return (Math.random() * 10).toFixed(3) + 'V';
      case 'meas:curr?':
        return (Math.random() * 1).toFixed(3) + 'A';
      default:
        return 'OK';
    }
  }
}