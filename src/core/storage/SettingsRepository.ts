import { STORAGE_KEYS } from '../../config/constants';
import { AppSettings, DEFAULT_SETTINGS } from '../types';
import { storageAdapter } from './StorageAdapter';

export interface ISettingsRepository {
    get(): Promise<AppSettings>;
    update(settings: Partial<AppSettings>): Promise<AppSettings>;
    reset(): Promise<AppSettings>;
}

class SettingsRepository implements ISettingsRepository {
    async get(): Promise<AppSettings> {
        const data = await storageAdapter.get<AppSettings>(STORAGE_KEYS.SETTINGS);
        return data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS;
    }

    async update(settings: Partial<AppSettings>): Promise<AppSettings> {
        const current = await this.get();
        const updated = { ...current, ...settings };
        await storageAdapter.set(STORAGE_KEYS.SETTINGS, updated);
        return updated;
    }

    async reset(): Promise<AppSettings> {
        await storageAdapter.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
    }
}

export const settingsRepository = new SettingsRepository();
