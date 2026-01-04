/**
 * Alert utilities - Native Implementation
 * Uses React Native's Alert API
 */
import { Alert } from 'react-native';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Cross-platform alert function - Native version
 */
export function showAlert(
    title: string,
    message?: string,
    buttons?: AlertButton[]
): void {
    Alert.alert(title, message, buttons);
}

/**
 * Show a confirmation dialog - Native version
 */
export function showConfirm(
    title: string,
    message?: string,
    confirmText: string = 'OK',
    cancelText: string = 'Cancel',
    isDestructive: boolean = false
): Promise<boolean> {
    return new Promise((resolve) => {
        Alert.alert(title, message, [
            { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
            { text: confirmText, style: isDestructive ? 'destructive' : 'default', onPress: () => resolve(true) },
        ]);
    });
}

/**
 * Show a simple info alert
 */
export function showInfo(title: string, message?: string): void {
    showAlert(title, message, [{ text: 'OK' }]);
}

/**
 * Show an error alert
 */
export function showError(title: string, message?: string): void {
    showAlert(title, message || 'An error occurred', [{ text: 'OK' }]);
}
