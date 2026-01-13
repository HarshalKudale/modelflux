// Logger Service - Web implementation
// Uses localStorage for storage and file download for export

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    tag: string;
    message: string;
}

export interface ILoggerService {
    log(tag: string, ...args: unknown[]): void;
    warn(tag: string, ...args: unknown[]): void;
    error(tag: string, ...args: unknown[]): void;
    debug(tag: string, ...args: unknown[]): void;
    getLogs(): Promise<LogEntry[]>;
    getLogDates(): Promise<string[]>;
    exportLogs(): Promise<void>;
    clearLogs(): Promise<void>;
}

// Inline utility functions to avoid circular import with LoggerService.ts
function formatLogMessage(...args: unknown[]): string {
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

function getLogDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTimestamp(): string {
    return new Date().toISOString();
}
const STORAGE_KEY_PREFIX = 'modelflux_logs_';
const MAX_ENTRIES_PER_DAY = 10000;
const MAX_DAYS_TO_KEEP = 7;

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
    try {
        const testKey = '__test__';
        if (typeof window === 'undefined' || !window.localStorage) {
            return false;
        }
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}

class WebLoggerService implements ILoggerService {
    private storageAvailable = isLocalStorageAvailable();

    private getStorageKey(date?: string): string {
        const dateStr = date || getLogDateString();
        return `${STORAGE_KEY_PREFIX}${dateStr}`;
    }

    private writeLog(level: LogLevel, tag: string, ...args: unknown[]): void {
        const entry: LogEntry = {
            timestamp: getTimestamp(),
            level,
            tag,
            message: formatLogMessage(...args),
        };

        // Console output in dev mode
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            const prefix = `[${entry.level.toUpperCase()}] [${tag}]`;
            switch (level) {
                case 'error':
                    console.error(prefix, ...args);
                    break;
                case 'warn':
                    console.warn(prefix, ...args);
                    break;
                case 'debug':
                    console.debug(prefix, ...args);
                    break;
                default:
                    console.log(prefix, ...args);
            }
        }

        // Skip storage if not available
        if (!this.storageAvailable) {
            return;
        }

        try {
            const key = this.getStorageKey();
            const existing = localStorage.getItem(key);
            let entries: LogEntry[] = [];

            if (existing) {
                try {
                    entries = JSON.parse(existing);
                } catch {
                    entries = [];
                }
            }

            entries.push(entry);

            // Trim if too many entries
            if (entries.length > MAX_ENTRIES_PER_DAY) {
                entries = entries.slice(-MAX_ENTRIES_PER_DAY);
            }

            localStorage.setItem(key, JSON.stringify(entries));

            // Cleanup old logs
            this.cleanupOldLogs();
        } catch {
            // Silent fail - localStorage might be full or unavailable
        }
    }

    private cleanupOldLogs(): void {
        if (!this.storageAvailable) return;
        try {
            const dates = this.getLogDatesSync();
            if (dates.length > MAX_DAYS_TO_KEEP) {
                const toDelete = dates.slice(MAX_DAYS_TO_KEEP);
                for (const date of toDelete) {
                    localStorage.removeItem(this.getStorageKey(date));
                }
            }
        } catch {
            // Silent fail
        }
    }

    private getLogDatesSync(): string[] {
        if (!this.storageAvailable) return [];
        const dates: string[] = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(STORAGE_KEY_PREFIX)) {
                    dates.push(key.replace(STORAGE_KEY_PREFIX, ''));
                }
            }
        } catch {
            // Silent fail
        }
        return dates.sort().reverse();
    }

    log(tag: string, ...args: unknown[]): void {
        this.writeLog('info', tag, ...args);
    }

    warn(tag: string, ...args: unknown[]): void {
        this.writeLog('warn', tag, ...args);
    }

    error(tag: string, ...args: unknown[]): void {
        this.writeLog('error', tag, ...args);
    }

    debug(tag: string, ...args: unknown[]): void {
        this.writeLog('debug', tag, ...args);
    }

    async getLogs(): Promise<LogEntry[]> {
        const allEntries: LogEntry[] = [];
        const dates = this.getLogDatesSync();

        for (const date of dates) {
            try {
                const content = localStorage.getItem(this.getStorageKey(date));
                if (content) {
                    const entries = JSON.parse(content) as LogEntry[];
                    allEntries.push(...entries);
                }
            } catch {
                // Skip malformed entries
            }
        }

        // Sort by timestamp descending (newest first)
        return allEntries.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }

    async getLogDates(): Promise<string[]> {
        return this.getLogDatesSync();
    }

    async exportLogs(): Promise<void> {
        const dates = this.getLogDatesSync();

        if (dates.length === 0) {
            throw new Error('No logs to export');
        }

        let content = `ModelFlux Logs Export\nExported: ${new Date().toISOString()}\n${'='.repeat(50)}\n\n`;

        for (const date of dates) {
            try {
                const stored = localStorage.getItem(this.getStorageKey(date));
                if (stored) {
                    const entries = JSON.parse(stored) as LogEntry[];
                    content += `\n--- ${date} ---\n`;
                    for (const entry of entries) {
                        content += `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.tag}] ${entry.message}\n`;
                    }
                }
            } catch {
                // Skip files that can't be read
            }
        }

        // Create and download the file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `modelflux-logs-${getLogDateString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async clearLogs(): Promise<void> {
        const dates = this.getLogDatesSync();
        for (const date of dates) {
            try {
                localStorage.removeItem(this.getStorageKey(date));
            } catch {
                // Silent fail
            }
        }
    }
}

// Export singleton instance
export const logger = new WebLoggerService();
