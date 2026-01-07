'use client';

import Link from 'next/link';
import { useState } from 'react';

// Models data based on actual models.json from the app
const models = [
    // ExecuTorch LLM Models
    { id: 'llama3-2-1b', name: 'LLaMA 3.2 1B', description: 'Full precision 1B model from Meta', provider: 'executorch', type: 'llm', params: '1B', size: '~2.5 GB' },
    { id: 'llama3-2-1b-spinquant', name: 'LLaMA 3.2 1B SpinQuant', description: '1B model with SpinQuant quantization (recommended)', provider: 'executorch', type: 'llm', params: '1B', size: '~1.3 GB' },
    { id: 'llama3-2-3b', name: 'LLaMA 3.2 3B', description: 'Full precision 3B model from Meta', provider: 'executorch', type: 'llm', params: '3B', size: '~6.5 GB' },
    { id: 'llama3-2-3b-spinquant', name: 'LLaMA 3.2 3B SpinQuant', description: '3B model with SpinQuant quantization', provider: 'executorch', type: 'llm', params: '3B', size: '~3.2 GB' },
    { id: 'qwen3-0-6b', name: 'Qwen 3 0.6B', description: 'Lightweight Qwen 3 model with thinking capability', provider: 'executorch', type: 'llm', params: '0.6B', size: '~1.2 GB' },
    { id: 'qwen3-1-7b', name: 'Qwen 3 1.7B', description: 'Larger Qwen 3 model with thinking capability', provider: 'executorch', type: 'llm', params: '1.7B', size: '~3.4 GB' },
    { id: 'qwen3-4b', name: 'Qwen 3 4B', description: 'Large Qwen 3 model with thinking capability', provider: 'executorch', type: 'llm', params: '4B', size: '~8.0 GB' },
    { id: 'qwen2-5-0-5b', name: 'Qwen 2.5 0.5B', description: 'Ultra-lightweight Qwen 2.5 model', provider: 'executorch', type: 'llm', params: '0.5B', size: '~1.0 GB' },
    { id: 'qwen2-5-1-5b', name: 'Qwen 2.5 1.5B', description: 'Lightweight Qwen 2.5 model', provider: 'executorch', type: 'llm', params: '1.5B', size: '~3.0 GB' },
    { id: 'qwen2-5-3b', name: 'Qwen 2.5 3B', description: 'Mid-size Qwen 2.5 model', provider: 'executorch', type: 'llm', params: '3B', size: '~6.0 GB' },
    { id: 'hammer2-1-0-5b', name: 'Hammer 2.1 0.5B', description: 'Ultra-lightweight model optimized for function calling', provider: 'executorch', type: 'llm', params: '0.5B', size: '~1.0 GB' },
    { id: 'hammer2-1-1-5b', name: 'Hammer 2.1 1.5B', description: 'Lightweight model optimized for function calling', provider: 'executorch', type: 'llm', params: '1.5B', size: '~3.0 GB' },
    { id: 'hammer2-1-3b', name: 'Hammer 2.1 3B', description: 'Mid-size model optimized for function calling', provider: 'executorch', type: 'llm', params: '3B', size: '~6.0 GB' },
    { id: 'smollm2-135m', name: 'SmolLM 2 135M', description: 'Ultra-lightweight model for simple tasks', provider: 'executorch', type: 'llm', params: '135M', size: '~270 MB' },
    { id: 'smollm2-360m', name: 'SmolLM 2 360M', description: 'Small but capable model', provider: 'executorch', type: 'llm', params: '360M', size: '~720 MB' },
    { id: 'smollm2-1-7b', name: 'SmolLM 2 1.7B', description: 'Larger SmolLM model with better capabilities', provider: 'executorch', type: 'llm', params: '1.7B', size: '~3.4 GB' },
    { id: 'phi4-mini-4b', name: 'Phi 4 Mini 4B', description: "Microsoft's Phi 4 Mini model", provider: 'executorch', type: 'llm', params: '4B', size: '~8.0 GB' },
    // ExecuTorch Embedding
    { id: 'all-minilm-l6-v2', name: 'All MiniLM L6 V2', description: 'Lightweight text embedding model for semantic search and RAG', provider: 'executorch', type: 'embedding', params: '22M', size: '~45 MB' },
    // Llama.cpp Models
    { id: 'llama-cpp-qwen3-0-6b', name: 'Qwen 3 0.6B GGUF', description: 'Lightweight Qwen 3 model for llama.cpp with thinking capability', provider: 'llama-cpp', type: 'llm', params: '0.6B', size: '~0.4 GB' },
    { id: 'llama-cpp-nomic-embed-v1-5', name: 'Nomic Embed Text v1.5 GGUF', description: 'Text embedding model for RAG using llama.cpp', provider: 'llama-cpp', type: 'embedding', params: '137M', size: '~100 MB' },
];

