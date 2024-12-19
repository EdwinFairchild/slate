type LogType = 'info' | 'error';

export interface LogMessage {
  id: string;
  type: LogType;
  message: string;
  timestamp: string;
}

export class Logger {
  private static instance: Logger;
  private logCallback: (type: LogType, message: string) => void;

  private constructor() {
    this.logCallback = () => {};
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogCallback(callback: (type: LogType, message: string) => void) {
    this.logCallback = callback;
  }

  info(message: string) {
    this.logCallback('info', message);
  }

  error(message: string) {
    this.logCallback('error', message);
  }

  setupConsoleOverrides() {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      this.info(args.join(' '));
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      this.error(args.join(' '));
      originalError.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }
}