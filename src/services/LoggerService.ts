// Logger Service - Shared types and interface
// Platform-specific implementations in LoggerService.native.ts and LoggerService.web.ts

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    tag: string;
    message: string;
}

export interface ILoggerService {
    /** Log an info message */
    log(tag: string, ...args: unknown[]): void;
    /** Log a warning message */
    warn(tag: string, ...args: unknown[]): void;
    /** Log an error message */
    error(tag: string, ...args: unknown[]): void;
    /** Log a debug message (only shown in __DEV__ mode) */
    debug(tag: string, ...args: unknown[]): void;
    /** Get all log entries */
    getLogs(): Promise<LogEntry[]>;
    /** Get list of log file dates (YYYY-MM-DD format) */
    getLogDates(): Promise<string[]>;
    /** Export logs as a zip file (share on native, download on web) */
    exportLogs(): Promise<void>;
    /** Clear all logs */
    clearLogs(): Promise<void>;
}

/**
 * Format arguments into a single log message string
 */
export function formatLogMessage(...args: unknown[]): string {
    return args
        .map((arg) => {
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 0);
                } catch {
                    return String(arg);
                }
            }
            return String(arg);
        })
        .join(' ');
}

/**
 * Get current date in YYYY-MM-DD format for log file naming
 */
export function getLogDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get ISO timestamp for log entries
 */
export function getTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Placeholder logger export for TypeScript compatibility.
 * At runtime, Metro/Expo will resolve the correct platform-specific file
 * (LoggerService.native.ts or LoggerService.web.ts) which exports the real logger.
 * 
 * This placeholder should never be called - if you see this error, the bundler
 * is not correctly resolving platform-specific files.
 */
const placeholderLogger: ILoggerService = {
    log: () => { throw new Error('Logger not initialized - platform resolution failed'); },
    warn: () => { throw new Error('Logger not initialized - platform resolution failed'); },
    error: () => { throw new Error('Logger not initialized - platform resolution failed'); },
    debug: () => { throw new Error('Logger not initialized - platform resolution failed'); },
    getLogs: () => Promise.reject(new Error('Logger not initialized - platform resolution failed')),
    getLogDates: () => Promise.reject(new Error('Logger not initialized - platform resolution failed')),
    exportLogs: () => Promise.reject(new Error('Logger not initialized - platform resolution failed')),
    clearLogs: () => Promise.reject(new Error('Logger not initialized - platform resolution failed')),
};

export const logger: ILoggerService = placeholderLogger;
