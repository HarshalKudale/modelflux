/**
 * Settings Repository
 *
 * Manages app settings using WatermelonDB (singleton pattern).
 */

import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { SettingsModel } from '../database/models';
import { AppSettings, DEFAULT_SETTINGS } from '../types';

const SETTINGS_KEY = 'app_settings';

export interface ISettingsRepository {
    get(): Promise<AppSettings>;
    update(settings: Partial<AppSettings>): Promise<AppSettings>;
    reset(): Promise<AppSettings>;
}

class SettingsRepository implements ISettingsRepository {
    private get collection() {
        return database.get<SettingsModel>('settings');
    }

    async get(): Promise<AppSettings> {
        try {
            const models = await this.collection
                .query(Q.where('key', SETTINGS_KEY))
                .fetch();

            if (models.length > 0) {
                const parsed = JSON.parse(models[0].settingsJson) as AppSettings;
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
            return DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    }

    async update(settings: Partial<AppSettings>): Promise<AppSettings> {
        const current = await this.get();
        const updated = { ...current, ...settings };

        await database.write(async () => {
            const models = await this.collection
                .query(Q.where('key', SETTINGS_KEY))
                .fetch();

            if (models.length > 0) {
                await models[0].update((record) => {
                    record.settingsJson = JSON.stringify(updated);
                });
            } else {
                await this.collection.create((record) => {
                    record.key = SETTINGS_KEY;
                    record.settingsJson = JSON.stringify(updated);
                });
            }
        });

        return updated;
    }

    async reset(): Promise<AppSettings> {
        await database.write(async () => {
            const models = await this.collection
                .query(Q.where('key', SETTINGS_KEY))
                .fetch();

            if (models.length > 0) {
                await models[0].update((record) => {
                    record.settingsJson = JSON.stringify(DEFAULT_SETTINGS);
                });
            } else {
                await this.collection.create((record) => {
                    record.key = SETTINGS_KEY;
                    record.settingsJson = JSON.stringify(DEFAULT_SETTINGS);
                });
            }
        });

        return DEFAULT_SETTINGS;
    }
}

export const settingsRepository = new SettingsRepository();
