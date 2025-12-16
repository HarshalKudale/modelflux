import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../../config/theme';

interface DropdownOption<T> {
    label: string;
    value: T;
    icon?: keyof typeof Ionicons.glyphMap;
}

interface DropdownProps<T> {
    value: T;
    options: DropdownOption<T>[];
    onSelect: (value: T) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
}

export function Dropdown<T>({
    value,
    options,
    onSelect,
    placeholder = 'Select...',
    label,
    disabled = false,
}: DropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const shadows = Shadows[colorScheme];

    const selectedOption = options.find((opt) => opt.value === value);

    const handleSelect = (option: DropdownOption<T>) => {
        onSelect(option.value);
        setIsOpen(false);
    };

    return (
        <View style={styles.container}>
            {label && (
                <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            )}
            <TouchableOpacity
                onPress={() => !disabled && setIsOpen(true)}
                style={[
                    styles.trigger,
                    {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                    },
                    disabled && { opacity: 0.5 },
                ]}
                disabled={disabled}
            >
                <View style={styles.triggerContent}>
                    {selectedOption?.icon && (
                        <Ionicons
                            name={selectedOption.icon}
                            size={18}
                            color={colors.text}
                            style={styles.triggerIcon}
                        />
                    )}
                    <Text
                        style={[
                            styles.triggerText,
                            { color: selectedOption ? colors.text : colors.textMuted },
                        ]}
                    >
                        {selectedOption?.label || placeholder}
                    </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <Pressable
                    style={[styles.overlay, { backgroundColor: colors.overlay }]}
                    onPress={() => setIsOpen(false)}
                >
                    <View
                        style={[
                            styles.modal,
                            { backgroundColor: colors.cardBackground },
                            shadows.lg,
                        ]}
                    >
                        <FlatList
                            data={options}
                            keyExtractor={(item, index) => String(index)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.option,
                                        item.value === value && { backgroundColor: colors.sidebarActive },
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    {item.icon && (
                                        <Ionicons
                                            name={item.icon}
                                            size={18}
                                            color={item.value === value ? colors.tint : colors.text}
                                            style={styles.optionIcon}
                                        />
                                    )}
                                    <Text
                                        style={[
                                            styles.optionText,
                                            { color: item.value === value ? colors.tint : colors.text },
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                    {item.value === value && (
                                        <Ionicons name="checkmark" size={18} color={colors.tint} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    triggerIcon: {
        marginRight: Spacing.sm,
    },
    triggerText: {
        fontSize: FontSizes.md,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modal: {
        width: '100%',
        maxWidth: 400,
        maxHeight: 400,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    optionIcon: {
        marginRight: Spacing.sm,
    },
    optionText: {
        fontSize: FontSizes.md,
        flex: 1,
    },
});
