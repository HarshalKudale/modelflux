// HelpScreen is not used on web - help/tutorials are native only
// This stub is required for platform-specific file resolution

import React from 'react';
import { View } from 'react-native';

interface HelpScreenProps {
    onBack: () => void;
}

export function HelpScreen({ onBack }: HelpScreenProps) {
    // Immediately go back on web since we don't show help screen
    React.useEffect(() => {
        onBack();
    }, [onBack]);

    return <View />;
}
