/**
 * WatermelonDB Database - Native Implementation
 *
 * Uses SQLiteAdapter for iOS and Android.
 */
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import {
    ConversationModel,
    DownloadedModelModel,
    LLMConfigModel,
    MessageModel,
    PersonaModel,
    RAGConfigModel,
    SettingsModel,
    SourceModel,
} from './models';
import { schema } from './schema';

const adapter = new SQLiteAdapter({
    schema,
    dbName: 'lmhub',
    jsi: true, // Enable JSI for better performance
    onSetUpError: (error) => {
        console.error('[Database] Setup error:', error);
    },
});

export const database = new Database({
    adapter,
    modelClasses: [
        ConversationModel,
        MessageModel,
        PersonaModel,
        LLMConfigModel,
        RAGConfigModel,
        SourceModel,
        DownloadedModelModel,
        SettingsModel,
    ],
});

export { database as default };
