export default function ProvidersPage() {
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold mb-6 text-foreground">LLM Providers</h1>
            <p className="text-xl text-foreground-secondary mb-8">
                Configure cloud and local server providers to power your conversations.
            </p>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Cloud Providers</h2>

                <div className="space-y-6">
                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-semibold mb-3 text-foreground">OpenAI</h3>
                        <p className="text-foreground-secondary mb-4">
                            Access GPT-4, GPT-3.5, and other OpenAI models.
                        </p>
                        <div className="bg-background p-4 rounded-lg border border-border">
                            <h4 className="text-sm font-semibold text-foreground-secondary mb-2">Setup Steps:</h4>
                            <ol className="list-decimal list-inside text-foreground-secondary space-y-1 text-sm">
                                <li>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Platform</a></li>
                                <li>Go to Settings → Manage LLM Providers → Add Provider</li>
                                <li>Select &quot;OpenAI&quot; as the provider type</li>
                                <li>Enter your API key and save</li>
                            </ol>
                        </div>
                    </div>

                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-semibold mb-3 text-foreground">Anthropic</h3>
                        <p className="text-foreground-secondary mb-4">
                            Access Claude models including Claude 3.5 Sonnet, Claude 3 Opus, and more.
                        </p>
                        <div className="bg-background p-4 rounded-lg border border-border">
                            <h4 className="text-sm font-semibold text-foreground-secondary mb-2">Setup Steps:</h4>
                            <ol className="list-decimal list-inside text-foreground-secondary space-y-1 text-sm">
                                <li>Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Anthropic Console</a></li>
                                <li>Go to Settings → Manage LLM Providers → Add Provider</li>
                                <li>Select &quot;Anthropic&quot; as the provider type</li>
                                <li>Enter your API key and save</li>
                            </ol>
                        </div>
                    </div>

                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-semibold mb-3 text-foreground">OpenAI-Compatible APIs</h3>
                        <p className="text-foreground-secondary mb-4">
                            Connect to any service that implements the OpenAI API format, such as LM Studio, Together AI, or Groq.
                        </p>
                        <div className="bg-background p-4 rounded-lg border border-border">
                            <h4 className="text-sm font-semibold text-foreground-secondary mb-2">Setup Steps:</h4>
                            <ol className="list-decimal list-inside text-foreground-secondary space-y-1 text-sm">
                                <li>Go to Settings → Manage LLM Providers → Add Provider</li>
                                <li>Select &quot;OpenAI Spec&quot; as the provider type</li>
                                <li>Enter the base URL of your API endpoint</li>
                                <li>Add your API key if required</li>
                                <li>Specify a default model name</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Local Server Providers</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <h3 className="text-xl font-semibold mb-3 text-foreground">Ollama</h3>
                    <p className="text-foreground-secondary mb-4">
                        Connect to a locally running Ollama server for privacy and offline use.
                    </p>
                    <div className="bg-background p-4 rounded-lg border border-border mb-4">
                        <h4 className="text-sm font-semibold text-foreground-secondary mb-2">Prerequisites:</h4>
                        <ol className="list-decimal list-inside text-foreground-secondary space-y-1 text-sm">
                            <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ollama.ai</a></li>
                            <li>Pull a model: <code className="bg-background-tertiary px-2 py-0.5 rounded text-xs">ollama pull llama3.2</code></li>
                            <li>Ensure Ollama is running (default: http://localhost:11434)</li>
                        </ol>
                    </div>
                    <div className="bg-background p-4 rounded-lg border border-border">
                        <h4 className="text-sm font-semibold text-foreground-secondary mb-2">Setup Steps:</h4>
                        <ol className="list-decimal list-inside text-foreground-secondary space-y-1 text-sm">
                            <li>Go to Settings → Manage LLM Providers → Add Provider</li>
                            <li>Select &quot;Ollama&quot; as the provider type</li>
                            <li>Enter the server URL (default: http://localhost:11434)</li>
                            <li>Test the connection to verify it works</li>
                        </ol>
                    </div>
                    <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <p className="text-sm text-foreground-secondary">
                            <strong className="text-yellow-600 dark:text-yellow-400">Note:</strong> Ollama connection is not available in the web version due to browser CORS restrictions. Use the Android or iOS app.
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">On-Device Providers</h2>
                <p className="text-foreground-secondary mb-4">
                    For completely local, on-device inference without any server, see the <a href="/docs/local-models" className="text-primary hover:underline">Local Models</a> documentation.
                </p>
            </section>
        </div>
    );
}
