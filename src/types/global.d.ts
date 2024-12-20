export {};

declare global {
  interface Window {
    api: {
      searchDevices: (subnet: string) => Promise<any>;
    };
  }
}
