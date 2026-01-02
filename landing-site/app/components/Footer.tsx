'use client';

import Link from 'next/link';

export function Footer() {
    return (
        <footer className="border-t border-border bg-background-secondary py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="text-xl font-bold text-foreground mb-4 block">
                            LLM Hub
                        </Link>
                        <p className="text-foreground-secondary max-w-sm">
                            Your private, local AI workspace. Chat with the best models directly on your device.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="#features" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="#screenshots" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    Screenshots
                                </Link>
                            </li>
                            <li>
                                <Link href="/app" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    Web App
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Support</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/docs" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <a href="https://github.com/HarshalKudale/lmhub" target="_blank" rel="noopener noreferrer" className="text-foreground-secondary hover:text-foreground transition-colors">
                                    GitHub
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-foreground-muted">
                        © {new Date().getFullYear()} LLM Hub. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
