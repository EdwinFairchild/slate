export {};

declare global {
  interface Window {
    api: {
      searchDevices: (subnet: string) => Promise<any>;
      saveSelectedDevice: (device: Device) => void;
      startTest: (testData: Omit<Test, 'id' | 'isExpanded'>) => Promise<any>;
    };
  }
}
interface Device {
  id: string;
  name: string;
  address: string;
  isConnected: boolean;
}
interface Command {
  command: string;
  interval: number;
  waitAfter: number;
}

interface Test {
  id: string;
  name: string;
  duration: number;
  chainCommands: boolean;
  commands: Command[];
  isExpanded: boolean;
}