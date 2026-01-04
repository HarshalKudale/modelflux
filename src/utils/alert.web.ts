/**
 * Alert utilities - Web Implementation
 * Uses browser's window.alert and window.confirm
 */

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Cross-platform alert function - Web version
 */
export function showAlert(
    title: string,
    message?: string,
    buttons?: AlertButton[]
): void {
    if (!buttons || buttons.length === 0) {
        window.alert(message ? `${title}\n\n${message}` : title);
        return;
    }

    if (buttons.length === 1) {
        window.alert(message ? `${title}\n\n${message}` : title);
        buttons[0].onPress?.();
        return;
    }

    // Check if this is a confirmation dialog
    const cancelButton = buttons.find(b => b.style === 'cancel' || b.text.toLowerCase() === 'cancel');
    const actionButton = buttons.find(b => b.style !== 'cancel' && b.text.toLowerCase() !== 'cancel');

    if (cancelButton && actionButton) {
        const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
        if (confirmed) {
            actionButton.onPress?.();
        } else {
            cancelButton.onPress?.();
        }
        return;
    }

    // Fallback
    window.alert(message ? `${title}\n\n${message}` : title);
    buttons[0].onPress?.();
}

/**
 * Show a confirmation dialog - Web version
 */
export function showConfirm(
    title: string,
    message?: string,
    _confirmText: string = 'OK',
    _cancelText: string = 'Cancel',
    _isDestructive: boolean = false
): Promise<boolean> {
    return Promise.resolve(
        window.confirm(message ? `${title}\n\n${message}` : title)
    );
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
