import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Platform-agnostic storage adapter
 * Uses AsyncStorage for React Native and localStorage for web
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
            if (Platform.OS === 'web') {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            }
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
            if (Platform.OS === 'web') {
                localStorage.setItem(key, stringValue);
            } else {
                await AsyncStorage.setItem(key, stringValue);
            }
        } catch (error) {
            console.error(`Storage set error for key ${key}:`, error);
            throw error;
        }
    }

    async remove(key: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(key);
            } else {
                await AsyncStorage.removeItem(key);
            }
        } catch (error) {
            console.error(`Storage remove error for key ${key}:`, error);
            throw error;
        }
    }

    async getKeys(prefix: string): Promise<string[]> {
        try {
            if (Platform.OS === 'web') {
                const keys: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(prefix)) {
                        keys.push(key);
                    }
                }
                return keys;
            }
            const allKeys = await AsyncStorage.getAllKeys();
            return allKeys.filter((key) => key.startsWith(prefix));
        } catch (error) {
            console.error(`Storage getKeys error for prefix ${prefix}:`, error);
            return [];
        }
    }

    async clear(): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.clear();
            } else {
                await AsyncStorage.clear();
            }
        } catch (error) {
            console.error('Storage clear error:', error);
            throw error;
        }
    }
}

// Singleton instance
export const storageAdapter = new StorageAdapter();
