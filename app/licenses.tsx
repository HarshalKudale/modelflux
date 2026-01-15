import { LicensesScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import React from 'react';

export default function LicensesPage() {
    const router = useRouter();

    return (
        <LicensesScreen
            onBack={() => router.back()}
        />
    );
}
