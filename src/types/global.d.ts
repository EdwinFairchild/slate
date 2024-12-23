export {};

declare global {
  interface Window {
    api: {
      searchDevices: (subnet: string) => Promise<any>;
      saveSelectedDevice: (device: Device) => void;
      startTest: (testData: Omit<Test, 'id' | 'isExpanded'>) => Promise<any>;
      readCSV: (filePath: string) => Promise<{ headers: string[]; data: Record<string, string>[] }>;
      writeCSV: (params: { filePath: string; headers: string[]; data: Record<string, string>[] }) => Promise<boolean>;
      openDirectory: () => Promise<{ path: string; files: string[] } | null>;
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
  runOnce: boolean;
  waitAfter: number;
}

interface Test {
  id: string;
  name: string;
  duration: number;
  interval: number;
  chainCommands: boolean;
  commands: Command[];
  isExpanded: boolean;
}