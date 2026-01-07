export default function LocalModelsPage() {
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold mb-6 text-foreground">Local Models</h1>
            <p className="text-xl text-foreground-secondary mb-8">
                Run AI models directly on your device. No internet required, complete privacy.
            </p>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-12">
                <p className="text-foreground-secondary">
                    <strong className="text-blue-600 dark:text-blue-400">Platform Note:</strong> Local models are only available on the Android app. The web version does not support on-device inference.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Supported Formats</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                                <span className="font-bold text-sm">.pte</span>
                            </div>
                            <h3 className="text-xl font-semibold text-foreground">ExecuTorch</h3>
                        </div>
                        <p className="text-foreground-secondary mb-4">
                            Meta&apos;s optimized format for mobile inference. Best performance on newer devices with NPU/GPU acceleration.
                        </p>
                        <ul className="text-sm text-foreground-secondary space-y-2">
                            <li>• Optimized for mobile hardware</li>
                            <li>• Smaller file sizes</li>
                            <li>• Hardware acceleration support</li>
                        </ul>
                    </div>

                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                                <span className="font-bold text-sm">.gguf</span>
                            </div>
                            <h3 className="text-xl font-semibold text-foreground">Llama.cpp</h3>
                        </div>
                        <p className="text-foreground-secondary mb-4">
                            Popular format with wide model availability. Excellent compatibility and community support.
                        </p>
                        <ul className="text-sm text-foreground-secondary space-y-2">
                            <li>• Wide model selection</li>
                            <li>• Quantization options (Q4, Q5, Q8)</li>
                            <li>• Active community support</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Getting Models</h2>

                <div className="space-y-6">
                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-semibold mb-3 text-foreground">Download from HuggingFace</h3>
                        <p className="text-foreground-secondary mb-4">
                            Browse and download models directly within the app.
                        </p>
                        <div className="bg-background p-4 rounded-lg border border-border">
                            <ol className="list-decimal list-inside text-foreground-secondary space-y-2 text-sm">
                                <li>Go to Settings → Models</li>
                                <li>Tap &quot;Download Model&quot;</li>
                                <li>Search for a model on HuggingFace</li>
                                <li>Select the model variant (size/quantization)</li>
                                <li>Wait for download to complete</li>
                            </ol>
                        </div>
                    </div>

                    <div className="bg-background-secondary p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-semibold mb-3 text-foreground">Import Local Files</h3>
                        <p className="text-foreground-secondary mb-4">
                            Import models you&apos;ve already downloaded.
                        </p>
                        <div className="bg-background p-4 rounded-lg border border-border">
                            <ol className="list-decimal list-inside text-foreground-secondary space-y-2 text-sm">
                                <li>Go to Settings → Models</li>
                                <li>Tap &quot;Import Model&quot;</li>
                                <li>Select the .pte or .gguf file</li>
                                <li>Optionally add tokenizer files</li>
                                <li>Give the model a name and save</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Recommended Models</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-2 text-foreground">Model</th>
                                <th className="text-left py-2 text-foreground">Size</th>
                                <th className="text-left py-2 text-foreground">Best For</th>
                            </tr>
                        </thead>
                        <tbody className="text-foreground-secondary">
                            <tr className="border-b border-border">
                                <td className="py-3">Llama 3.2 1B</td>
                                <td className="py-3">~1GB</td>
                                <td className="py-3">Quick responses, older devices</td>
                            </tr>
                            <tr className="border-b border-border">
                                <td className="py-3">Llama 3.2 3B</td>
                                <td className="py-3">~2GB</td>
                                <td className="py-3">Balance of speed and quality</td>
                            </tr>
                            <tr className="border-b border-border">
                                <td className="py-3">Phi-3 Mini</td>
                                <td className="py-3">~2GB</td>
                                <td className="py-3">Reasoning tasks</td>
                            </tr>
                            <tr>
                                <td className="py-3">Qwen2.5 3B</td>
                                <td className="py-3">~2GB</td>
                                <td className="py-3">Multilingual support</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">Using Local Models</h2>

                <div className="bg-background-secondary p-6 rounded-xl border border-border">
                    <ol className="list-decimal list-inside text-foreground-secondary space-y-3">
                        <li>Once a model is downloaded/imported, it appears in the model picker</li>
                        <li>Start a new conversation and select the local model</li>
                        <li>The model will load automatically (first load may take a moment)</li>
                        <li>Chat as normal - all processing happens on your device</li>
                    </ol>
                </div>
            </section>
        </div>
    );
}
