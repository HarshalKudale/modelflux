'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AppRedirect() {
    const router = useRouter();

    useEffect(() => {
        // In a real deployment, this would be handled by rewrites or a separate app.
        // For now, we just show a message or could redirect to the actual production URL if known.
        // console.log("Redirecting to app...");
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Launching LLM Hub...</h1>
                <p className="text-foreground-secondary">
                    In production, this path (/app) loads the main web application.
                </p>
                <div className="mt-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        </div>
    );
}
