/**
 * Storage Adapter - Web Implementation
 * Uses browser's localStorage
 */

export interface IStorageAdapter {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    getKeys(prefix: string): Promise<string[]>;
    clear(): Promise<void>;
}

class StorageAdapter implements IStorageAdapter {
    async get<T>(key: string): Promise<T | null> {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Storage get error for key ${key}:`, error);
            return null;
        }
    }

    async set<T>(key: string, value: T): Promise<void> {
        try {
            const stringValue = JSON.stringify(value);
            localStorage.setItem(key, stringValue);
        } catch (error) {
            console.error(`Storage set error for key ${key}:`, error);
            throw error;
        }
    }

    async remove(key: string): Promise<void> {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Storage remove error for key ${key}:`, error);
            throw error;
        }
    }

    async getKeys(prefix: string): Promise<string[]> {
        try {
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keys.push(key);
                }
            }
            return keys;
        } catch (error) {
            console.error(`Storage getKeys error for prefix ${prefix}:`, error);
            return [];
        }
    }

    async clear(): Promise<void> {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Storage clear error:', error);
            throw error;
        }
    }
}

export const storageAdapter = new StorageAdapter();
