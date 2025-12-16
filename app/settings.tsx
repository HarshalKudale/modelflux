import { SettingsScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import React from 'react';

export default function SettingsPage() {
    const router = useRouter();

    return (
        <SettingsScreen
            onNavigate={(screen) => {
                router.push(`/${screen}`);
            }}
            onBack={() => router.back()}
        />
    );
}
