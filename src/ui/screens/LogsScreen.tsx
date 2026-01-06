import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import type { LogEntry, LogLevel } from '../../services/LoggerService';
import { logger } from '../../services/LoggerService';
import { showError, showInfo } from '../../utils/alert';
import { useAppColorScheme, useLocale } from '../hooks';

interface LogsScreenProps {
    onBack: () => void;
}

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
    debug: '#888888',
    info: '#4A90D9',
    warn: '#F5A623',
    error: '#D0021B',
};

export function LogsScreen({ onBack }: LogsScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    // State for file list view
    const [logDates, setLogDates] = useState<string[]>([]);
    const [isLoadingDates, setIsLoadingDates] = useState(true);

    // State for log entries view
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Load list of log file dates
    const loadLogDates = useCallback(async () => {
        try {
            const dates = await logger.getLogDates();
            setLogDates(dates);
        } catch (error) {
            if (__DEV__) console.error('Failed to load log dates:', error);
        }
    }, []);

    // Load logs for a specific date
    const loadLogsForDate = useCallback(async (date: string) => {
        setIsLoadingLogs(true);
        try {
            const allLogs = await logger.getLogs();
            // Filter logs for the selected date
            const filteredLogs = allLogs.filter(log =>
                log.timestamp.startsWith(date)
            );
            setLogs(filteredLogs);
        } catch (error) {
            if (__DEV__) console.error('Failed to load logs:', error);
        } finally {
            setIsLoadingLogs(false);
        }
    }, []);

    useEffect(() => {
        setIsLoadingDates(true);
        loadLogDates().finally(() => setIsLoadingDates(false));
    }, [loadLogDates]);

    useEffect(() => {
        if (selectedDate) {
            loadLogsForDate(selectedDate);
        }
    }, [selectedDate, loadLogsForDate]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        if (selectedDate) {
            await loadLogsForDate(selectedDate);
        } else {
            await loadLogDates();
        }
        setIsRefreshing(false);
    }, [selectedDate, loadLogsForDate, loadLogDates]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await logger.exportLogs();
        } catch (error) {
            showError(t('common.error'), error instanceof Error ? error.message : 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const handleClear = async () => {
        try {
            await logger.clearLogs();
            setLogs([]);
            setLogDates([]);
            setSelectedDate(null);
            showInfo(t('common.success'), t('logs.cleared'));
        } catch (error) {
            showError(t('common.error'), 'Failed to clear logs');
        }
    };

    const handleBack = () => {
        if (selectedDate) {
            setSelectedDate(null);
            setLogs([]);
        } else {
            onBack();
        }
    };

    const formatDateDisplay = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const renderDateItem = ({ item: date }: { item: string }) => (
        <TouchableOpacity
            style={[styles.dateItem, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => setSelectedDate(date)}
        >
            <View style={styles.dateItemContent}>
                <Ionicons name="document-text-outline" size={24} color={colors.tint} />
                <View style={styles.dateItemText}>
                    <Text style={[styles.dateItemTitle, { color: colors.text }]}>
                        {formatDateDisplay(date)}
                    </Text>
                    <Text style={[styles.dateItemSubtitle, { color: colors.textMuted }]}>
                        {date}.log
                    </Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );

    const renderLogEntry = ({ item }: { item: LogEntry }) => {
        const levelColor = LOG_LEVEL_COLORS[item.level];
        const time = new Date(item.timestamp).toLocaleTimeString();

        return (
            <View style={[styles.logEntry, { borderLeftColor: levelColor }]}>
                <View style={styles.logHeader}>
                    <Text style={[styles.logLevel, { color: levelColor }]}>
                        {item.level.toUpperCase()}
                    </Text>
                    <Text style={[styles.logTag, { color: colors.tint }]}>[{item.tag}]</Text>
                    <Text style={[styles.logTime, { color: colors.textMuted }]}>
                        {time}
                    </Text>
                </View>
                <Text style={[styles.logMessage, { color: colors.text }]} numberOfLines={5}>
                    {item.message}
                </Text>
            </View>
        );
    };

    const isShowingLogs = selectedDate !== null;
    const title = isShowingLogs ? formatDateDisplay(selectedDate) : t('logs.title');

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    {title}
                </Text>
                <View style={styles.headerActions}>
                    {!isShowingLogs && (
                        <TouchableOpacity
                            onPress={handleClear}
                            style={styles.headerButton}
                            disabled={logDates.length === 0}
                        >
                            <Ionicons
                                name="trash-outline"
                                size={20}
                                color={logDates.length === 0 ? colors.textMuted : colors.text}
                            />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={handleExport}
                        style={styles.headerButton}
                        disabled={isExporting || logDates.length === 0}
                    >
                        {isExporting ? (
                            <ActivityIndicator size="small" color={colors.tint} />
                        ) : (
                            <Ionicons
                                name="share-outline"
                                size={20}
                                color={logDates.length === 0 ? colors.textMuted : colors.text}
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            {isShowingLogs ? (
                // Show log entries for selected date
                isLoadingLogs ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={colors.tint} />
                    </View>
                ) : logs.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            No logs for this date
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={logs}
                        keyExtractor={(item, index) => `${item.timestamp}-${index}`}
                        renderItem={renderLogEntry}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                tintColor={colors.tint}
                            />
                        }
                    />
                )
            ) : (
                // Show list of log files
                isLoadingDates ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={colors.tint} />
                    </View>
                ) : logDates.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            {t('logs.empty')}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={logDates}
                        keyExtractor={(item) => item}
                        renderItem={renderDateItem}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                tintColor={colors.tint}
                            />
                        }
                    />
                )
            )}

            {/* Log count footer */}
            {isShowingLogs && logs.length > 0 && (
                <View style={[styles.footer, { backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border }]}>
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                        {t('logs.count', { count: logs.length })}
                    </Text>
                </View>
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
        fontSize: FontSizes.lg,
        fontWeight: '600',
        flex: 1,
        marginLeft: Spacing.sm,
    },
    headerActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    headerButton: {
        padding: Spacing.xs,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: FontSizes.md,
    },
    listContent: {
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    dateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    dateItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    dateItemText: {
        gap: 2,
    },
    dateItemTitle: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    dateItemSubtitle: {
        fontSize: FontSizes.sm,
    },
    logEntry: {
        padding: Spacing.sm,
        borderLeftWidth: 3,
        borderRadius: BorderRadius.sm,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    logHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    logLevel: {
        fontSize: FontSizes.xs,
        fontWeight: '700',
        minWidth: 50,
    },
    logTag: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
    logTime: {
        fontSize: FontSizes.xs,
        marginLeft: 'auto',
    },
    logMessage: {
        fontSize: FontSizes.sm,
        fontFamily: 'monospace',
    },
    footer: {
        padding: Spacing.sm,
        alignItems: 'center',
        borderTopWidth: 1,
    },
    footerText: {
        fontSize: FontSizes.sm,
    },
});
