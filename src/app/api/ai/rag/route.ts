import { NextRequest, NextResponse } from 'next/server';
import { chunkText, searchDocumentChunks, answerWithRAG, DocumentChunk } from '@/ai/services/rag';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, question, text, chunks, topicContext, pdfBase64 } = body;

    // Action 1: Chunk text for embedding
    if (action === 'chunk') {
      if (!text) {
        return NextResponse.json({ error: 'Text field is required for chunking' }, { status: 400 });
      }
      const textChunks = chunkText(text);
      const documentChunks: DocumentChunk[] = textChunks.map((content, idx) => ({
        id: `chunk-${Date.now()}-${idx}`,
        content,
        chunkIndex: idx,
      }));
      return NextResponse.json({ chunks: documentChunks });
    }

    // Action 2: Semantic search over chunks
    if (action === 'search') {
      if (!question || !Array.isArray(chunks)) {
        return NextResponse.json({ error: 'Question and chunks array required' }, { status: 400 });
      }
      const matches = await searchDocumentChunks(question, chunks);
      return NextResponse.json({ matches });
    }

    // Action 3: Complete RAG Q&A
    if (action === 'answer') {
      if (!question) {
        return NextResponse.json({ error: 'Question is required' }, { status: 400 });
      }

      let contextTexts: string[] = [];

      if (text && text.trim().length > 0) {
        const rawChunks = chunkText(text, 1000, 200);

        // If total text is moderate size (under 15 chunks / ~15k chars), pass ALL chunks
        // to Gemini 3.5 Flash-Lite to guarantee 100% accurate context without chunk loss!
        if (rawChunks.length <= 15) {
          contextTexts = rawChunks;
        } else {
          const docChunks: DocumentChunk[] = rawChunks.map((content, idx) => ({
            id: `chunk-${idx}`,
            content,
            chunkIndex: idx,
          }));
          const topMatches = await searchDocumentChunks(question, docChunks, 6);
          contextTexts = topMatches.map((m) => m.chunk.content);

          // Fallback: If keyword matching scored 0, include first 6 chunks of the document
          if (contextTexts.length === 0 || topMatches.every((m) => m.similarity === 0)) {
            contextTexts = rawChunks.slice(0, 6);
          }
        }
      } else if (Array.isArray(chunks) && chunks.length > 0) {
        const topMatches = await searchDocumentChunks(question, chunks, 6);
        contextTexts = topMatches.map((m) => m.chunk.content);
      }

      const answer = await answerWithRAG({
        question,
        contextChunks: contextTexts,
        topicContext,
        pdfBase64,
      });

      return NextResponse.json({ answer, retrievedContextCount: contextTexts.length });
    }

    return NextResponse.json({ error: 'Invalid action. Supported: chunk, search, answer' }, { status: 400 });

  } catch (error: any) {
    console.error('[API /api/ai/rag] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed processing RAG request' },
      { status: 500 }
    );
  }
}
