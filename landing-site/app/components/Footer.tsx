'use client';

import Link from 'next/link';

export function Footer() {
    return (
        <footer className="border-t border-border bg-background-secondary py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="text-2xl font-bold text-foreground mb-4 block">
                            LLM Hub
                        </Link>
                        <p className="text-foreground-secondary max-w-sm mb-6">
                            Your private, local AI workspace. Chat with the best models directly on your device.
                        </p>
                        {/* Contact Button */}
                        <a
                            href="mailto:contact@llmhub.app"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-full transition-colors btn-hover"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Contact Us
                        </a>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Product</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/#features" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="/models" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    Models
                                </Link>
                            </li>
                            <li>
                                <Link href="/app" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    Web App
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Resources</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/docs" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/providers" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    Providers Guide
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/local-models" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    Local Models
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/rag" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    RAG Guide
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* External Links */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Community</h3>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="https://github.com/HarshalKudale/lmhub"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                    </svg>
                                    GitHub
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://huggingface.co/software-mansion"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                    </svg>
                                    HuggingFace
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/software-mansion/react-native-executorch"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    ExecuTorch RN
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://ollama.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    Ollama
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-foreground-muted">
                        © 2026 LLM Hub. Open source under MIT License.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
