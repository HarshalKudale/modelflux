import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { MCPServer } from '../../core/types';
import { useMCPStore } from '../../state';
import { showConfirm, showError } from '../../utils/alert';
import { ResourceCard } from '../components/common';
import { useAppColorScheme, useLocale } from '../hooks';

interface MCPListScreenProps {
    onNavigate: (screen: 'mcp-editor', params?: { serverId?: string }) => void;
    onBack: () => void;
}

export function MCPListScreen({ onNavigate, onBack }: MCPListScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { servers, loadServers, deleteServer, testConnection } = useMCPStore();

    useEffect(() => {
        loadServers();
    }, []);

    const handleCreate = () => {
        onNavigate('mcp-editor');
    };

    const handleEdit = (server: MCPServer) => {
        onNavigate('mcp-editor', { serverId: server.id });
    };

    const handleTest = async (server: MCPServer): Promise<boolean> => {
        return testConnection(server.id);
    };

    const handleDelete = async (server: MCPServer) => {
        const confirmed = await showConfirm(
            t('settings.mcp.delete.title'),
            t('settings.mcp.delete.confirm', { name: server.name }),
            t('common.delete'),
            t('common.cancel'),
            true
        );

        if (confirmed) {
            try {
                await deleteServer(server.id);
            } catch (error) {
                showError(t('common.error'), error instanceof Error ? error.message : t('alert.error.default'));
            }
        }
    };

    const getServerIcon = (server: MCPServer) => (
        <Ionicons
            name={server.transport === 'http' ? 'cloud-outline' : 'terminal-outline'}
            size={22}
            color="#FFFFFF"
        />
    );

    const getTransportLabel = (server: MCPServer) => {
        return server.transport === 'http'
            ? t('settings.mcp.transport.http')
            : t('settings.mcp.transport.stdio');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('settings.mcp.title')}</Text>
                <TouchableOpacity onPress={handleCreate} style={styles.addButton}>
                    <Ionicons name="add" size={24} color={colors.tint} />
                </TouchableOpacity>
            </View>

            {servers.length === 0 ? (
                /* Empty State */
                <View style={styles.emptyState}>
                    <Ionicons name="extension-puzzle-outline" size={64} color={colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                        {t('settings.mcp.emptyState.title')}
                    </Text>
                    <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
                        {t('settings.mcp.emptyState.description')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.emptyButton, { backgroundColor: colors.tint }]}
                        onPress={handleCreate}
                    >
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.emptyButtonText}>
                            {t('settings.mcp.emptyState.cta')}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    {servers.map((server) => (
                        <ResourceCard
                            key={server.id}
                            title={server.name}
                            subtitle={getTransportLabel(server)}
                            description={server.transport === 'http' ? server.endpoint : server.command}
                            icon={getServerIcon(server)}
                            iconColor={server.transport === 'http' ? '#5856D6' : '#34C759'}
                            isDefault={false}
                            showDefaultBadge={false}
                            onPress={() => handleEdit(server)}
                            onTest={() => handleTest(server)}
                            onDelete={() => handleDelete(server)}
                            testLabel={t('settings.mcp.test')}
                        />
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: Spacing.xs,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '600',
    },
    addButton: {
        padding: Spacing.xs,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.md,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    emptyTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        marginTop: Spacing.md,
    },
    emptyDescription: {
        fontSize: FontSizes.md,
        textAlign: 'center',
        marginTop: Spacing.sm,
        maxWidth: 280,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.lg,
        gap: Spacing.xs,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
});
