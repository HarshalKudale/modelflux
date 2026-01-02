'use client';

import Link from 'next/link';

export function Navbar() {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-hover">
                    LLM Hub
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/docs" className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors">
                        Documentation
                    </Link>
                    <Link href="#features" className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors">
                        Features
                    </Link>
                    <Link href="#screenshots" className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors">
                        Screenshots
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link
                        href="/app"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-full transition-colors"
                    >
                        Open App
                    </Link>
                </div>
            </div>
        </header>
    );
}
