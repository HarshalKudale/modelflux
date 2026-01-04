/**
 * WatermelonDB Schema Definition
 *
 * Defines all tables and columns for the database.
 * Version control allows future migrations.
 */
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
    version: 1,
    tables: [
        // Conversations table
        tableSchema({
            name: 'conversations',
            columns: [
                { name: 'title', type: 'string' },
                { name: 'provider_id', type: 'string' },
                { name: 'model_id', type: 'string' },
                { name: 'provider_type', type: 'string' },
                { name: 'persona_id', type: 'string', isOptional: true },
                { name: 'persona_prompt', type: 'string', isOptional: true },
                { name: 'context_prompt', type: 'string', isOptional: true },
                { name: 'attached_source_ids', type: 'string' }, // JSON array
                { name: 'thinking_enabled', type: 'boolean' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),

        // Messages table
        tableSchema({
            name: 'messages',
            columns: [
                { name: 'conversation_id', type: 'string', isIndexed: true },
                { name: 'role', type: 'string' },
                { name: 'content', type: 'string' },
                { name: 'content_type', type: 'string' },
                { name: 'images', type: 'string' }, // JSON array
                { name: 'model_id', type: 'string' },
                { name: 'usage', type: 'string' }, // JSON object
                { name: 'thinking_content', type: 'string', isOptional: true },
                { name: 'context', type: 'string', isOptional: true },
                { name: 'context_ids', type: 'string' }, // JSON array
                { name: 'interrupted', type: 'boolean' },
                { name: 'timestamp', type: 'number', isIndexed: true },
            ],
        }),

        // Personas table
        tableSchema({
            name: 'personas',
            columns: [
                { name: 'name', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'personality', type: 'string' },
                { name: 'scenario', type: 'string' },
                { name: 'system_prompt', type: 'string' },
                { name: 'post_history_instructions', type: 'string' },
                { name: 'creator_notes', type: 'string' },
                { name: 'compiled_system_prompt', type: 'string' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),

        // LLM Configs table
        tableSchema({
            name: 'llm_configs',
            columns: [
                { name: 'name', type: 'string' },
                { name: 'provider', type: 'string' },
                { name: 'base_url', type: 'string' },
                { name: 'api_key', type: 'string', isOptional: true },
                { name: 'default_model', type: 'string' },
                { name: 'headers', type: 'string' }, // JSON object
                { name: 'local_models', type: 'string' }, // JSON array
                { name: 'executorch_config', type: 'string' }, // JSON object
                { name: 'llama_cpp_config', type: 'string' }, // JSON object
                { name: 'provider_settings', type: 'string' }, // JSON object
                { name: 'supports_streaming', type: 'boolean' },
                { name: 'is_local', type: 'boolean' },
                { name: 'is_enabled', type: 'boolean' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),

        // RAG Configs table
        tableSchema({
            name: 'rag_configs',
            columns: [
                { name: 'name', type: 'string' },
                { name: 'provider', type: 'string' },
                { name: 'model_id', type: 'string' },
                { name: 'model_name', type: 'string', isOptional: true },
                { name: 'model_path', type: 'string', isOptional: true },
                { name: 'tokenizer_path', type: 'string', isOptional: true },
                { name: 'is_default', type: 'boolean' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),

        // Sources table
        tableSchema({
            name: 'sources',
            columns: [
                { name: 'source_id', type: 'number', isIndexed: true }, // Original numeric ID
                { name: 'name', type: 'string' },
                { name: 'uri', type: 'string' },
                { name: 'file_size', type: 'number' },
                { name: 'mime_type', type: 'string' },
                { name: 'added_at', type: 'number' },
                { name: 'is_processing', type: 'boolean' },
            ],
        }),

        // Downloaded Models table
        tableSchema({
            name: 'downloaded_models',
            columns: [
                { name: 'model_id', type: 'string', isIndexed: true },
                { name: 'name', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'provider', type: 'string' },
                { name: 'type', type: 'string' },
                { name: 'tags', type: 'string' }, // JSON array
                { name: 'local_path', type: 'string' },
                { name: 'model_file_path', type: 'string' },
                { name: 'tokenizer_file_path', type: 'string' },
                { name: 'tokenizer_config_file_path', type: 'string' },
                { name: 'size_estimate', type: 'string' },
                { name: 'downloaded_size', type: 'number' },
                { name: 'status', type: 'string' },
                { name: 'progress', type: 'number' },
                { name: 'downloaded_at', type: 'number' },
                { name: 'error_message', type: 'string', isOptional: true },
            ],
        }),

        // Settings table (singleton)
        tableSchema({
            name: 'settings',
            columns: [
                { name: 'key', type: 'string', isIndexed: true },
                { name: 'settings_json', type: 'string' },
            ],
        }),
    ],
});
