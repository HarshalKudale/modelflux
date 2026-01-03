/**
 * Polyfills required for AI SDK in React Native
 * Must be imported at the top of the app entry point
 */
// @ts-expect-error - no type definitions available
import structuredClone from '@ungap/structured-clone';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
    const setupPolyfills = async () => {
        // @ts-expect-error - internal React Native module
        const { polyfillGlobal } = await import(
            'react-native/Libraries/Utilities/PolyfillFunctions'
        );

        const { TextEncoderStream, TextDecoderStream } = await import(
            '@stardazed/streams-text-encoding'
        );

        if (!('structuredClone' in global)) {
            polyfillGlobal('structuredClone', () => structuredClone);
        }

        polyfillGlobal('TextEncoderStream', () => TextEncoderStream);
        polyfillGlobal('TextDecoderStream', () => TextDecoderStream);
    };

    setupPolyfills();
}

export { };

