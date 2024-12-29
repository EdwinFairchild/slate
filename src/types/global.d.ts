// global.d.ts
export { };

declare global {
  interface Window {
    api: {
      searchDevices: (subnet: string) => Promise<any>;
      saveSelectedDevice: (device: Device) => void;
      startTest: (testData: Omit<Test, 'id' | 'isExpanded'>) => Promise<any>;
      readCSV: (filePath: string) => Promise<{ headers: string[]; data: Record<string, string>[] }>;
      writeCSV: (params: { filePath: string; headers: string[]; data: Record<string, string>[] }) => Promise<boolean>;
      openDirectory: () => Promise<{ path: string; files: string[] } | null>;
      generateChart: (filePath: string) => Promise<any>;
      getTestDuration: (testId: string) => Promise<number>; // Added method
      getZoomLevel: () => number;
      setZoomLevel: (level: number) => void;
      // Optionally, add event listeners if needed
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeListener: (channel: string, callback: (...args: any[]) => void) => void;
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
  duration: number; // User-specified duration in minutes (e.g., 0.5 for 30 seconds)
  interval: number;
  chainCommands: boolean;
  commands: Command[];
  isExpanded: boolean;
  firstCol: "Timestamp" | "Index" | "Both"; // New property
}
