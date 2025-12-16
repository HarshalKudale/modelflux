import { LLMManagementScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import React from 'react';

export default function LLMManagementPage() {
    const router = useRouter();

    return (
        <LLMManagementScreen
            onNavigate={(screen, params) => {
                if (screen === 'llm-editor') {
                    const query = params?.configId
                        ? `?configId=${params.configId}`
                        : params?.provider
                            ? `?provider=${params.provider}`
                            : '';
                    router.push(`/llm-editor${query}` as any);
                }
            }}
            onBack={() => router.back()}
        />
    );
}
