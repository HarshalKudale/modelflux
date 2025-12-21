import { SettingsScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import React from 'react';

export default function SettingsPage() {
    const router = useRouter();

    return (
        <SettingsScreen
            onNavigate={(screen, params) => {
                let path = `/${screen}`;
                if (params) {
                    const queryString = Object.entries(params)
                        .map(([key, value]) => `${key}=${value}`)
                        .join('&');
                    if (queryString) {
                        path += `?${queryString}`;
                    }
                }
                router.push(path as any);
            }}
            onBack={() => router.back()}
        />
    );
}
