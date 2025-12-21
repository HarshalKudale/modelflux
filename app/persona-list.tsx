import { PersonaListScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import React from 'react';

export default function PersonaListPage() {
    const router = useRouter();

    return (
        <PersonaListScreen
            onNavigate={(screen, params) => {
                if (screen === 'persona-editor') {
                    const query = params?.personaId
                        ? `?personaId=${params.personaId}`
                        : '';
                    router.push(`/persona-editor${query}` as any);
                }
            }}
            onBack={() => router.back()}
        />
    );
}
