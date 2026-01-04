/**
 * Persona Repository
 *
 * Manages persistence of personas using WatermelonDB.
 */
import { database } from '../database';
import { PersonaModel } from '../database/models';
import { Persona } from '../types';

export interface IPersonaRepository {
    findById(id: string): Promise<Persona | null>;
    findAll(): Promise<Persona[]>;
    create(entity: Persona): Promise<Persona>;
    update(entity: Persona): Promise<Persona>;
    delete(id: string): Promise<void>;
}

/**
 * Convert WatermelonDB model to Persona type
 */
function modelToPersona(model: PersonaModel): Persona {
    return {
        id: model.id,
        name: model.name,
        description: model.description,
        personality: model.personality,
        scenario: model.scenario,
        system_prompt: model.systemPrompt,
        post_history_instructions: model.postHistoryInstructions,
        creator_notes: model.creatorNotes,
        compiledSystemPrompt: model.compiledSystemPrompt,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
    };
}

class PersonaRepository implements IPersonaRepository {
    private get collection() {
        return database.get<PersonaModel>('personas');
    }

    async findById(id: string): Promise<Persona | null> {
        try {
            const model = await this.collection.find(id);
            return modelToPersona(model);
        } catch {
            return null;
        }
    }

    async findAll(): Promise<Persona[]> {
        const models = await this.collection.query().fetch();
        return models.map(modelToPersona);
    }

    async create(entity: Persona): Promise<Persona> {
        await database.write(async () => {
            await this.collection.create((record) => {
                (record._raw as any).id = entity.id;
                record.name = entity.name;
                record.description = entity.description;
                record.personality = entity.personality;
                record.scenario = entity.scenario;
                record.systemPrompt = entity.system_prompt;
                record.postHistoryInstructions = entity.post_history_instructions;
                record.creatorNotes = entity.creator_notes;
                record.compiledSystemPrompt = entity.compiledSystemPrompt;
                record.createdAt = entity.createdAt;
                record.updatedAt = entity.updatedAt;
            });
        });
        return entity;
    }

    async update(entity: Persona): Promise<Persona> {
        const now = Date.now();
        await database.write(async () => {
            const model = await this.collection.find(entity.id);
            await model.update((record) => {
                record.name = entity.name;
                record.description = entity.description;
                record.personality = entity.personality;
                record.scenario = entity.scenario;
                record.systemPrompt = entity.system_prompt;
                record.postHistoryInstructions = entity.post_history_instructions;
                record.creatorNotes = entity.creator_notes;
                record.compiledSystemPrompt = entity.compiledSystemPrompt;
                record.updatedAt = now;
            });
        });
        return { ...entity, updatedAt: now };
    }

    async delete(id: string): Promise<void> {
        await database.write(async () => {
            try {
                const model = await this.collection.find(id);
                await model.destroyPermanently();
            } catch {
                // Record doesn't exist, ignore
            }
        });
    }
}

export const personaRepository = new PersonaRepository();
