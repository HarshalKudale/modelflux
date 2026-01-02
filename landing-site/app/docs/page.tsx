import Link from 'next/link';

export default function DocsPage() {
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold mb-6 text-foreground">Welcome to LLM Hub</h1>
            <p className="text-xl text-foreground-secondary mb-8">
                Your private workspace for interacting with Large Language Models, both local and remote.
            </p>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-12">
                <h3 className="text-lg font-semibold text-primary mb-2">Getting Started</h3>
                <p className="mb-4">
                    LLM Hub supports multiple providers: cloud APIs (OpenAI, Anthropic), local servers (Ollama),
                    and on-device models (ExecuTorch, Llama.cpp). Choose what works best for your needs.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Link href="/docs/providers" className="inline-flex items-center text-primary font-medium hover:underline">
                        Setup Providers &rarr;
                    </Link>
                    <Link href="/docs/local-models" className="inline-flex items-center text-primary font-medium hover:underline">
                        Local Models &rarr;
                    </Link>
                </div>
            </div>

            <hr className="my-12 border-border" />

            <section id="features" className="mb-16">
                <h2 className="text-3xl font-bold mb-6 text-foreground">Core Features</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/docs/providers" className="block bg-background-secondary p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                        <h3 className="text-xl font-semibold mb-3">LLM Providers</h3>
                        <p className="text-foreground-secondary">
                            Connect to OpenAI, Anthropic, Ollama, or any OpenAI-compatible API endpoint.
                        </p>
                    </Link>

                    <Link href="/docs/local-models" className="block bg-background-secondary p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                        <h3 className="text-xl font-semibold mb-3">Local Models</h3>
                        <p className="text-foreground-secondary">
                            Run AI models on your device with ExecuTorch (.pte) or Llama.cpp (.gguf) support.
                        </p>
                    </Link>

                    <Link href="/docs/rag" className="block bg-background-secondary p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                        <h3 className="text-xl font-semibold mb-3">RAG & Sources</h3>
                        <p className="text-foreground-secondary">
                            Add documents to your conversations for context-aware AI responses.
                        </p>
                    </Link>

                    <Link href="/docs/personas" className="block bg-background-secondary p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                        <h3 className="text-xl font-semibold mb-3">Personas</h3>
                        <p className="text-foreground-secondary">
                            Create custom AI personalities with system prompts for different use cases.
                        </p>
                    </Link>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold mb-6 text-foreground">Platform Support</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500 mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Android</h3>
                        <p className="text-foreground-secondary text-sm">
                            Full support including local models with ExecuTorch and Llama.cpp.
                        </p>
                    </div>

                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">iOS</h3>
                        <p className="text-foreground-secondary text-sm">
                            Full support including local models with ExecuTorch and Llama.cpp.
                        </p>
                    </div>

                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500 mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Web</h3>
                        <p className="text-foreground-secondary text-sm">
                            Remote providers only (OpenAI, Anthropic). Local models require native app.
                        </p>
                    </div>
                </div>
            </section>

            <section id="web-limitations" className="mb-16">
                <h2 className="text-3xl font-bold mb-6 text-foreground">Web Support Limitations</h2>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-600 dark:text-yellow-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400 mb-2">Important Note for Web Users</h3>
                            <p className="text-foreground-secondary mb-4">
                                Due to browser security restrictions (CORS and Mixed Content), the Web version of LLM Hub
                                <strong> only supports remote providers</strong> (like OpenAI and Anthropic).
                            </p>
                            <p className="text-foreground-secondary">
                                To use local models or connect to a local Ollama server, please use our <strong>Android</strong> or <strong>iOS</strong> applications.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold mb-6 text-foreground">Data & Privacy</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <ul className="space-y-4 text-foreground-secondary">
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span><strong>Local Storage</strong> - All conversations and settings are stored on your device</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span><strong>No Tracking</strong> - We don&apos;t collect any analytics or usage data</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span><strong>Export/Import</strong> - Backup your data anytime as JSON files</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span><strong>Open Source</strong> - Full transparency with <a href="https://github.com/HarshalKudale/lmhub" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">source code on GitHub</a></span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}
