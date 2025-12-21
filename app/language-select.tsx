import { LanguageSelectScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import React from 'react';

export default function LanguageSelectPage() {
    const router = useRouter();

    return (
        <LanguageSelectScreen
            onBack={() => router.back()}
        />
    );
}
