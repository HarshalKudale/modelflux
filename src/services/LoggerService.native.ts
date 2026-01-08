// Logger Service - Native implementation
// Uses expo-file-system File/Directory API for storage and expo-sharing for export

import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { ILoggerService, LogEntry, LogLevel } from './LoggerService';

const LOG_DIR_NAME = 'logs';
const MAX_ENTRIES_PER_FILE = 10000;

// Inline utility functions to avoid require cycle with LoggerService.ts
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

class NativeLoggerService implements ILoggerService {
    private writeQueue: Promise<void> = Promise.resolve();
    private logDir: Directory | null = null;

    private getLogDir(): Directory {
        if (!this.logDir) {
            this.logDir = new Directory(Paths.document, LOG_DIR_NAME);
            if (!this.logDir.exists) {
                this.logDir.create();
            }
        }
        return this.logDir;
    }

    private getLogFile(date?: string): File {
        const dateStr = date || getLogDateString();
        return new File(this.getLogDir(), `${dateStr}.log`);
    }

    private writeLog(level: LogLevel, tag: string, ...args: unknown[]): void {
        const entry: LogEntry = {
            timestamp: getTimestamp(),
            level,
            tag,
            message: formatLogMessage(...args),
        };

        // Console output in dev mode
        if (__DEV__) {
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

        // Queue file writes to prevent race conditions
        this.writeQueue = this.writeQueue.then(async () => {
            try {
                const file = this.getLogFile();
                const line = JSON.stringify(entry) + '\n';

                if (file.exists) {
                    // Read existing content, trim if needed, append new entry
                    const existing = await file.text();
                    const lines = existing.split('\n').filter(Boolean);

                    // Trim if too many entries
                    if (lines.length >= MAX_ENTRIES_PER_FILE) {
                        lines.splice(0, lines.length - MAX_ENTRIES_PER_FILE + 1);
                    }
                    lines.push(JSON.stringify(entry));
                    file.write(lines.join('\n') + '\n');
                } else {
                    file.create();
                    file.write(line);
                }
            } catch (e) {
                // Log file write errors in dev mode
                if (__DEV__) {
                    console.error('[Logger] File write failed:', e);
                }
            }
        });
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
        try {
            const dates = await this.getLogDates();
            const allEntries: LogEntry[] = [];

            for (const date of dates) {
                try {
                    const file = this.getLogFile(date);
                    if (file.exists) {
                        const content = await file.text();
                        const lines = content.split('\n').filter(Boolean);

                        for (const line of lines) {
                            try {
                                const entry = JSON.parse(line) as LogEntry;
                                allEntries.push(entry);
                            } catch {
                                // Skip malformed entries
                            }
                        }
                    }
                } catch {
                    // Skip files that can't be read
                }
            }

            // Sort by timestamp descending (newest first)
            return allEntries.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
        } catch {
            return [];
        }
    }

    async getLogDates(): Promise<string[]> {
        try {
            const dir = this.getLogDir();
            // list() returns array of File/Directory objects
            const items = dir.list();
            return items
                .filter((item): item is File => item instanceof File && item.name.endsWith('.log'))
                .map((file) => file.name.replace('.log', ''))
                .sort()
                .reverse();
        } catch (e) {
            if (__DEV__) {
                console.error('[Logger] getLogDates failed:', e);
            }
            return [];
        }
    }

    async exportLogs(): Promise<void> {
        try {
            const dates = await this.getLogDates();

            if (dates.length === 0) {
                throw new Error('No logs to export');
            }

            // Create a combined log file for export
            const exportFile = new File(Paths.cache, `modelflux-logs-${getLogDateString()}.txt`);
            if (exportFile.exists) {
                exportFile.delete();
            }
            exportFile.create();

            let combinedContent = `ModelFlux Logs Export\nExported: ${new Date().toISOString()}\n${'='.repeat(50)}\n\n`;

            for (const date of dates) {
                try {
                    const file = this.getLogFile(date);
                    if (file.exists) {
                        const content = await file.text();
                        const lines = content.split('\n').filter(Boolean);

                        combinedContent += `\n--- ${date} ---\n`;
                        for (const line of lines) {
                            try {
                                const entry = JSON.parse(line) as LogEntry;
                                combinedContent += `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.tag}] ${entry.message}\n`;
                            } catch {
                                combinedContent += line + '\n';
                            }
                        }
                    }
                } catch {
                    // Skip files that can't be read
                }
            }

            exportFile.write(combinedContent);

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(exportFile.uri, {
                    mimeType: 'text/plain',
                    dialogTitle: 'Export ModelFlux Logs',
                });
            }
        } catch (err) {
            if (__DEV__) {
                console.error('[Logger] Export failed:', err);
            }
            throw err;
        }
    }

    async clearLogs(): Promise<void> {
        try {
            const dates = await this.getLogDates();
            for (const date of dates) {
                try {
                    const file = this.getLogFile(date);
                    if (file.exists) {
                        file.delete();
                    }
                } catch {
                    // Skip files that can't be deleted
                }
            }
        } catch {
            // Silent fail
        }
    }
}

// Export singleton instance
export const logger = new NativeLoggerService();
