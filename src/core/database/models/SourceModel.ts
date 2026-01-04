/**
 * Source Model
 */
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class SourceModel extends Model {
    static table = 'sources';

    @field('source_id') sourceId!: number;
    @field('name') name!: string;
    @field('uri') uri!: string;
    @field('file_size') fileSize!: number;
    @field('mime_type') mimeType!: string;
    @field('added_at') addedAt!: number;
    @field('is_processing') isProcessing!: boolean;
}
