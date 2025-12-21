import { MCPEditorScreen } from '@/src/ui/screens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function MCPEditorPage() {
    const router = useRouter();
    const params = useLocalSearchParams<{ serverId?: string }>();

    return (
        <MCPEditorScreen
            serverId={params.serverId}
            onBack={() => router.back()}
        />
    );
}
