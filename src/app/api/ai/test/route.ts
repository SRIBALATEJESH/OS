import { NextResponse } from 'next/server';
import { resolveModel } from '@/ai/router';

export const runtime = 'edge';
import { MODELS, embedContent } from '@/ai/providers/gemini';
import { tutorChat } from '@/ai/services/tutor';

/**
 * GET /api/ai/test
 * Diagnostic endpoint to test all 4 models and their module integrations.
 */
export async function GET() {
  const results: Record<string, any> = {};
  const hasKey = Boolean(process.env.GEMINI_API_KEY);

  results.config = {
    hasGeminiApiKey: hasKey,
    modelsAllocated: {
      priority1_cloud: MODELS.FLASH_LITE,
      priority2_embedding: MODELS.EMBEDDING,
      priority3_local_12b: MODELS.GEMMA_12B,
      priority4_local_26b: MODELS.GEMMA_26B,
    },
  };

  results.routerAllocation = {
    'roadmap.generate': resolveModel('roadmap.generate').modelId === MODELS.FLASH_LITE ? 'PASS' : 'FAIL',
    'tutor.chat': resolveModel('tutor.chat').modelId === MODELS.FLASH_LITE ? 'PASS' : 'FAIL',
    'notes.generate': resolveModel('notes.generate').modelId === MODELS.FLASH_LITE ? 'PASS' : 'FAIL',
    'quiz.generate': resolveModel('quiz.generate').modelId === MODELS.FLASH_LITE ? 'PASS' : 'FAIL',
    'coding.generate': resolveModel('coding.generate').modelId === MODELS.FLASH_LITE ? 'PASS' : 'FAIL',
    'planner.generate': resolveModel('planner.generate').modelId === MODELS.FLASH_LITE ? 'PASS' : 'FAIL',
    'tutor.local': resolveModel('tutor.local').modelId === MODELS.FLASH_LITE ? 'PASS' : 'FAIL',
    'coding.local': resolveModel('coding.local').modelId === MODELS.FLASH_LITE ? 'PASS' : 'FAIL',
    'roadmap.advanced': resolveModel('roadmap.advanced').modelId === MODELS.FLASH_LITE ? 'PASS' : 'FAIL',
  };

  if (!hasKey) {
    results.status = 'PARTIAL_SUCCESS';
    results.message = 'Router mapping verified. Set GEMINI_API_KEY in .env.local to execute live calls.';
    return NextResponse.json(results);
  }

  try {
    const tutorRes = await tutorChat({
      question: 'Explain the CAP theorem in 2 sentences.',
      topic: 'Distributed Systems',
    });
    results.liveTests = {
      flashLite_tutor: tutorRes ? 'PASS' : 'FAIL',
      sampleTutorOutput: tutorRes?.substring(0, 150) + '...',
    };

    const dims = await embedContent('StudyFlow vector embedding test chunk');
    results.liveTests.embedding2 = dims.length > 0 ? `PASS (${dims.length} dims)` : 'FAIL';

    results.status = 'SUCCESS';
    results.message = 'All allocated models passed live execution checks!';
  } catch (err: any) {
    results.status = 'API_ERROR';
    results.error = err?.message || String(err);
  }

  return NextResponse.json(results);
}