const providerColors: Record<string, string> = {
    'executorch': '#0668E1',
    'llama-cpp': '#FF6B35',
};

const providerLabels: Record<string, string> = {
    'executorch': 'ExecuTorch',
    'llama-cpp': 'Llama.cpp',
};

export default function ModelsPage() {
    const [filterProvider, setFilterProvider] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');

    const filteredModels = models.filter((model) => {
        if (filterProvider !== 'all' && model.provider !== filterProvider) return false;
        if (filterType !== 'all' && model.type !== filterType) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-background pt-24 pb-16 px-4">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground animate-fade-in-up">
                        Downloadable Models
                    </h1>
                    <p className="text-xl text-foreground-secondary max-w-2xl mx-auto animate-fade-in-up stagger-1">
                        Browse and download AI models to run directly on your device. No internet required after download.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 justify-center mb-12 animate-fade-in-up stagger-2">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground-secondary">Provider:</label>
                        <select
                            value={filterProvider}
                            onChange={(e) => setFilterProvider(e.target.value)}
                            className="px-4 py-2 bg-background-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Providers</option>
                            <option value="executorch">ExecuTorch (.pte)</option>
                            <option value="llama-cpp">Llama.cpp (.gguf)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground-secondary">Type:</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 bg-background-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Types</option>
                            <option value="llm">LLM (Chat)</option>
                            <option value="embedding">Embedding (RAG)</option>
                        </select>
                    </div>
                </div>

                {/* Models Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredModels.map((model, idx) => (
                        <div
                            key={model.id}
                            className={`glass p-6 rounded-2xl hover-card animate-fade-in-up stagger-${Math.min((idx % 8) + 1, 8)}`}
                        >
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span
                                    className="px-2 py-1 text-xs font-medium rounded-full"
                                    style={{
                                        backgroundColor: `${providerColors[model.provider]}20`,
                                        color: providerColors[model.provider],
                                    }}
                                >
                                    {providerLabels[model.provider]}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${model.type === 'llm'
                                    ? 'bg-green-500/20 text-green-500'
                                    : 'bg-purple-500/20 text-purple-500'
                                    }`}>
                                    {model.type === 'llm' ? 'LLM' : 'Embedding'}
                                </span>
                            </div>

                            {/* Name & Description */}
                            <h3 className="text-lg font-semibold text-foreground mb-2">{model.name}</h3>
                            <p className="text-sm text-foreground-secondary mb-4">{model.description}</p>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm text-foreground-muted">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                    </svg>
                                    {model.params}
                                </span>
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                    </svg>
                                    {model.size}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredModels.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-foreground-secondary">No models match your filters.</p>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-16 text-center">
                    <p className="text-foreground-secondary mb-4">
                        Download these models directly in the app. Available on Android and Web.
                    </p>
                    <Link
                        href="/app"
                        className="inline-flex items-center gap-2 px-8 py-3 text-lg font-medium text-white bg-primary hover:bg-primary-hover rounded-full transition-all btn-hover"
                    >
                        Open App to Download
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}
