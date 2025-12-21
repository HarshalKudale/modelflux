import { LLMConfig } from '../../types';
import { ChatMessage, LLMResponse, LLMStreamChunk } from '../types';
import { BaseLLMProvider } from './BaseProvider';

export class AnthropicProvider extends BaseLLMProvider {
    protected getProviderName(): string {
        return 'anthropic';
    }

    protected buildHeaders(config: LLMConfig): Record<string, string> {
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

    protected buildRequestBody(
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
                budget_tokens: 5000, // Allow up to 10k tokens for thinking
            };
        }

        return body;
    }

    protected getCompletionsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/messages`;
    }

    protected getModelsEndpoint(config: LLMConfig): string {
        // Anthropic doesn't have a models endpoint, return a dummy URL
        return `${config.baseUrl}/models`;
    }

    protected parseResponse(data: any): LLMResponse {
        const textContent = data.content?.find((c: any) => c.type === 'text');
        return {
            content: textContent?.text || '',
            model: data.model || '',
            usage: data.usage
                ? {
                    promptTokens: data.usage.input_tokens,
                    completionTokens: data.usage.output_tokens,
                    totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
                }
                : undefined,
        };
    }

    protected parseStreamChunk(chunk: string): LLMStreamChunk | null {
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

    protected parseModels(_data: any): string[] {
        // Anthropic doesn't have a models API, return known models
        return [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
        ];
    }

    async fetchModels(llmConfig: LLMConfig): Promise<string[]> {
        // Override to return hardcoded list since Anthropic doesn't have a models endpoint
        return this.parseModels(null);
    }

    async testConnection(llmConfig: LLMConfig): Promise<boolean> {
        try {
            // Test by sending a minimal message
            const response = await fetch(this.getCompletionsEndpoint(llmConfig), {
                method: 'POST',
                headers: this.buildHeaders(llmConfig),
                body: JSON.stringify({
                    model: llmConfig.defaultModel,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 1,
                }),
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

export const anthropicProvider = new AnthropicProvider();
