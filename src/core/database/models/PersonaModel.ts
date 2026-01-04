/**
 * Persona Model
 */
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class PersonaModel extends Model {
    static table = 'personas';

    @field('name') name!: string;
    @field('description') description!: string;
    @field('personality') personality!: string;
    @field('scenario') scenario!: string;
    @field('system_prompt') systemPrompt!: string;
    @field('post_history_instructions') postHistoryInstructions!: string;
    @field('creator_notes') creatorNotes!: string;
    @field('compiled_system_prompt') compiledSystemPrompt!: string;
    @field('created_at') createdAt!: number;
    @field('updated_at') updatedAt!: number;
}
