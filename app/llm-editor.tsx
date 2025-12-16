import { LLMProvider } from '@/src/core/types';
import { LLMEditorScreen } from '@/src/ui/screens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function LLMEditorPage() {
    const router = useRouter();
    const params = useLocalSearchParams<{ configId?: string; provider?: string }>();

    return (
        <LLMEditorScreen
            configId={params.configId}
            presetProvider={params.provider as LLMProvider | undefined}
            onBack={() => router.back()}
        />
    );
}
