import React from 'react';
import {
    StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../config/theme';
import { SUPPORTED_LANGUAGES } from '../../locales';
import { useSettingsStore } from '../../state';
import { SelectionModal, SelectionOption } from '../components/common';
import { useAppColorScheme, useLocale } from '../hooks';

interface LanguageSelectScreenProps {
    onBack: () => void;
}

export function LanguageSelectScreen({ onBack }: LanguageSelectScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { settings, setLanguage } = useSettingsStore();
    const [showModal, setShowModal] = React.useState(true);

    const languageOptions: SelectionOption[] = SUPPORTED_LANGUAGES.map(lang => ({
        id: lang.code,
        label: lang.nativeName,
        subtitle: lang.name,
    }));

    const handleLanguageSelect = async (languageCode: string | undefined) => {
        if (languageCode) {
            await setLanguage(languageCode);
        }
        onBack();
    };

    const handleClose = () => {
        setShowModal(false);
        onBack();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <SelectionModal
                visible={showModal}
                title={t('settings.language')}
                options={languageOptions}
                selectedId={settings.language}
                onSelect={handleLanguageSelect}
                onClose={handleClose}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
