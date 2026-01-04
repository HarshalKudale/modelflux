/**
 * RAG Config Model
 */
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class RAGConfigModel extends Model {
    static table = 'rag_configs';

    @field('name') name!: string;
    @field('provider') provider!: string;
    @field('model_id') modelId!: string;
    @field('model_name') modelName?: string;
    @field('model_path') modelPath?: string;
    @field('tokenizer_path') tokenizerPath?: string;
    @field('is_default') isDefault!: boolean;
    @field('created_at') createdAt!: number;
    @field('updated_at') updatedAt!: number;
}
