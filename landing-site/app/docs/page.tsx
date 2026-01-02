export default function DocsPage() {
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold mb-6 text-foreground">Welcome to LLM Hub</h1>
            <p className="text-xl text-foreground-secondary mb-8">
                Your private workspace for interacting with Large Language Models.
            </p>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-12">
                <h3 className="text-lg font-semibold text-primary mb-2">Quick Start</h3>
                <p className="mb-4">
                    LLM Hub connects to both local instances (like Ollama) and cloud providers (OpenAI, Anthropic).
                    No tracking. No data collection. Just you and your models.
                </p>
                <a href="/app" className="inline-flex items-center text-primary font-medium hover:underline">
                    Go to App &rarr;
                </a>
            </div>

            <hr className="my-12 border-border" />

            <section id="features" className="mb-16">
                <h2 className="text-3xl font-bold mb-6 text-foreground">Core Features</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-semibold mb-3">Multi-Provider Support</h3>
                        <p className="text-foreground-secondary">
                            Seamlessly switch between OpenAI, Anthropic, and local Ollama models in the same conversation.
                        </p>
                    </div>

                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-semibold mb-3">Local-First Storage</h3>
                        <p className="text-foreground-secondary">
                            All your chats and configurations are stored directly on your device. We don't see anything.
                        </p>
                    </div>

                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-semibold mb-3">Cross-Platform</h3>
                        <p className="text-foreground-secondary">
                            Available on iOS, Android, and Web. Your experience is consistent everywhere.
                        </p>
                    </div>
                </div>
            </section>

            <section id="web-limitations" className="mb-16">
                <h2 className="text-3xl font-bold mb-6 text-foreground">Web Support Limitations</h2>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-600 dark:text-yellow-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400 mb-2">Important Note for Web Users</h3>
                            <p className="text-foreground-secondary mb-4">
                                Due to browser security restrictions (CORS and Mixed Content), the Web version of LLM Hub
                                <strong> only supports remote providers</strong> (like OpenAI and Anthropic).
                            </p>
                            <p className="text-foreground-secondary">
                                To use local models via Ollama or Llama.cpp, please use our <strong>Desktop (Electron)</strong>, <strong>Android</strong>, or <strong>iOS</strong> applications,
                                or ensure your local server is explicitly configured to allow CORS requests from our domain.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
