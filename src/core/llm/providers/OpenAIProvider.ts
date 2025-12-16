import { LLMConfig } from '../../types';
import { ChatMessage, LLMResponse, LLMStreamChunk } from '../types';
import { BaseLLMProvider } from './BaseProvider';

export class OpenAIProvider extends BaseLLMProvider {
    protected getProviderName(): string {
        return 'openai';
    }

    protected buildHeaders(config: LLMConfig): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (config.apiKey) {
            headers['Authorization'] = `Bearer ${config.apiKey}`;
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
        maxTokens?: number
    ): Record<string, unknown> {
        const body: Record<string, unknown> = {
            model,
            messages,
            stream,
        };

        if (temperature !== undefined) {
            body.temperature = temperature;
        }
        if (maxTokens !== undefined) {
            body.max_tokens = maxTokens;
        }

        return body;
    }

    protected getCompletionsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/chat/completions`;
    }

    protected getModelsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/models`;
    }

    protected parseResponse(data: any): LLMResponse {
        const choice = data.choices?.[0];
        return {
            content: choice?.message?.content || '',
            model: data.model || '',
            usage: data.usage
                ? {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens,
                }
                : undefined,
        };
    }

    protected parseStreamChunk(chunk: string): LLMStreamChunk | null {
        const trimmed = chunk.trim();
        if (!trimmed || !trimmed.startsWith('data:')) return null;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') {
            return { content: '', done: true };
        }

        try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            const finishReason = parsed.choices?.[0]?.finish_reason;

            return {
                content: delta,
                done: finishReason === 'stop',
                usage: parsed.usage
                    ? {
                        promptTokens: parsed.usage.prompt_tokens,
                        completionTokens: parsed.usage.completion_tokens,
                        totalTokens: parsed.usage.total_tokens,
                    }
                    : undefined,
            };
        } catch {
            return null;
        }
    }

    protected parseModels(data: any): string[] {
        return (data.data || [])
            .filter((m: any) => m.id && !m.id.includes('embedding'))
            .map((m: any) => m.id)
            .sort();
    }
}

export const openAIProvider = new OpenAIProvider();
