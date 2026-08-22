import { GoogleGenAI } from '@google/genai';

// Ensure this runs only on the server
if (typeof window !== 'undefined') {
  throw new Error('[AI Provider] Gemini provider must only be used server-side.');
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || '';
  return key.trim().replace(/^["']|["']$/g, '');
}

export const MODELS = {
  // Priority 1 — Main StudyFlow cloud AI model (Gemini 3.5 Flash-Lite)
  FLASH_LITE: 'gemini-3.5-flash-lite',
  FALLBACK_FLASH: 'gemini-2.5-flash-lite',

  // Priority 2 — RAG embeddings and semantic retrieval
  EMBEDDING: 'text-embedding-004',

  // Priority 3 — Local AI tutor, local coding assistant, local experiments
  GEMMA_12B: 'gemma-3-12b-it',

  // Priority 4 — Advanced local reasoning, complex roadmap/coding experiments
  GEMMA_26B: 'gemma-3-27b-it',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

/**
 * Generate content using direct REST API fetch with x-goog-api-key header.
 * Works 100% reliably for both AQ. and AIza keys across serverless and Node.
 */
export async function generateContent(params: {
  model: string;
  prompt?: string;
  contents?: any;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
}): Promise<{ text: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('[AI Provider] GEMINI_API_KEY is not set in environment variables.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const userPrompt = typeof params.contents === 'string' ? params.contents : (params.prompt || '');
  const contentsPayload = [];

  if (params.systemInstruction) {
    contentsPayload.push({ role: 'user', parts: [{ text: `System Instruction: ${params.systemInstruction}` }] });
  }
  contentsPayload.push({ role: 'user', parts: [{ text: userPrompt }] });

  const payload: any = {
    contents: contentsPayload,
    generationConfig: {
      temperature: params.temperature ?? 0.7,
      maxOutputTokens: params.maxOutputTokens ?? 4096,
    },
  };

  if (params.jsonMode) {
    payload.generationConfig.responseMimeType = 'application/json';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini API error: ${res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return { text };
}

/**
 * Generate embeddings using REST API fetch.
 */
export async function embedContent(text: string): Promise<number[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('[AI Provider] GEMINI_API_KEY is not set in environment variables.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.EMBEDDING}:embedContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }]
    }),
  });
  const data = await res.json();
  return data.embedding?.values ?? data.embeddings?.[0]?.values ?? [];
}
