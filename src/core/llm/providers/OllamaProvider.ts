import { LLMConfig } from '../../types';
import { ChatMessage, LLMResponse, LLMStreamChunk } from '../types';
import { BaseLLMProvider } from './BaseProvider';

export class OllamaProvider extends BaseLLMProvider {
    protected getProviderName(): string {
        return 'ollama';
    }

    protected buildHeaders(config: LLMConfig): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

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
        _maxTokens?: number
    ): Record<string, unknown> {
        const body: Record<string, unknown> = {
            model,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            stream,
        };

        if (temperature !== undefined) {
            body.options = { temperature };
        }

        return body;
    }

    protected getCompletionsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/api/chat`;
    }

    protected getModelsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/api/tags`;
    }

    protected parseResponse(data: any): LLMResponse {
        return {
            content: data.message?.content || '',
            model: data.model || '',
            usage: data.eval_count
                ? {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
                }
                : undefined,
        };
    }

    protected parseStreamChunk(chunk: string): LLMStreamChunk | null {
        const trimmed = chunk.trim();
        if (!trimmed) return null;

        try {
            const parsed = JSON.parse(trimmed);

            return {
                content: parsed.message?.content || '',
                done: parsed.done === true,
                usage: parsed.done && parsed.eval_count
                    ? {
                        promptTokens: parsed.prompt_eval_count || 0,
                        completionTokens: parsed.eval_count || 0,
                        totalTokens: (parsed.prompt_eval_count || 0) + (parsed.eval_count || 0),
                    }
                    : undefined,
            };
        } catch {
            return null;
        }
    }

    protected parseModels(data: any): string[] {
        return (data.models || [])
            .map((m: any) => m.name || m.model)
            .filter(Boolean)
            .sort();
    }
}

export const ollamaProvider = new OllamaProvider();
