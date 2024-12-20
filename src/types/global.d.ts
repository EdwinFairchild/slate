export {};

declare global {
  interface Window {
    api: {
      searchDevices: (subnet: string) => Promise<any>;
      saveSelectedDevice: (device: Device) => void;
    };
  }
}
interface Device {
  id: string;
  name: string;
  address: string;
  isConnected: boolean;
}