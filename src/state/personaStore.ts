import { create } from 'zustand';
import { personaRepository } from '../core/storage';
import { Persona, generateId } from '../core/types';

interface PersonaStoreState {
    personas: Persona[];
    isLoading: boolean;
    error: string | null;
}

interface PersonaStoreActions {
    loadPersonas: () => Promise<void>;
    createPersona: (persona: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Persona>;
    updatePersona: (persona: Persona) => Promise<void>;
    deletePersona: (id: string) => Promise<void>;
    getPersonaById: (id: string) => Persona | undefined;
    clearError: () => void;
}

type PersonaStore = PersonaStoreState & PersonaStoreActions;

export const usePersonaStore = create<PersonaStore>((set, get) => ({
    // State
    personas: [],
    isLoading: false,
    error: null,

    // Actions
    loadPersonas: async () => {
        set({ isLoading: true, error: null });
        try {
            const personas = await personaRepository.findAll();
            set({ personas, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load personas',
                isLoading: false,
            });
        }
    },

    createPersona: async (personaData) => {
        const now = Date.now();
        const persona: Persona = {
            ...personaData,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };

        try {
            await personaRepository.create(persona);
            set((state) => ({
                personas: [...state.personas, persona],
            }));
            return persona;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create persona',
            });
            throw error;
        }
    },

    updatePersona: async (persona) => {
        try {
            const updated = await personaRepository.update(persona);
            set((state) => ({
                personas: state.personas.map((p) => (p.id === persona.id ? updated : p)),
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update persona',
            });
            throw error;
        }
    },

    deletePersona: async (id) => {
        try {
            await personaRepository.delete(id);
            set((state) => ({
                personas: state.personas.filter((p) => p.id !== id),
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete persona',
            });
            throw error;
        }
    },

    getPersonaById: (id) => {
        return get().personas.find((p) => p.id === id);
    },

    clearError: () => {
        set({ error: null });
    },
}));
