// WelcomeScreen is not used on web - onboarding is native only
// This stub is required for platform-specific file resolution

import React from 'react';
import { View } from 'react-native';

interface WelcomeScreenProps {
    onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
    // Immediately complete on web since we don't show onboarding
    React.useEffect(() => {
        onComplete();
    }, [onComplete]);

    return <View />;
}
