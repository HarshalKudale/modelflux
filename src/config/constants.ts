// App-wide constants

export const APP_NAME = 'ModelFlux';
export const APP_VERSION = '1.0.0';

// Storage keys
export const STORAGE_KEYS = {
    CONVERSATIONS: 'modelflux:conversations',
    MESSAGES_PREFIX: 'modelflux:messages:',
    LLM_CONFIGS: 'modelflux:llm_configs',
    SETTINGS: 'modelflux:settings',
    PERSONAS: 'modelflux:personas',
} as const;

// Validation limits
export const LIMITS = {
    CONVERSATION_TITLE_MAX: 200,
    MESSAGE_CONTENT_MAX: 100000,
    LLM_CONFIG_NAME_MAX: 50,
} as const;

// API timeouts
export const TIMEOUTS = {
    LLM_REQUEST: 120000, // 2 minutes
    CONNECTION_TEST: 10000, // 10 seconds
    MODEL_FETCH: 15000, // 15 seconds
} as const;
