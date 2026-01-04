/**
 * Storage Adapter - Native Implementation
 * Uses AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

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
            const item = await AsyncStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Storage get error for key ${key}:`, error);
            return null;
        }
    }

    async set<T>(key: string, value: T): Promise<void> {
        try {
            const stringValue = JSON.stringify(value);
            await AsyncStorage.setItem(key, stringValue);
        } catch (error) {
            console.error(`Storage set error for key ${key}:`, error);
            throw error;
        }
    }

    async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error(`Storage remove error for key ${key}:`, error);
            throw error;
        }
    }

    async getKeys(prefix: string): Promise<string[]> {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            return allKeys.filter((key) => key.startsWith(prefix));
        } catch (error) {
            console.error(`Storage getKeys error for prefix ${prefix}:`, error);
            return [];
        }
    }

    async clear(): Promise<void> {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('Storage clear error:', error);
            throw error;
        }
    }
}

export const storageAdapter = new StorageAdapter();
