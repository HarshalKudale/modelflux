/**
 * LLM Config Model
 */
import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

export default class LLMConfigModel extends Model {
    static table = 'llm_configs';

    @field('name') name!: string;
    @field('provider') provider!: string;
    @field('base_url') baseUrl!: string;
    @field('api_key') apiKey?: string;
    @field('default_model') defaultModel!: string;
    @json('headers', (raw) => raw || {}) headers!: Record<string, string>;
    @json('local_models', (raw) => raw || []) localModels!: any[];
    @json('executorch_config', (raw) => raw || null) executorchConfig?: any;
    @json('llama_cpp_config', (raw) => raw || null) llamaCppConfig?: any;
    @json('provider_settings', (raw) => raw || null) providerSettings?: any;
    @field('supports_streaming') supportsStreaming!: boolean;
    @field('is_local') isLocal!: boolean;
    @field('is_enabled') isEnabled!: boolean;
    @field('created_at') createdAt!: number;
    @field('updated_at') updatedAt!: number;
}
