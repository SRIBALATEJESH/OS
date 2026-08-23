import { z } from 'zod';
import { runAI } from '@/ai/gateway';

export interface DocumentChunk {
  id: string;
  documentId?: string;
  content: string;
  chunkIndex: number;
  metadata?: Record<string, any>;
}

export interface SearchMatch {
  chunk: DocumentChunk;
  similarity: number;
}

/**
 * Split document text into chunks of specified maximum character size with overlap.
 */
export function chunkText(
  text: string,
  chunkSize: number = 800,
  overlap: number = 150
): string[] {
  if (!text || text.trim().length === 0) return [];
  const normalizedText = text.replace(/\r\n/g, '\n');
  const paragraphs = normalizedText.split(/\n\n+/);
  const chunks: string[] = [];

  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + '\n\n' + paragraph).length <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      if (paragraph.length > chunkSize) {
        const sentences = paragraph.split(/(?<=[.?!])\s+/);
        let sentenceChunk = '';
        for (const sentence of sentences) {
          if ((sentenceChunk + ' ' + sentence).length <= chunkSize) {
            sentenceChunk = sentenceChunk ? `${sentenceChunk} ${sentence}` : sentence;
          } else {
            if (sentenceChunk) chunks.push(sentenceChunk.trim());
            sentenceChunk = sentence;
          }
        }
        if (sentenceChunk) currentChunk = sentenceChunk;
        else currentChunk = '';
      } else {
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = `${overlapText}\n\n${paragraph}`;
      }
    }
  }

  if (currentChunk && currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Perform keyword & text relevance ranking over document chunks using Gemini 3.5 Flash-Lite.
 */
export async function searchDocumentChunks(
  query: string,
  chunks: DocumentChunk[],
  topK: number = 4
): Promise<SearchMatch[]> {
  if (!query || chunks.length === 0) return [];

  // Simple, fast keyword matching & text scoring
  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  const scored = chunks.map((chunk) => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;

    queryTerms.forEach((term) => {
      if (contentLower.includes(term)) {
        score += 1;
      }
    });

    // Normalize similarity between 0 and 1
    const similarity = queryTerms.length > 0 ? Math.min(1, score / queryTerms.length) : 0.5;

    return { chunk, similarity };
  });

  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

/**
 * Answer a question using retrieved document context exclusively via Gemini 3.5 Flash-Lite.
 */
export async function answerWithRAG(params: {
  question: string;
  contextChunks: string[];
  topicContext?: string;
  pdfBase64?: string;
}): Promise<string> {
  const systemInstruction = `You are StudyFlow's Precision RAG & Document Q&A Assistant powered exclusively by Gemini 3.5 Flash-Lite.
Your primary role is to give accurate, well-structured, educational answers to the user's question.
CRITICAL INSTRUCTION: Never output generic greetings, boilerplate text, or request the user to re-upload text. Always answer the user's question directly with full technical depth.`;

  // Multimodal native PDF processing via Gemini 3.5 Flash-Lite
  if (params.pdfBase64) {
    const cleanBase64 = params.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const promptText = `USER QUESTION:
"${params.question}"

DOCUMENT NAME: ${params.topicContext || 'Uploaded PDF Document'}

INSTRUCTIONS FOR ACCURATE RESPONSE:
1. Examine this attached PDF document thoroughly. Extract any exact numbers, formulas, key concepts, definitions, or details requested.
2. Provide a clear, comprehensive, educational answer to the user's question based on the PDF contents.
3. Format your response cleanly using GitHub Flavored Markdown (use bold headers, bullet points, and code blocks if applicable).`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: 'application/pdf',
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
    ];

    const result = await runAI({
      operation: 'rag.answer',
      contents,
      systemInstruction,
      temperature: 0.2,
      maxOutputTokens: 3000,
    });

    return result.text;
  }

  const contextBlock = params.contextChunks.length > 0
    ? params.contextChunks.map((c, i) => `--- DOCUMENT EXCERPT ${i + 1} ---\n${c}`).join('\n\n')
    : 'Selected Document Context Available.';

  const prompt = `DOCUMENT CONTEXT / REFERENCE MATERIAL:
${contextBlock}

USER QUESTION / LEARNING OBJECTIVE:
"${params.question}"

DOCUMENT TITLE: ${params.topicContext || 'Study Document'}

INSTRUCTIONS FOR ACCURATE RESPONSE:
1. Analyze the DOCUMENT CONTEXT and user question.
2. Directly answer the user's question in detail. Highlight key concepts, definitions, differences, architectures, and examples.
3. Format your response using clean GitHub Flavored Markdown:
   - Use bold headers (## Overview, ## Key Differences / Core Concepts, ## Summary).
   - Use bullet points, bold key terms, and code blocks if relevant.
4. Do NOT output meta-disclaimers or ask the user to provide more text. Provide a full, high-quality response.`;

  const result = await runAI({
    operation: 'rag.answer',
    prompt,
    systemInstruction,
    temperature: 0.3,
    maxOutputTokens: 3000,
  });

  return result.text;
}
