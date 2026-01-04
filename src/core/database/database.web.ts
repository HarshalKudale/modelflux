/**
 * WatermelonDB Database - Web Implementation
 *
 * Uses LokiJSAdapter for browser environments.
 */
import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

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

const adapter = new LokiJSAdapter({
    schema,
    dbName: 'lmhub',
    useWebWorker: false, // Disable web workers for simplicity
    useIncrementalIndexedDB: true, // Use IndexedDB for persistence
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
