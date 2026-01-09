/**
 * Conversation Model
 */
import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

export default class ConversationModel extends Model {
    static table = 'conversations';

    @field('title') title!: string;
    @field('type') type!: string;
    @field('provider_id') providerId!: string;
    @field('model_id') modelId!: string;
    @field('provider_type') providerType!: string;
    @field('persona_id') personaId?: string;
    @field('persona_prompt') personaPrompt?: string;
    @field('context_prompt') contextPrompt?: string;
    @json('attached_source_ids', (raw) => raw || []) attachedSourceIds!: number[];
    @field('thinking_enabled') thinkingEnabled!: boolean;
    @field('created_at') createdAt!: number;
    @field('updated_at') updatedAt!: number;
}
