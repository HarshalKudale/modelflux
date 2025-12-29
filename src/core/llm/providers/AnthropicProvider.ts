import { fetch } from 'expo/fetch';
import { TIMEOUTS } from '../../../config/constants';
import { LLMConfig } from '../../types';
import { ChatMessage, LLMError, LLMErrorCode, LLMRequest, LLMStreamChunk } from '../types';
import { BaseLLMProvider, createTimeoutSignal } from './BaseProvider';

/**
 * Anthropic Provider
 * 
 * Handles API calls to Anthropic Claude API using expo/fetch.
 * Supports streaming via Server-Sent Events (SSE).
 * Includes extended thinking support for Claude 3.5 Sonnet and newer.
 */
export class AnthropicProvider extends BaseLLMProvider {
    protected getProviderName(): string {
        return 'anthropic';
    }

    /**
     * Build request headers for Anthropic API.
     */
    private buildHeaders(config: LLMConfig): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
        };

        if (config.apiKey) {
            headers['x-api-key'] = config.apiKey;
        }

        if (config.headers) {
            Object.assign(headers, config.headers);
        }

        return headers;
    }

    /**
     * Build request body for Anthropic messages API.
     */
    private buildRequestBody(
        messages: ChatMessage[],
        model: string,
        stream: boolean,
        temperature?: number,
        maxTokens?: number,
        thinkingEnabled?: boolean
    ): Record<string, unknown> {
        // Extract system message if present
        const systemMessage = messages.find((m) => m.role === 'system');
        const chatMessages = messages.filter((m) => m.role !== 'system');

        const body: Record<string, unknown> = {
            model,
            messages: chatMessages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            stream,
            max_tokens: maxTokens || 4096,
        };

        if (systemMessage) {
            body.system = systemMessage.content;
        }

        if (temperature !== undefined) {
            body.temperature = temperature;
        }

        // Anthropic Claude uses 'thinking' parameter with budget_tokens
        // Extended thinking is available on Claude 3.5 Sonnet and newer
        if (thinkingEnabled) {
            body.thinking = {
                type: 'enabled',
                budget_tokens: 5000,
            };
        }

        return body;
    }

    /**
     * Get the messages endpoint URL.
     */
    private getCompletionsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/messages`;
    }

    /**
     * Parse a streaming chunk from Anthropic SSE format.
     */
    private parseStreamChunk(chunk: string): LLMStreamChunk | null {
        const trimmed = chunk.trim();
        if (!trimmed || !trimmed.startsWith('data:')) return null;

        const data = trimmed.slice(5).trim();
        if (!data) return null;

        try {
            const parsed = JSON.parse(data);

            // Handle different event types
            if (parsed.type === 'content_block_delta') {
                return {
                    content: parsed.delta?.text || '',
                    done: false,
                };
            }

            if (parsed.type === 'message_stop') {
                return { content: '', done: true };
            }

            if (parsed.type === 'message_delta' && parsed.usage) {
                return {
                    content: '',
                    done: parsed.delta?.stop_reason === 'end_turn',
                    usage: {
                        promptTokens: 0,
                        completionTokens: parsed.usage.output_tokens || 0,
                        totalTokens: parsed.usage.output_tokens || 0,
                    },
                };
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Stream completion from Anthropic API.
     * Handles the full API call and yields parsed chunks.
     */
    protected async *streamCompletion(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { llmConfig, messages, model, temperature, maxTokens, signal, thinkingEnabled } = request;
        const actualModel = model || llmConfig.defaultModel;

        console.log(`[${this.getProviderName()}] Starting streamCompletion`, {
            model: actualModel,
            messageCount: messages.length,
            thinkingEnabled,
        });

        const response = await fetch(this.getCompletionsEndpoint(llmConfig), {
            method: 'POST',
            headers: this.buildHeaders(llmConfig),
            body: JSON.stringify(
                this.buildRequestBody(messages, actualModel, true, temperature, maxTokens, thinkingEnabled)
            ),
            signal: signal || createTimeoutSignal(TIMEOUTS.LLM_REQUEST),
        });

        if (!response.ok) {
            throw await this.handleErrorResponse(response);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new LLMError(
                'No response body',
                LLMErrorCode.UNKNOWN,
                'anthropic'
            );
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const chunk = this.parseStreamChunk(line);
                if (chunk) {
                    yield chunk;
                    if (chunk.done) {
                        return;
                    }
                }
            }
        }
    }

    /**
     * Fetch available models from Anthropic.
     * Anthropic doesn't have a models API, return hardcoded list.
     */
    async fetchModels(_llmConfig: LLMConfig): Promise<string[]> {
        console.log(`[${this.getProviderName()}] Returning hardcoded model list`);
        return [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
        ];
    }

    /**
     * Test connection to Anthropic API.
     * Sends a minimal message since there's no models endpoint.
     */
    async testConnection(llmConfig: LLMConfig): Promise<boolean> {
        console.log(`[${this.getProviderName()}] Testing connection`);

        try {
            const response = await fetch(this.getCompletionsEndpoint(llmConfig), {
                method: 'POST',
                headers: this.buildHeaders(llmConfig),
                body: JSON.stringify({
                    model: llmConfig.defaultModel || 'claude-3-5-sonnet-20241022',
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 1,
                }),
                signal: createTimeoutSignal(TIMEOUTS.CONNECTION_TEST),
            });
            console.log(`[${this.getProviderName()}] Connection test result:`, response.ok);
            return response.ok;
        } catch (error) {
            console.log(`[${this.getProviderName()}] Test connection error:`, error);
            return false;
        }
    }
}

export const anthropicProvider = new AnthropicProvider();
