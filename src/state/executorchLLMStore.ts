/**
 * ExecutorTorch LLM Store
 * 
 * This file re-exports from the platform-specific implementations.
 * React Native bundler will pick the correct file based on platform:
 * - executorchLLMStore.native.ts for iOS/Android
 * - executorchLLMStore.web.ts for web
 */

// Re-export everything from the native implementation as the default
// TypeScript will use this for type checking, bundler will pick the right file
export * from './executorchLLMStore.native';
