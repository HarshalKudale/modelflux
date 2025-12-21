import { PersonaEditorScreen } from '@/src/ui/screens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function PersonaEditorPage() {
    const router = useRouter();
    const params = useLocalSearchParams<{ personaId?: string }>();

    return (
        <PersonaEditorScreen
            personaId={params.personaId}
            onBack={() => router.back()}
        />
    );
}
