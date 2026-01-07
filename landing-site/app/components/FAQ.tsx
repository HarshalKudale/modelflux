'use client';

import { useState } from 'react';

const faqs = [
    {
        question: 'What is LLM Hub?',
        answer: 'LLM Hub is an open-source, cross-platform AI chat application that lets you interact with various Large Language Models. You can use cloud providers like OpenAI and Anthropic, connect to local servers like Ollama, or run models directly on your device using ExecuTorch or Llama.cpp.',
    },
    {
        question: 'Is LLM Hub free to use?',
        answer: 'Yes, LLM Hub is completely free and open source. You only pay for the API usage if you use cloud providers like OpenAI or Anthropic directly. Local models and Ollama are completely free.',
    },
    {
        question: 'Can I run AI models without internet?',
        answer: 'Absolutely! On Android devices, you can download and run local models using ExecuTorch (.pte) or Llama.cpp (.gguf). Once downloaded, these models work completely offline with no internet required.',
    },
    {
        question: 'What platforms are supported?',
        answer: 'LLM Hub supports Android, and Web platforms. The native Android app has full support including local on-device models. The Web version supports remote providers (OpenAI, Anthropic, Ollama). iOS support is coming soon.',
    },
    {
        question: 'Is my data private?',
        answer: 'Yes! All your conversations and settings are stored locally on your device. We don\'t collect any analytics or usage data. When using cloud providers, your data goes directly to their APIs - we never store or intercept it.',
    },
    {
        question: 'What is RAG and how does it work?',
        answer: 'RAG (Retrieval-Augmented Generation) lets you add documents (PDFs, text files) to your conversations. The app extracts and embeds the content, then uses it to provide context-aware responses. This works with both local and cloud models.',
    },
    {
        question: 'What are Personas?',
        answer: 'Personas are custom AI personalities you can create with system prompts. Based on the Character Card V2 specification, they let you customize how the AI responds - from helpful assistants to specialized experts or creative characters.',
    },
    {
        question: 'How do I add a new LLM provider?',
        answer: 'Go to Settings > LLM Providers > Add Provider. Choose from OpenAI, Anthropic, Ollama, or OpenAI-Compatible (for services like LM Studio, Together AI, etc.). Enter your API key and base URL as needed.',
    },
    {
        question: 'Can I switch models mid-conversation?',
        answer: 'Yes! You can change the LLM provider or model at any point during a conversation. Previous messages are preserved, and future responses will use the newly selected model.',
    },
    {
        question: 'How do I export my conversations?',
        answer: 'Go to Settings > Data Management > Export Data. Your conversations, personas, and settings will be exported as a JSON file that you can import later or use as a backup.',
    },
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-24 bg-background px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground animate-fade-in-up">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-xl text-foreground-secondary max-w-2xl mx-auto animate-fade-in-up stagger-1">
                        Everything you need to know about LLM Hub
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <div
                            key={idx}
                            className={`glass rounded-xl overflow-hidden animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left"
                            >
                                <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                                <svg
                                    className={`w-5 h-5 text-foreground-secondary flex-shrink-0 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div
                                className={`px-6 transition-all duration-300 ease-out ${openIndex === idx ? 'pb-5 max-h-96' : 'max-h-0 overflow-hidden'}`}
                            >
                                <p className="text-foreground-secondary leading-relaxed">{faq.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
