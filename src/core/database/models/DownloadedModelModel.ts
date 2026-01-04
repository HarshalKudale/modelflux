/**
 * Downloaded Model Model
 */
import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

export default class DownloadedModelModel extends Model {
    static table = 'downloaded_models';

    @field('model_id') modelId!: string;
    @field('name') name!: string;
    @field('description') description!: string;
    @field('provider') provider!: string;
    @field('type') type!: string;
    @json('tags', (raw) => raw || []) tags!: string[];
    @field('local_path') localPath!: string;
    @field('model_file_path') modelFilePath!: string;
    @field('tokenizer_file_path') tokenizerFilePath!: string;
    @field('tokenizer_config_file_path') tokenizerConfigFilePath!: string;
    @field('size_estimate') sizeEstimate!: string;
    @field('downloaded_size') downloadedSize!: number;
    @field('status') status!: string;
    @field('progress') progress!: number;
    @field('downloaded_at') downloadedAt!: number;
    @field('error_message') errorMessage?: string;
}
