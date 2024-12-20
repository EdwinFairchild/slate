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
    if (!window.api || !window.api.searchDevices) {
      throw new Error('Electron API is not available. Check preload.js and BrowserWindow configuration.');
    }

    console.log('Calling searchDevices on window.api');
    const subnet = '10.0.0'; // Replace with your subnet
    try {
      const devices = await window.api.searchDevices(subnet);
      return devices.map((device: any) => ({
        id: device.id,
        name: device.name,
        model: device.type,
        address: device.address,
        type: device.type,
        isConnected: device.isConnected,
      }));
    } catch (error) {
      console.error('Error searching devices:', error);
      return [];
    }
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
