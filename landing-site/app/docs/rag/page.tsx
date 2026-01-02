export default function RAGPage() {
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold mb-6 text-foreground">RAG & Sources</h1>
            <p className="text-xl text-foreground-secondary mb-8">
                Add documents to your conversations for context-aware AI responses.
            </p>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">What is RAG?</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <p className="text-foreground-secondary mb-4">
                        <strong>Retrieval-Augmented Generation (RAG)</strong> allows the AI to reference your documents when answering questions. Instead of relying only on its training data, the model can find and cite relevant information from your files.
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-lg border border-border">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>PDF files</span>
                        </div>
                        <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-lg border border-border">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Text files</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Setting Up RAG</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <h3 className="text-xl font-semibold mb-4 text-foreground">Configure a RAG Provider</h3>
                    <p className="text-foreground-secondary mb-4">
                        RAG requires an embedding model to understand your documents. Configure this first:
                    </p>
                    <ol className="list-decimal list-inside text-foreground-secondary space-y-2 text-sm">
                        <li>Go to Settings → Manage RAG Providers</li>
                        <li>Add a new RAG provider</li>
                        <li>Select an embedding model (local or remote)</li>
                        <li>Save the configuration</li>
                    </ol>
                    <div className="mt-4 bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <p className="text-sm text-foreground-secondary">
                            <strong className="text-primary">Tip:</strong> For best privacy, use a local embedding model. It processes documents entirely on your device.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Adding Sources</h2>

                <div className="space-y-6">
                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-semibold mb-3 text-foreground">Add Documents to a Conversation</h3>
                        <ol className="list-decimal list-inside text-foreground-secondary space-y-2">
                            <li>Open or create a conversation</li>
                            <li>Tap the &quot;+&quot; button next to the message input</li>
                            <li>Select &quot;Add Sources&quot;</li>
                            <li>Choose files from your device</li>
                            <li>Wait for processing to complete</li>
                        </ol>
                    </div>

                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-semibold mb-3 text-foreground">Managing Sources</h3>
                        <p className="text-foreground-secondary mb-4">
                            You can manage sources for each conversation:
                        </p>
                        <ul className="list-disc list-inside text-foreground-secondary space-y-2">
                            <li><strong>View Sources:</strong> See all documents attached to the conversation</li>
                            <li><strong>Remove Sources:</strong> Detach documents you no longer need</li>
                            <li><strong>Reprocess:</strong> Re-index documents if the embedding model changes</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">How It Works</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold flex-shrink-0">1</div>
                            <div>
                                <h4 className="font-semibold text-foreground">Document Processing</h4>
                                <p className="text-foreground-secondary text-sm">Your documents are split into chunks and converted into embeddings (numerical representations).</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold flex-shrink-0">2</div>
                            <div>
                                <h4 className="font-semibold text-foreground">Query Matching</h4>
                                <p className="text-foreground-secondary text-sm">When you send a message, LLM Hub finds the most relevant document chunks based on semantic similarity.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold flex-shrink-0">3</div>
                            <div>
                                <h4 className="font-semibold text-foreground">Context Injection</h4>
                                <p className="text-foreground-secondary text-sm">Relevant chunks are included in the AI&apos;s context, allowing it to reference your documents in its response.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">Best Practices</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <ul className="space-y-3 text-foreground-secondary">
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Use clear, well-formatted documents for best results</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Ask specific questions that relate to your documents</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Smaller, focused documents often work better than large files</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Keep related documents in the same conversation for coherent context</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}
