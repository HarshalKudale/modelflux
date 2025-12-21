import { MCPListScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import React from 'react';

export default function MCPListPage() {
    const router = useRouter();

    return (
        <MCPListScreen
            onNavigate={(screen, params) => {
                if (screen === 'mcp-editor') {
                    const query = params?.serverId
                        ? `?serverId=${params.serverId}`
                        : '';
                    router.push(`/mcp-editor${query}` as any);
                }
            }}
            onBack={() => router.back()}
        />
    );
}
