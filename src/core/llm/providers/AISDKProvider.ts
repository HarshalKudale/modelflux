/**
 * AI SDK Provider Adapter
 *
 * Unified adapter for remote LLM providers using Vercel AI SDK.
 * Supports OpenAI, Anthropic, and Ollama.
 */
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';
import { createOllama } from 'ollama-ai-provider-v2';

import { LLMConfig } from '../../types';
import { LLMError, LLMErrorCode, LLMRequest, LLMStreamChunk } from '../types';

/**
 * Creates an AI SDK provider instance based on the LLMConfig
 */
function getSDKProvider(config: LLMConfig) {
    switch (config.provider) {
        case 'openai':
            return createOpenAI({
                apiKey: config.apiKey,
                fetch: expoFetch as unknown as typeof fetch,
            });
        case 'openai-spec':
            return createOpenAI({
                apiKey: config.apiKey,
                baseURL: config.baseUrl,
                fetch: expoFetch as unknown as typeof fetch,
            });
        case 'anthropic':
            return createAnthropic({
                apiKey: config.apiKey,
                baseURL: config.baseUrl || undefined,
                fetch: expoFetch as unknown as typeof fetch,
            });
        case 'ollama':
            // ollama-ai-provider-v2 expects baseURL to include /api suffix
            const ollamaBaseUrl = config.baseUrl?.replace(/\/$/, '') + '/api';
            return createOllama({
                baseURL: ollamaBaseUrl,
                fetch: expoFetch as unknown as typeof fetch,
            });
        default:
            throw new LLMError(
                `Unsupported provider: ${config.provider}`,
                LLMErrorCode.PROVIDER_NOT_SUPPORTED,
                config.provider
            );
    }
}

/**
 * AISDKProvider - Adapter for remote providers using Vercel AI SDK
 */
export class AISDKProvider {
    private abortController: AbortController | null = null;

    /**
     * Stream message completion using AI SDK's streamText
     */
    async *sendMessageStream(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { llmConfig, messages, model, temperature, onToken, onThinking } = request;
        const provider = getSDKProvider(llmConfig);
        const actualModel = model || llmConfig.defaultModel;

        console.log('[AISDKProvider] Starting stream', {
            provider: llmConfig.provider,
            model: actualModel,
            messageCount: messages.length,
        });

        this.abortController = new AbortController();

        try {
            // Enable thinking mode for Ollama by default
            const providerOptions = llmConfig.provider === 'ollama'
                ? { ollama: { think: true } }
                : undefined;

            // Use provider settings from config, with request-level override for temperature
            const settings = llmConfig.providerSettings || {};

            const result = streamText({
                model: provider(actualModel),
                messages: messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
                // Request-level temperature takes precedence, then config, then undefined (use default)
                temperature: temperature ?? settings.temperature,
                topP: settings.topP,
                maxOutputTokens: settings.maxOutputTokens,
                presencePenalty: settings.presencePenalty,
                frequencyPenalty: settings.frequencyPenalty,
                abortSignal: this.abortController.signal,
                providerOptions,
            });

            let fullContent = '';
            let thinkingContent = '';

            // Use fullStream to access both text and reasoning content
            for await (const part of result.fullStream) {
                switch (part.type) {
                    case 'text-delta': {
                        fullContent += part.text;
                        if (onToken) {
                            onToken(fullContent);
                        }
                        yield { content: part.text, done: false };
                        break;
                    }
                    case 'reasoning-delta': {
                        thinkingContent += part.text;
                        if (onThinking) {
                            onThinking(thinkingContent);
                        }
                        yield { content: '', thinking: part.text, done: false };
                        break;
                    }
                    case 'error': {
                        console.error('[AISDKProvider] Stream error:', part.error);
                        break;
                    }
                    case 'finish': {
                        // Stream finished
                        break;
                    }
                }
            }

            // Final chunk
            yield { content: '', thinking: thinkingContent || undefined, done: true };

            console.log('[AISDKProvider] Stream complete', {
                contentLength: fullContent.length,
                thinkingLength: thinkingContent.length,
            });
        } catch (error) {
            console.error('[AISDKProvider] Error:', error);

            if (error instanceof Error && error.name === 'AbortError') {
                throw new LLMError(
                    'Request cancelled',
                    LLMErrorCode.CANCELLED,
                    llmConfig.provider
                );
            }

            if (error instanceof LLMError) {
                throw error;
            }

            throw new LLMError(
                error instanceof Error ? error.message : 'Unknown error',
                LLMErrorCode.UNKNOWN,
                llmConfig.provider
            );
        } finally {
            this.abortController = null;
        }
    }

    /**
     * Interrupt active generation
     */
    interrupt(): void {
        console.log('[AISDKProvider] Interrupting...');
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    /**
     * Fetch available models from the provider
     */
    async fetchModels(llmConfig: LLMConfig): Promise<string[]> {
        // OpenAI and Anthropic don't have easy model listing
        // Return common models based on provider
        switch (llmConfig.provider) {
            case 'openai':
            case 'openai-spec':
                return [
                    'gpt-4o',
                    'gpt-4o-mini',
                    'gpt-4-turbo',
                    'gpt-4',
                    'gpt-3.5-turbo',
                ];
            case 'anthropic':
                return [
                    'claude-3-5-sonnet-20241022',
                    'claude-3-5-haiku-20241022',
                    'claude-3-opus-20240229',
                    'claude-3-sonnet-20240229',
                    'claude-3-haiku-20240307',
                ];
            case 'ollama':
                // Fetch from Ollama API
                try {
                    const response = await expoFetch(`${llmConfig.baseUrl}/api/tags`, {
                        method: 'GET',
                    });
                    if (response.ok) {
                        const data = await response.json();
                        return (data.models || [])
                            .map((m: { name?: string; model?: string }) => m.name || m.model)
                            .filter(Boolean)
                            .sort();
                    }
                } catch (e) {
                    console.error('[AISDKProvider] Failed to fetch Ollama models:', e);
                }
                return [];
            default:
                return [];
        }
    }

    /**
     * Test connection to the provider
     */
    async testConnection(llmConfig: LLMConfig): Promise<boolean> {
        try {
            switch (llmConfig.provider) {
                case 'ollama':
                    const response = await expoFetch(`${llmConfig.baseUrl}/api/tags`, {
                        method: 'GET',
                    });
                    return response.ok;
                case 'openai':
                case 'openai-spec':
                case 'anthropic':
                    // For API-key based providers, just verify key is present
                    return !!llmConfig.apiKey;
                default:
                    return false;
            }
        } catch {
            return false;
        }
    }
}

// Singleton instance
export const aisdkProvider = new AISDKProvider();
