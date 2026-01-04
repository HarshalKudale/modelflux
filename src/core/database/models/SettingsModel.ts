/**
 * Settings Model
 */
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class SettingsModel extends Model {
    static table = 'settings';

    @field('key') key!: string;
    @field('settings_json') settingsJson!: string;
}
