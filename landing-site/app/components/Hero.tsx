'use client';

import Link from 'next/link';
import { InstallButtons } from './InstallButtons';

export function Hero() {
    return (
        <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 py-20 overflow-hidden text-center">
            {/* Background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl -z-10 opacity-30">
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-[100px] animate-float" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-hover rounded-full blur-[100px] animate-float stagger-2" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/50 rounded-full blur-[120px]" />
            </div>

            <div className="space-y-8 max-w-4xl z-10">
                {/* Badge */}
                <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-border bg-background-secondary/50 backdrop-blur-sm animate-fade-in-up">
                    <span className="relative flex h-2 w-2 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="text-sm font-medium text-foreground-secondary">
                        Local AI. Private. Powerful.
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-fade-in-up stagger-1">
                    <span className="bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground-muted">
                        Your Private LLM
                    </span>
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-hover animate-gradient">
                        Workspace
                    </span>
                </h1>

                {/* Description */}
                <p className="text-xl md:text-2xl text-foreground-secondary max-w-2xl mx-auto animate-fade-in-up stagger-2">
                    Chat with local models, multiple providers, and keep your data on your device.
                    Experience the future of personal AI.
                </p>

                {/* Install Buttons */}
                <div className="pt-4 animate-fade-in-up stagger-3">
                    <InstallButtons />
                </div>

                {/* Secondary Links */}
                <div className="flex flex-wrap gap-6 justify-center pt-4 animate-fade-in-up stagger-4">
                    <Link
                        href="/docs"
                        className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Documentation
                    </Link>
                    <Link
                        href="/models"
                        className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Browse Models
                    </Link>
                    <a
                        href="https://github.com/HarshalKudale/lmhub"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        View on GitHub
                    </a>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <svg className="w-6 h-6 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>
        </section>
    );
}
