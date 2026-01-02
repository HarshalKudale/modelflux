import Link from 'next/link';

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-background-secondary border-r border-border md:h-screen md:sticky md:top-0 overflow-y-auto">
                <div className="p-6">
                    <Link href="/" className="text-xl font-bold text-foreground mb-8 block">
                        LLM Hub Docs
                    </Link>

                    <nav className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-2">Getting Started</h3>
                            <ul className="space-y-1">
                                <li>
                                    <Link href="/docs" className="block px-3 py-2 text-sm text-foreground hover:bg-background rounded-md transition-colors font-medium">
                                        Overview
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-2">Providers</h3>
                            <ul className="space-y-1">
                                <li>
                                    <Link href="/docs/providers" className="block px-3 py-2 text-sm text-foreground-secondary hover:text-foreground hover:bg-background rounded-md transition-colors">
                                        LLM Providers
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/docs/local-models" className="block px-3 py-2 text-sm text-foreground-secondary hover:text-foreground hover:bg-background rounded-md transition-colors">
                                        Local Models
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-2">Features</h3>
                            <ul className="space-y-1">
                                <li>
                                    <Link href="/docs/rag" className="block px-3 py-2 text-sm text-foreground-secondary hover:text-foreground hover:bg-background rounded-md transition-colors">
                                        RAG & Sources
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/docs/personas" className="block px-3 py-2 text-sm text-foreground-secondary hover:text-foreground hover:bg-background rounded-md transition-colors">
                                        Personas
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-2">Reference</h3>
                            <ul className="space-y-1">
                                <li>
                                    <Link href="/docs#web-limitations" className="block px-3 py-2 text-sm text-foreground-secondary hover:text-foreground hover:bg-background rounded-md transition-colors">
                                        Web Limitations
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </nav>

                    <div className="mt-8 pt-6 border-t border-border">
                        <Link href="/app" className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md transition-colors">
                            Launch App
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    {children}
                </div>
            </main>
        </div>
    );
}
