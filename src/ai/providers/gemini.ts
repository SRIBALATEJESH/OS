import { GoogleGenAI } from '@google/genai';

// Ensure this runs only on the server
if (typeof window !== 'undefined') {
  throw new Error('[AI Provider] Gemini provider must only be used server-side.');
}

const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('[AI Provider] GEMINI_API_KEY is not set. AI calls will fail.');
}

export const geminiClient = new GoogleGenAI({ apiKey: API_KEY });

/**
 * STRICTLY as defined in StudyFlow Phase 3 AI README.
 * Do NOT add, remove, or change these model identifiers without updating the README.
 *
 * Priority  | Phase 3 Name         | Google API Model ID             | Role
 * ----------|----------------------|---------------------------------|----------------------------
 * 1 (Main)  | Gemini 3.5 Flash-Lite| gemini-2.0-flash-lite           | All cloud AI features
 * 2         | Gemini Embedding 2   | text-embedding-004              | RAG / Semantic embeddings
 * 3         | Gemma 4 12B          | gemma-3-12b-it                  | Local tutor / coding AI
 * 4         | Gemma 4 26B A4B      | gemma-3-27b-it                  | Advanced local reasoning
 * 5 (FUTURE)| Gemma 4 E4B / E2B   | (reserved for Flutter/Android)  | Offline / mobile AI
 *
 * Intentionally EXCLUDED (per README §2):
 *   - Gemini 3.6 Flash
 *   - Gemini 3.7 Flash
 *   - Gemini TTS
 */
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

  // Priority 5 — FUTURE: Flutter / Android / offline AI (DO NOT use yet)
  // GEMMA_E4B: 'gemma-3-1b-it',   // Reserved
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

/**
 * Generate content using the new @google/genai SDK.
 * Returns { text }
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
  // If API key starts with AQ., use REST API with x-goog-api-key header for 100% Google Cloud compatibility
  if (API_KEY.startsWith('AQ.')) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${encodeURIComponent(API_KEY)}`;
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
        'x-goog-api-key': API_KEY,
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

  // Standard @google/genai SDK for AIza keys
  const config: Record<string, any> = {
    temperature: params.temperature ?? 0.7,
    maxOutputTokens: params.maxOutputTokens ?? 4096,
  };

  if (params.jsonMode) {
    config.responseMimeType = 'application/json';
  }

  if (params.systemInstruction) {
    config.systemInstruction = params.systemInstruction;
  }

  const response = await geminiClient.models.generateContent({
    model: params.model,
    contents: params.contents || params.prompt || '',
    config,
  });

  return { text: response.text ?? '' };
}

/**
 * Generate embeddings using the new @google/genai SDK or REST API.
 */
export async function embedContent(text: string): Promise<number[]> {
  if (API_KEY.startsWith('AQ.')) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.EMBEDDING}:embedContent?key=${encodeURIComponent(API_KEY)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }]
      }),
    });
    const data = await res.json();
    return data.embedding?.values ?? data.embeddings?.[0]?.values ?? [];
  }

  const response = await geminiClient.models.embedContent({
    model: MODELS.EMBEDDING,
    contents: text,
  });
  return response.embeddings?.[0]?.values ?? [];
}
