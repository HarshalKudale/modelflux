/**
 * Source Processor - Native Implementation
 * 
 * Stateless worker for processing source documents.
 * Extracts text from PDFs using react-native-pdfium, splits into chunks.
 */
import { readPDF } from 'react-native-pdfium';
import { RecursiveCharacterTextSplitter } from 'react-native-rag';
import { TEXT_SPLITTER_CHUNK_OVERLAP, TEXT_SPLITTER_CHUNK_SIZE } from '../../config/ragConstants';
import { Source } from '../types';

// Types for external dependencies
type RAGRuntimeAddChunksFunction = (chunks: string[], metadata: { documentId: number; name: string }) => Promise<void>;

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
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: TEXT_SPLITTER_CHUNK_SIZE,
        chunkOverlap: TEXT_SPLITTER_CHUNK_OVERLAP,
    });
    return await textSplitter.splitText(text);
}

/**
 * Check if source processing is supported on current platform
 */
export function isProcessingSupported(): boolean {
    return true; // Always supported on native
}
