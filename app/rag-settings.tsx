import { RAGSettingsScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import React from 'react';

export default function RAGSettingsPage() {
    const router = useRouter();

    return (
        <RAGSettingsScreen
            onBack={() => router.back()}
        />
    );
}
