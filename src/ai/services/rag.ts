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
Your primary role is to give accurate, well-structured, educational answers grounded in the user's selected study document.`;

  // Multimodal native PDF processing via Gemini 3.5 Flash-Lite
  if (params.pdfBase64) {
    const cleanBase64 = params.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const promptText = `USER QUESTION:
"${params.question}"

DOCUMENT NAME: ${params.topicContext || 'Uploaded PDF Document'}

INSTRUCTIONS FOR ACCURATE RESPONSE:
1. Examine this attached PDF document thoroughly. Extract any exact numbers, phone numbers, contact info, emails, titles, names, dates, sections, or details requested.
2. If the user asks for a specific piece of information (such as phone number or email):
   - If present in the PDF, state it clearly and accurately.
   - If NOT present in the PDF, explicitly state that it is not listed in the document, and summarize the key information that IS present.
3. Format your response cleanly using GitHub Flavored Markdown (use bold headers, bullet points, and code blocks if applicable).`;

    const contents = [
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64,
        },
      },
      promptText,
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
    : 'No directly matching document context found.';

  const prompt = `DOCUMENT CONTEXT:
${contextBlock}

USER QUESTION:
"${params.question}"

DOCUMENT FOCUS / TITLE: ${params.topicContext || 'Selected Study Document'}

INSTRUCTIONS FOR ACCURATE RESPONSE:
1. FIRST, analyze the provided DOCUMENT CONTEXT above to see if it directly answers the user's question.
2. If the document context contains relevant details, quote or reference the key points from the document accurately.
3. If the document context is minimal or general notes, summarize the document's key themes first, then provide a comprehensive, expert technical response to the user's question related to the topic.
4. Structure your response clearly using GitHub Flavored Markdown:
   - Use bold headers (## Key Concepts, ## Detailed Explanation, ## Summary & Takeaways).
   - Use bullet points and clean formatting.
   - Format any code samples inside labeled code blocks (\`\`\`javascript, \`\`\`python, etc.).
5. Do NOT hallucinate content that directly contradicts the provided document.`;

  const result = await runAI({
    operation: 'rag.answer',
    prompt,
    systemInstruction,
    temperature: 0.3,
    maxOutputTokens: 3000,
  });

  return result.text;
}
