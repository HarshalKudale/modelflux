/**
 * Model Type Presets Configuration
 * 
 * This file defines the available model types and their metadata.
 * Used for filtering models in the Models screen.
 */

/**
 * Model type keys - enum for type-safe model type references
 */
export enum ModelTypeKey {
    LLM = 'llm',
    Embedding = 'embedding',
}

/**
 * Model type identifier (derived from enum)
 */
export type ModelType = `${ModelTypeKey}`;

/**
 * Model type display info
 */
export interface ModelTypeInfo {
    /** Unique identifier for the model type */
    id: ModelType;
    /** Display name for the model type */
    name: string;
    /** Icon name from Ionicons */
    icon: string;
    /** Theme color for the model type */
    color: string;
    /** Description of the model type */
    description: string;
}

/**
 * Model type presets - all available model types with their metadata
 */
export const MODEL_TYPE_PRESETS: ModelTypeInfo[] = [
    {
        id: 'llm',
        name: 'LLM',
        icon: 'chatbubble-ellipses',
        color: '#10b981',
        description: 'Large Language Models for text generation and chat',
    },
    {
        id: 'embedding',
        name: 'Embedding',
        icon: 'prism',
        color: '#f59e0b',
        description: 'Text embedding models for semantic search and RAG',
    },
];

/**
 * Get all model type IDs
 */
export const getModelTypeIds = (): ModelType[] => {
    return MODEL_TYPE_PRESETS.map(type => type.id);
};

/**
 * Get model type info by ID
 */
export const getModelTypeInfo = (id: ModelType): ModelTypeInfo | undefined => {
    return MODEL_TYPE_PRESETS.find(type => type.id === id);
};
