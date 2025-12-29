/**
 * ExecutorTorch RAG Store
 * 
 * This file re-exports from the platform-specific implementations.
 * React Native bundler will pick the correct file based on platform:
 * - executorchRagStore.native.ts for iOS/Android
 * - executorchRagStore.web.ts for web
 */

// Re-export from native as default for TypeScript
export * from './executorchRagStore.native';
