import { STORAGE_KEYS } from '../../config/constants';
import { Persona } from '../types';
import { storageAdapter } from './StorageAdapter';

export interface IPersonaRepository {
    findById(id: string): Promise<Persona | null>;
    findAll(): Promise<Persona[]>;
    create(entity: Persona): Promise<Persona>;
    update(entity: Persona): Promise<Persona>;
    delete(id: string): Promise<void>;
}

class PersonaRepository implements IPersonaRepository {
    private async getAll(): Promise<Persona[]> {
        const data = await storageAdapter.get<Persona[]>(STORAGE_KEYS.PERSONAS);
        return data || [];
    }

    private async saveAll(personas: Persona[]): Promise<void> {
        await storageAdapter.set(STORAGE_KEYS.PERSONAS, personas);
    }

    async findById(id: string): Promise<Persona | null> {
        const personas = await this.getAll();
        return personas.find((p) => p.id === id) || null;
    }

    async findAll(): Promise<Persona[]> {
        return this.getAll();
    }

    async create(entity: Persona): Promise<Persona> {
        const personas = await this.getAll();
        personas.push(entity);
        await this.saveAll(personas);
        return entity;
    }

    async update(entity: Persona): Promise<Persona> {
        const personas = await this.getAll();
        const index = personas.findIndex((p) => p.id === entity.id);
        if (index === -1) {
            throw new Error(`Persona not found: ${entity.id}`);
        }
        personas[index] = { ...entity, updatedAt: Date.now() };
        await this.saveAll(personas);
        return personas[index];
    }

    async delete(id: string): Promise<void> {
        const personas = await this.getAll();
        const filtered = personas.filter((p) => p.id !== id);
        await this.saveAll(filtered);
    }
}

export const personaRepository = new PersonaRepository();
