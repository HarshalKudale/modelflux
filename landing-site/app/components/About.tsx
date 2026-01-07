'use client';

export function About() {
    return (
        <section id="about" className="py-24 bg-background px-4">
            <div className="container mx-auto max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <div className="space-y-6 animate-slide-in-left">
                        <h2 className="text-3xl md:text-5xl font-bold text-foreground">
                            Your AI, Your Rules
                        </h2>
                        <div className="space-y-4 text-lg text-foreground-secondary">
                            <p>
                                LLM Hub is an open-source project built with one goal: giving you complete control over your AI interactions.
                            </p>
                            <p>
                                Whether you prefer running models locally on your device for maximum privacy, or connecting to cloud providers for cutting-edge capabilities, LLM Hub provides a unified interface that works everywhere.
                            </p>
                            <p>
                                No tracking. No data collection. No compromises. Your conversations stay on your device, and your data is always under your control.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-6">
                            <div className="space-y-2">
                                <div className="text-4xl font-bold text-primary">100%</div>
                                <div className="text-foreground-secondary">Open Source</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-4xl font-bold text-primary">6+</div>
                                <div className="text-foreground-secondary">LLM Providers</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-4xl font-bold text-primary">30+</div>
                                <div className="text-foreground-secondary">Downloadable Models</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-4xl font-bold text-primary">3</div>
                                <div className="text-foreground-secondary">Platforms</div>
                            </div>
                        </div>
                    </div>

                    {/* Image Placeholder */}
                    <div className="animate-slide-in-right">
                        <div className="relative">
                            {/* Main image placeholder */}
                            <div className="img-placeholder aspect-square rounded-2xl p-8 animate-float">
                                <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl">
                                    <svg className="w-16 h-16 text-foreground-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-foreground-muted text-center font-medium">App Screenshot</p>
                                    <p className="text-foreground-muted/60 text-sm text-center mt-1">Android or Web UI preview</p>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary-hover/20 rounded-full blur-2xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
