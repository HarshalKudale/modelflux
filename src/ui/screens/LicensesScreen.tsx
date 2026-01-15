import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LICENSES from '../../config/licenses.json'; // Direct import of the generated JSON
import { Colors, FontSizes, Spacing } from '../../config/theme';
import { useAppColorScheme, useLocale } from '../hooks';

interface LicensesScreenProps {
    onBack?: () => void;
}

export function LicensesScreen({ onBack }: LicensesScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    // Use router back if available, mostly handled by _layout but good to have prop just in case
    // In native stack, we might rely on the header or use `router.back()` if we were using expo-router hook here directly
    // But keeping it simple with props or provided callbacks if typical pattern.
    // However, looking at other screens, they take onBack or onNavigate.
    // Since this is pushing a new screen in stack, we can use `useRouter`.
    // But let's stick to the pattern if passed. If not passed, we might need to use router.

    // Actually, looking at SettingsScreen it gets onBack.
    // I'll assume this screen will be used similarly or via navigation stack where header might be custom.
    // Let's implement a header similar to SettingsScreen.

    const renderItem = ({ item }: { item: typeof LICENSES[0] }) => (
        <TouchableOpacity
            style={[styles.licenseItem, { borderBottomColor: colors.border }]}
            onPress={() => item.homepage && Linking.openURL(item.homepage)}
            disabled={!item.homepage}
        >
            <View style={styles.licenseInfo}>
                <Text style={[styles.licenseName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.licenseVersion, { color: colors.textMuted }]}>v{item.version}</Text>
            </View>
            <View style={styles.licenseMeta}>
                <Text style={[styles.licenseType, { color: colors.textMuted }]}>{item.license}</Text>
                {item.homepage ? <Ionicons name="open-outline" size={16} color={colors.textMuted} /> : null}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                {onBack && (
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                )}
                <Text style={[styles.title, { color: colors.text }]}>{t('settings.about.licenses')}</Text>
                <View style={styles.placeholder} />
            </View>

            <FlatList
                data={LICENSES}
                renderItem={renderItem}
                keyExtractor={item => item.name}
                contentContainerStyle={styles.listContent}
            />
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
    placeholder: {
        width: 32,
    },
    listContent: {
        padding: Spacing.md,
    },
    licenseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    licenseInfo: {
        flex: 1,
        marginRight: Spacing.md,
    },
    licenseName: {
        fontSize: FontSizes.md,
        fontWeight: '500',
        marginBottom: 2,
    },
    licenseVersion: {
        fontSize: FontSizes.sm,
    },
    licenseMeta: {
        alignItems: 'flex-end',
        gap: 4
    },
    licenseType: {
        fontSize: FontSizes.sm,
    }
});
