/**
 * Source Processor - Native Implementation
 * 
 * Stateless worker for processing source documents.
 * Extracts text, splits into chunks, and delegates embedding to RAG runtime.
 */

import { Platform } from 'react-native';
import { TEXT_SPLITTER_CHUNK_OVERLAP, TEXT_SPLITTER_CHUNK_SIZE } from '../../config/ragConstants';
import { Source } from '../types';

// Types for external dependencies
type RAGRuntimeAddChunksFunction = (chunks: string[], metadata: { documentId: number; name: string }) => Promise<void>;

// Conditional imports for native platforms
let readPDF: ((path: string) => Promise<string>) | null = null;
let RecursiveCharacterTextSplitter: any = null;

// Dynamic import for native-only modules
if (Platform.OS !== 'web') {
    try {
        const pdfium = require('react-native-pdfium');
        readPDF = pdfium.readPDF;

        const rag = require('@react-native-rag/op-sqlite');
        RecursiveCharacterTextSplitter = rag.RecursiveCharacterTextSplitter;
    } catch (e) {
        console.warn('[SourceProcessor] Native RAG modules not available:', e);
    }
}

/**
 * Process a source document and add to vector store
 * 
 * @param source The source document to process
 * @param addChunks Function to add chunks to RAG runtime
 * @returns Object with success status and optional error
 */
export async function processSource(
    source: Source,
    addChunks: RAGRuntimeAddChunksFunction
): Promise<{ success: boolean; isEmpty?: boolean; error?: string }> {
    if (Platform.OS === 'web' || !readPDF) {
        return { success: false, error: 'RAG not supported on this platform' };
    }

    try {
        const normalizedUri = source.uri.replace('file://', '');

        // 1. Extract text from PDF
        console.log('[SourceProcessor] Extracting text from:', source.name);
        const text = await readPDF(normalizedUri);

        if (!text || text.trim().length === 0) {
            return { success: false, isEmpty: true };
        }

        // 2. Split text into chunks
        console.log('[SourceProcessor] Splitting text into chunks...');
        const chunks = await splitText(text);

        if (chunks.length === 0) {
            return { success: false, isEmpty: true };
        }

        console.log('[SourceProcessor] Created', chunks.length, 'chunks');

        // 3. Send to RAG runtime for embedding + storage
        await addChunks(chunks, {
            documentId: source.id,
            name: source.name,
        });

        console.log('[SourceProcessor] Successfully processed:', source.name);
        return { success: true };
    } catch (e) {
        console.error('[SourceProcessor] Error processing source:', e);
        return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
}

/**
 * Split text into chunks using RecursiveCharacterTextSplitter
 */
async function splitText(text: string): Promise<string[]> {
    if (RecursiveCharacterTextSplitter) {
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: TEXT_SPLITTER_CHUNK_SIZE,
            chunkOverlap: TEXT_SPLITTER_CHUNK_OVERLAP,
        });
        return await textSplitter.splitText(text);
    }

    // Fallback: simple chunking by words
    const words = text.split(/\s+/);
    const chunkSize = 200; // words per chunk
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(' '));
    }

    return chunks;
}

/**
 * Check if source processing is supported on current platform
 */
export function isProcessingSupported(): boolean {
    return Platform.OS !== 'web' && readPDF !== null;
}
