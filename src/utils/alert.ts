import { Alert, Platform } from 'react-native';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Cross-platform alert function that works on both web and native
 */
export function showAlert(
    title: string,
    message?: string,
    buttons?: AlertButton[]
): void {
    if (Platform.OS === 'web') {
        // Web implementation
        if (!buttons || buttons.length === 0) {
            // Simple alert
            window.alert(message ? `${title}\n\n${message}` : title);
            return;
        }

        if (buttons.length === 1) {
            // Single button alert
            window.alert(message ? `${title}\n\n${message}` : title);
            buttons[0].onPress?.();
            return;
        }

        // Check if this is a confirmation dialog (has cancel and action buttons)
        const cancelButton = buttons.find(b => b.style === 'cancel' || b.text.toLowerCase() === 'cancel');
        const actionButton = buttons.find(b => b.style !== 'cancel' && b.text.toLowerCase() !== 'cancel');

        if (cancelButton && actionButton) {
            // Use confirm for cancel/action dialogs
            const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
            if (confirmed) {
                actionButton.onPress?.();
            } else {
                cancelButton.onPress?.();
            }
            return;
        }

        // Fallback: just show alert and trigger first button
        window.alert(message ? `${title}\n\n${message}` : title);
        buttons[0].onPress?.();
    } else {
        // Native implementation - use React Native's Alert
        Alert.alert(title, message, buttons);
    }
}

/**
 * Show a confirmation dialog
 * Returns true if user confirms, false if cancelled
 */
export function showConfirm(
    title: string,
    message?: string,
    confirmText: string = 'OK',
    cancelText: string = 'Cancel',
    isDestructive: boolean = false
): Promise<boolean> {
    return new Promise((resolve) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
            resolve(confirmed);
        } else {
            Alert.alert(title, message, [
                { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
                { text: confirmText, style: isDestructive ? 'destructive' : 'default', onPress: () => resolve(true) },
            ]);
        }
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
