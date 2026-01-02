export default function PersonasPage() {
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold mb-6 text-foreground">Personas</h1>
            <p className="text-xl text-foreground-secondary mb-8">
                Create custom AI personalities with system prompts for different use cases.
            </p>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">What are Personas?</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <p className="text-foreground-secondary mb-4">
                        Personas are pre-configured AI personalities defined by system prompts. They shape how the AI responds, including its tone, expertise, and behavior.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-background p-4 rounded-lg border border-border">
                            <h4 className="font-semibold text-foreground mb-2">Example: Code Review</h4>
                            <p className="text-foreground-secondary text-sm">A persona focused on reviewing code, suggesting improvements, and explaining best practices.</p>
                        </div>
                        <div className="bg-background p-4 rounded-lg border border-border">
                            <h4 className="font-semibold text-foreground mb-2">Example: Writing Assistant</h4>
                            <p className="text-foreground-secondary text-sm">A persona that helps with writing, editing, and improving text clarity and style.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Creating a Persona</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <ol className="list-decimal list-inside text-foreground-secondary space-y-3">
                        <li>Go to <strong>Settings → Manage Personas</strong></li>
                        <li>Tap <strong>&quot;Add Persona&quot;</strong></li>
                        <li>Enter a <strong>name</strong> for your persona (e.g., &quot;Code Reviewer&quot;)</li>
                        <li>Write a <strong>system prompt</strong> that defines the AI&apos;s behavior</li>
                        <li>Optionally add a <strong>description</strong> to remind yourself of its purpose</li>
                        <li>Save the persona</li>
                    </ol>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Writing Effective System Prompts</h2>

                <div className="space-y-6">
                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-semibold mb-4 text-foreground">Tips for Good Prompts</h3>
                        <ul className="space-y-3 text-foreground-secondary">
                            <li className="flex items-start gap-3">
                                <span className="text-primary font-bold">1.</span>
                                <span><strong>Be specific:</strong> Clearly define the role and expertise</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary font-bold">2.</span>
                                <span><strong>Set the tone:</strong> Describe how formal or casual responses should be</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary font-bold">3.</span>
                                <span><strong>Define constraints:</strong> Specify what the AI should or shouldn&apos;t do</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary font-bold">4.</span>
                                <span><strong>Add context:</strong> Include relevant background if needed</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-semibold mb-4 text-foreground">Example Prompts</h3>

                        <div className="space-y-4">
                            <div className="bg-background p-4 rounded-lg border border-border">
                                <h4 className="font-semibold text-foreground mb-2">Code Reviewer</h4>
                                <p className="text-foreground-secondary text-sm font-mono bg-background-tertiary p-3 rounded">
                                    You are an experienced software engineer conducting code reviews. Focus on code quality, potential bugs, performance issues, and best practices. Be constructive and explain your suggestions clearly. When possible, provide code examples of improvements.
                                </p>
                            </div>

                            <div className="bg-background p-4 rounded-lg border border-border">
                                <h4 className="font-semibold text-foreground mb-2">Writing Editor</h4>
                                <p className="text-foreground-secondary text-sm font-mono bg-background-tertiary p-3 rounded">
                                    You are a professional editor helping with writing improvement. Focus on clarity, conciseness, and engaging prose. Suggest specific edits and explain why they improve the text. Maintain the author&apos;s voice while enhancing readability.
                                </p>
                            </div>

                            <div className="bg-background p-4 rounded-lg border border-border">
                                <h4 className="font-semibold text-foreground mb-2">Socratic Tutor</h4>
                                <p className="text-foreground-secondary text-sm font-mono bg-background-tertiary p-3 rounded">
                                    You are a patient tutor who uses the Socratic method. Instead of giving direct answers, ask guiding questions to help the student discover the answer themselves. Provide hints when they&apos;re stuck, and celebrate their insights.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Using Personas</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <h3 className="text-xl font-semibold mb-4 text-foreground">In Conversations</h3>
                    <ol className="list-decimal list-inside text-foreground-secondary space-y-2">
                        <li>When creating a new conversation, you can select a persona</li>
                        <li>The persona&apos;s system prompt is applied to the conversation</li>
                        <li>All messages in that conversation use the persona&apos;s context</li>
                    </ol>
                    <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <p className="text-sm text-foreground-secondary">
                            <strong className="text-yellow-600 dark:text-yellow-400">Note:</strong> Once a conversation is created with a persona, the persona cannot be changed. This ensures consistent behavior throughout the conversation.
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">Managing Personas</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <ul className="space-y-3 text-foreground-secondary">
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span><strong>Edit:</strong> Update the name, description, or system prompt</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span><strong>Delete:</strong> Remove personas you no longer need (existing conversations keep their prompts)</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span><strong>Duplicate:</strong> Create a copy to iterate on a persona without losing the original</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}
