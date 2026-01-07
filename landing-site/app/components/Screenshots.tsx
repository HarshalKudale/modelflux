'use client';

export function Screenshots() {
    const screenshots = [
        {
            title: 'Chat Interface',
            description: 'Clean, intuitive chat UI with markdown rendering, code highlighting, and thinking mode visualization',
            platform: 'Android',
        },
        {
            title: 'Model Selection',
            description: 'Switch between providers and models seamlessly mid-conversation',
            platform: 'Tablet',
        },
        {
            title: 'Local Models',
            description: 'Download and manage on-device AI models with progress tracking',
            platform: 'Android',
        },
        {
            title: 'RAG Documents',
            description: 'Add PDFs and documents for context-aware AI responses',
            platform: 'Web',
        },
        {
            title: 'Provider Settings',
            description: 'Configure multiple LLM providers with API keys and custom settings',
            platform: 'Tablet',
        },
        {
            title: 'Personas',
            description: 'Create custom AI personalities with system prompts',
            platform: 'Web',
        },
    ];

    const platformColors: Record<string, string> = {
        'Android': '#3DDC84',
        'Tablet': '#6366F1',
        'Web': '#8B5CF6',
    };

    return (
        <section id="screenshots" className="py-24 bg-background-secondary px-4">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground animate-fade-in-up">
                        See It In Action
                    </h2>
                    <p className="text-xl text-foreground-secondary max-w-2xl mx-auto animate-fade-in-up stagger-1">
                        Beautiful, intuitive interface across Android, Tablet, and Web
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {screenshots.map((screenshot, idx) => (
                        <div
                            key={idx}
                            className={`animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}
                        >
                            {/* Image Placeholder */}
                            <div className="img-placeholder aspect-[9/16] md:aspect-[4/5] rounded-2xl mb-4 p-6 hover-card">
                                <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl">
                                    <svg className="w-12 h-12 text-foreground-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-foreground-muted text-center font-medium text-sm">{screenshot.title}</p>
                                    <p className="text-foreground-muted/60 text-xs text-center mt-1">{screenshot.platform} Screenshot</p>
                                </div>
                            </div>

                            {/* Platform Badge */}
                            <div className="flex items-center gap-2 mb-2">
                                <span
                                    className="px-2 py-0.5 text-xs font-medium rounded-full"
                                    style={{
                                        backgroundColor: `${platformColors[screenshot.platform]}20`,
                                        color: platformColors[screenshot.platform],
                                    }}
                                >
                                    {screenshot.platform}
                                </span>
                            </div>

                            {/* Title & Description */}
                            <h3 className="text-lg font-semibold text-foreground mb-1">{screenshot.title}</h3>
                            <p className="text-sm text-foreground-secondary">{screenshot.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
