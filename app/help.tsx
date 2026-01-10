import { HelpScreen } from '@/src/ui/screens/HelpScreen.native';
import { useRouter } from 'expo-router';
import React from 'react';

export default function HelpPage() {
    const router = useRouter();

    return (
        <HelpScreen
            onBack={() => router.back()}
        />
    );
}
