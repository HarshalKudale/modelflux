import { RAGProvider } from '@/src/core/types';
import { RAGProviderEditorScreen } from '@/src/ui/screens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function RAGProviderEditorPage() {
    const router = useRouter();
    const { id, provider } = useLocalSearchParams<{ id?: string; provider?: RAGProvider }>();

    return (
        <RAGProviderEditorScreen
            configId={id}
            provider={provider}
            onBack={() => router.back()}
        />
    );
}
