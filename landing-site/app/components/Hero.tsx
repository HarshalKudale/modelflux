'use client';

import Link from 'next/link';

export function Hero() {
    return (
        <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 py-20 overflow-hidden text-center">
            {/* Background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl -z-10 opacity-30">
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-[100px]" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-hover rounded-full blur-[100px]" />
            </div>

            <div className="space-y-6 max-w-4xl z-10">
                <div className="inline-flex items-center px-3 py-1 rounded-full border border-border bg-background-secondary/50 backdrop-blur-sm">
                    <span className="text-sm font-medium text-foreground-secondary">
                        Local AI. Private. Powerful.
                    </span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground-muted">
                    Your Private LLM <br />
                    <span className="text-primary">Workspace</span>
                </h1>

                <p className="text-xl md:text-2xl text-foreground-secondary max-w-2xl mx-auto">
                    Chat with local models, multiple providers, and keep your data on your device.
                    Experience the future of personal AI.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <Link
                        href="/app"
                        className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-primary hover:bg-primary-hover rounded-full transition-all shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95"
                    >
                        Open App
                    </Link>
                    <Link
                        href="/docs"
                        className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-foreground bg-background-secondary hover:bg-background-tertiary rounded-full border border-border transition-all hover:scale-105 active:scale-95"
                    >
                        Documentation
                    </Link>
                </div>
            </div>
        </section>
    );
}
