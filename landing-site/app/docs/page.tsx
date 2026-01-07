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
                    <Link href="/models" className="inline-flex items-center text-primary font-medium hover:underline">
                        Browse All Models &rarr;
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
                        <h3 className="text-xl font-semibold mb-3">RAG &amp; Sources</h3>
                        <p className="text-foreground-secondary">
                            Add documents to your conversations for context-aware AI responses.
                        </p>
                    </Link>

                    <Link href="/docs/personas" className="block bg-background-secondary p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                        <h3 className="text-xl font-semibold mb-3">Personas</h3>
                        <p className="text-foreground-secondary">
                            Create custom AI personalities with system prompts (Character Card V2 spec).
                        </p>
                    </Link>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold mb-6 text-foreground">Supported Providers</h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-background-secondary p-4 rounded-xl border border-border text-center">
                        <div className="w-10 h-10 mx-auto mb-2 bg-[#10a37f]/10 rounded-lg flex items-center justify-center">
                            <span className="text-[#10a37f] font-bold">AI</span>
                        </div>
                        <h4 className="font-semibold text-foreground">OpenAI</h4>
                        <p className="text-xs text-foreground-secondary mt-1">GPT-4, GPT-3.5</p>
                    </div>
                    <div className="bg-background-secondary p-4 rounded-xl border border-border text-center">
                        <div className="w-10 h-10 mx-auto mb-2 bg-[#d4a27f]/10 rounded-lg flex items-center justify-center">
                            <span className="text-[#d4a27f] font-bold">C</span>
                        </div>
                        <h4 className="font-semibold text-foreground">Anthropic</h4>
                        <p className="text-xs text-foreground-secondary mt-1">Claude 3.5, Claude 3</p>
                    </div>
                    <div className="bg-background-secondary p-4 rounded-xl border border-border text-center">
                        <div className="w-10 h-10 mx-auto mb-2 bg-[#6366f1]/10 rounded-lg flex items-center justify-center">
                            <span className="text-[#6366f1] font-bold">O</span>
                        </div>
                        <h4 className="font-semibold text-foreground">Ollama</h4>
                        <p className="text-xs text-foreground-secondary mt-1">Local server</p>
                    </div>
                    <div className="bg-background-secondary p-4 rounded-xl border border-border text-center">
                        <div className="w-10 h-10 mx-auto mb-2 bg-[#8b5cf6]/10 rounded-lg flex items-center justify-center">
                            <span className="text-[#8b5cf6] font-bold">+</span>
                        </div>
                        <h4 className="font-semibold text-foreground">OpenAI Spec</h4>
                        <p className="text-xs text-foreground-secondary mt-1">Custom endpoints</p>
                    </div>
                    <div className="bg-background-secondary p-4 rounded-xl border border-border text-center">
                        <div className="w-10 h-10 mx-auto mb-2 bg-[#0668E1]/10 rounded-lg flex items-center justify-center">
                            <span className="text-[#0668E1] font-bold">E</span>
                        </div>
                        <h4 className="font-semibold text-foreground">ExecuTorch</h4>
                        <p className="text-xs text-foreground-secondary mt-1">On-device (.pte)</p>
                    </div>
                    <div className="bg-background-secondary p-4 rounded-xl border border-border text-center">
                        <div className="w-10 h-10 mx-auto mb-2 bg-[#FF6B35]/10 rounded-lg flex items-center justify-center">
                            <span className="text-[#FF6B35] font-bold">L</span>
                        </div>
                        <h4 className="font-semibold text-foreground">Llama.cpp</h4>
                        <p className="text-xs text-foreground-secondary mt-1">On-device (.gguf)</p>
                    </div>
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
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Tablet</h3>
                        <p className="text-foreground-secondary text-sm">
                            Optimized layout for larger screens with full feature support.
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
                                To use local models or connect to a local Ollama server, please use our <strong>Android</strong> application.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold mb-6 text-foreground">Data &amp; Privacy</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <ul className="space-y-4 text-foreground-secondary">
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span><strong>Local Storage</strong> - All conversations and settings are stored on your device using WatermelonDB</span>
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

            <section>
                <h2 className="text-3xl font-bold mb-6 text-foreground">Need Help?</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/faq" className="block bg-background-secondary p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                        <h3 className="text-xl font-semibold mb-2">FAQ</h3>
                        <p className="text-foreground-secondary">Common questions and answers about LLM Hub.</p>
                    </Link>
                    <a href="https://github.com/HarshalKudale/lmhub/issues" target="_blank" rel="noopener noreferrer" className="block bg-background-secondary p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                        <h3 className="text-xl font-semibold mb-2">Report Issues</h3>
                        <p className="text-foreground-secondary">Found a bug? Report it on GitHub.</p>
                    </a>
                </div>
            </section>
        </div>
    );
}
