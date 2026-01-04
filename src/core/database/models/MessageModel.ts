/**
 * Message Model
 */
import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

export default class MessageModel extends Model {
    static table = 'messages';

    @field('conversation_id') conversationId!: string;
    @field('role') role!: string;
    @field('content') content!: string;
    @field('content_type') contentType!: string;
    @json('images', (raw) => raw || []) images!: any[];
    @field('model_id') modelId!: string;
    @json('usage', (raw) => raw || null) usage?: any;
    @field('thinking_content') thinkingContent?: string;
    @field('context') context?: string;
    @json('context_ids', (raw) => raw || []) contextIds!: number[];
    @field('interrupted') interrupted!: boolean;
    @field('timestamp') timestamp!: number;
}
