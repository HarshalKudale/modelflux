import { WelcomeScreen } from '@/src/ui/screens/WelcomeScreen.native';
import { useRouter } from 'expo-router';
import React from 'react';

export default function WelcomePage() {
    const router = useRouter();

    return (
        <WelcomeScreen
            onComplete={() => {
                // Navigate to main app
                router.replace('/(tabs)');
            }}
        />
    );
}
