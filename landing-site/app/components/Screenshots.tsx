'use client';

import { useState } from 'react';

type Platform = 'android' | 'ios' | 'web';

export function Screenshots() {
    const [activePlatform, setActivePlatform] = useState<Platform>('android');

    const screenshots = {
        android: [
            { name: 'Home Screen', placeholder: 'Android Home' },
            { name: 'Chat Interface', placeholder: 'Android Chat' },
            { name: 'Settings', placeholder: 'Android Settings' }
        ],
        ios: [
            { name: 'Home Screen', placeholder: 'iOS Home' },
            { name: 'Chat Interface', placeholder: 'iOS Chat' },
            { name: 'Settings', placeholder: 'iOS Settings' }
        ],
        web: [
            { name: 'Dashboard', placeholder: 'Web Dashboard' },
            { name: 'Chat View', placeholder: 'Web Chat View' },
            { name: 'Configuration', placeholder: 'Web Config' }
        ]
    };

    return (
        <section id="screenshots" className="py-24 bg-background-secondary relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary-hover/5 rounded-full blur-[120px]" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">Experience LLM Hub</h2>
                    <p className="text-xl text-foreground-secondary">Beautifully designed for every platform.</p>
                </div>

                <div className="flex justify-center mb-12">
                    <div className="inline-flex bg-background p-1 rounded-full border border-border shadow-sm">
                        {(['android', 'ios', 'web'] as Platform[]).map((platform) => (
                            <button
                                key={platform}
                                onClick={() => setActivePlatform(platform)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 capitalize ${activePlatform === platform
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-foreground-secondary hover:text-foreground'
                                    }`}
                            >
                                {platform}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {screenshots[activePlatform].map((shot, idx) => (
                        <div
                            key={idx}
                            className="group relative aspect-[9/16] md:aspect-[9/18] bg-background-tertiary rounded-3xl overflow-hidden shadow-2xl border-4 border-background"
                        >
                            {/* Placeholder Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-background-secondary to-background">
                                <div className="w-16 h-16 mb-4 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">{shot.name}</h3>
                                <p className="text-sm text-foreground-muted mt-2">Replace with screenshot: {shot.placeholder}</p>
                                <div className="mt-4 px-3 py-1 bg-border rounded text-xs font-mono text-foreground-secondary">
                                    /public/screenshots/{activePlatform}/{idx + 1}.png
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
