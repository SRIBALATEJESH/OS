/**
 * AI Gateway — The single entry point for all AI operations in StudyFlow.
 *
 * Rules:
 * - Server-side only (never imported directly in React components)
 * - Handles retry logic with exponential backoff
 * - Handles rate-limit detection
 * - On 404 model errors: auto-falls back to FALLBACK_FLASH
 * - Logs every request for debugging
 * - Routes operations to the correct model via the AI Router
 */

import { resolveModel, AIOperation, getOperationLabel } from '@/ai/router';
import { generateContent, MODELS } from '@/ai/providers/gemini';

interface GatewayOptions {
  operation: AIOperation;
  prompt?: string;
  contents?: any;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
  retries?: number;
}

interface GatewayResult {
  text: string;
  operation: AIOperation;
  modelId: string;
  durationMs: number;
}

const DEFAULT_MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Run an AI operation through the gateway with retry + rate-limit handling.
 */
export async function runAI(options: GatewayOptions): Promise<GatewayResult> {
  const {
    operation,
    prompt,
    contents,
    systemInstruction,
    temperature = 0.7,
    maxOutputTokens = 4096,
    jsonMode = false,
    retries = DEFAULT_MAX_RETRIES,
  } = options;

  const { modelId } = resolveModel(operation);
  const label = getOperationLabel(operation);
  const startTime = Date.now();

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`${label} → Model: ${modelId} | Attempt: ${attempt}/${retries}`);

      const result = await generateContent({
        model: modelId,
        prompt,
        contents,
        systemInstruction,
        temperature,
        maxOutputTokens,
        jsonMode,
      });

      const durationMs = Date.now() - startTime;
      console.log(`${label} → ✅ Done in ${durationMs}ms`);
      return { text: result.text, operation, modelId, durationMs };

    } catch (error: any) {
      lastError = error;

      const isRateLimit =
        error?.status === 429 ||
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.message?.includes('quota');

      const isNotFound =
        error?.status === 404 ||
        error?.message?.includes('[404') ||
        error?.message?.includes('not found') ||
        error?.message?.includes('no longer available');

      if (isRateLimit) {
        console.warn(`${label} → ⚠️ Rate limited. Waiting before retry ${attempt}/${retries}...`);
      } else if (isNotFound) {
        console.warn(`${label} → ⚠️ Model "${modelId}" unavailable. Falling back to ${MODELS.FALLBACK_FLASH}...`);
        try {
          const fallback = await generateContent({
            model: MODELS.FALLBACK_FLASH,
            prompt,
            systemInstruction,
            temperature,
            maxOutputTokens,
            jsonMode,
          });
          const durationMs = Date.now() - startTime;
          console.log(`${label} → ✅ Fallback succeeded in ${durationMs}ms`);
          return { text: fallback.text, operation, modelId: `${MODELS.FALLBACK_FLASH} (fallback)`, durationMs };
        } catch (fbErr: any) {
          console.error(`${label} → ❌ Fallback also failed:`, fbErr?.message);
          lastError = fbErr;
        }
      } else {
        console.error(`${label} → ❌ Error on attempt ${attempt}:`, error?.message);
      }

      if (attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `[AI Gateway] All ${retries} retries failed for operation "${operation}". Last error: ${lastError?.message}`
  );
}
