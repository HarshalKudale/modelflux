'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { href: '/docs', label: 'Docs' },
        { href: '/models', label: 'Models' },
        { href: '/faq', label: 'FAQ' },
        { href: '#about', label: 'About' },
    ];

    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-hover">
                    LLM Hub
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-4">
                    <a
                        href="https://github.com/HarshalKudale/lmhub"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground-secondary hover:text-foreground transition-colors"
                        aria-label="GitHub"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                    </a>
                    <Link
                        href="/app"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-full transition-colors btn-hover"
                    >
                        Open App
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-foreground-secondary hover:text-foreground"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl animate-fade-in">
                    <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-foreground-secondary hover:text-foreground transition-colors py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <hr className="border-border" />
                        <Link
                            href="/app"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-full transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Open App
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
