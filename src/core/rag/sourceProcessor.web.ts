/**
 * Source Processor - Web Implementation
 * 
 * Stateless worker for processing source documents.
 * Extracts text from PDFs using pdfjs-dist for web platform.
 * 
 * Note: pdfjs-dist is loaded dynamically to avoid bundling issues with DOMMatrix.
 */
import { TEXT_SPLITTER_CHUNK_OVERLAP, TEXT_SPLITTER_CHUNK_SIZE } from '../../config/ragConstants';
import { Source } from '../types';

// Types for external dependencies
type RAGRuntimeAddChunksFunction = (chunks: string[], metadata: { documentId: number; name: string }) => Promise<void>;

// Lazy-loaded pdfjs library
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

/**
 * Load pdfjs-dist dynamically
 */
async function getPdfJs(): Promise<typeof import('pdfjs-dist')> {
    if (pdfjsLib) return pdfjsLib;

    try {
        pdfjsLib = await import('pdfjs-dist');
        // Configure worker - use CDN to avoid bundling issues
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        return pdfjsLib;
    } catch (error) {
        console.error('[SourceProcessor] Failed to load pdfjs-dist:', error);
        throw new Error('PDF processing is not available');
    }
}

/**
 * Extract text from a PDF file using pdfjs-dist
 */
async function extractTextFromPDF(uri: string): Promise<string> {
    const pdfjs = await getPdfJs();

    try {
        // Load the PDF document
        const loadingTask = pdfjs.getDocument(uri);
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + '\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('[SourceProcessor] Error extracting PDF text:', error);
        throw error;
    }
}

/**
 * Split text into chunks using a simple recursive character splitter
 * This is a simplified version for web - no native RecursiveCharacterTextSplitter
 */
function splitText(text: string): string[] {
    const chunkSize = TEXT_SPLITTER_CHUNK_SIZE;
    const chunkOverlap = TEXT_SPLITTER_CHUNK_OVERLAP;
    const chunks: string[] = [];

    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length <= chunkSize) {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        } else {
            if (currentChunk) {
                chunks.push(currentChunk);
                // Keep overlap from the end of the current chunk
                const overlap = currentChunk.slice(-chunkOverlap);
                currentChunk = overlap + (overlap ? '\n\n' : '') + paragraph;
            } else {
                // Paragraph is too long, split by sentences
                const sentences = paragraph.split(/(?<=[.!?])\s+/);
                for (const sentence of sentences) {
                    if (currentChunk.length + sentence.length <= chunkSize) {
                        currentChunk += (currentChunk ? ' ' : '') + sentence;
                    } else {
                        if (currentChunk) {
                            chunks.push(currentChunk);
                            const overlap = currentChunk.slice(-chunkOverlap);
                            currentChunk = overlap + (overlap ? ' ' : '') + sentence;
                        } else {
                            // Sentence is too long, just split by size
                            for (let i = 0; i < sentence.length; i += chunkSize - chunkOverlap) {
                                chunks.push(sentence.slice(i, i + chunkSize));
                            }
                        }
                    }
                }
            }
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
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
    try {
        // 1. Extract text from PDF
        console.log('[SourceProcessor] Extracting text from:', source.name);
        const text = await extractTextFromPDF(source.uri);

        if (!text || text.trim().length === 0) {
            return { success: false, isEmpty: true };
        }

        // 2. Split text into chunks
        console.log('[SourceProcessor] Splitting text into chunks...');
        const chunks = splitText(text);

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
 * Check if source processing is supported on current platform
 */
export function isProcessingSupported(): boolean {
    // On web, PDF processing is available but loaded dynamically
    return true;
}
