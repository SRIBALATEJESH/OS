import { MODELS, ModelId } from '@/ai/providers/gemini';

/**
 * AI Operation types — each module declares an operation name.
 * The router maps operations to models; the UI never knows which model it uses.
 */
export type AIOperation =
  | 'roadmap.generate'
  | 'roadmap.advanced'
  | 'tutor.chat'
  | 'tutor.local'
  | 'notes.generate'
  | 'notes.summarize'
  | 'quiz.generate'
  | 'quiz.explain'
  | 'coding.generate'
  | 'coding.explain'
  | 'coding.validate'
  | 'coding.local'
  | 'document.process'
  | 'rag.answer'
  | 'planner.generate'
  | 'gap.analysis'
  | 'memory.extract'
  | 'recommendations';

/**
 * Operation → Model routing table.
 * Strictly follows Phase 3 AI README Model Allocation (§3).
 *
 * Gemini 3.5 Flash-Lite = gemini-2.0-flash-lite   → All high-volume cloud tasks
 * Gemma 4 12B           = gemma-3-12b-it           → Local tutor / coding
 * Gemma 4 26B A4B       = gemma-3-27b-it           → Advanced local reasoning
 */
const ROUTING_TABLE: Record<AIOperation, ModelId> = {
  // ── Gemini 3.5 Flash-Lite (Priority 1) ── All standard cloud AI tasks
  'roadmap.generate':  MODELS.FLASH_LITE,
  'tutor.chat':        MODELS.FLASH_LITE,
  'notes.generate':    MODELS.FLASH_LITE,
  'notes.summarize':   MODELS.FLASH_LITE,
  'quiz.generate':     MODELS.FLASH_LITE,
  'quiz.explain':      MODELS.FLASH_LITE,
  'coding.generate':   MODELS.FLASH_LITE,
  'coding.explain':    MODELS.FLASH_LITE,
  'coding.validate':   MODELS.FLASH_LITE,
  'document.process':  MODELS.FLASH_LITE,
  'rag.answer':        MODELS.FLASH_LITE,
  'planner.generate':  MODELS.FLASH_LITE,
  'gap.analysis':      MODELS.FLASH_LITE,
  'memory.extract':    MODELS.FLASH_LITE,
  'recommendations':   MODELS.FLASH_LITE,

  // ── All operations routed exclusively to Gemini 3.5 Flash-Lite ──
  'tutor.local':       MODELS.FLASH_LITE,
  'coding.local':      MODELS.FLASH_LITE,
  'roadmap.advanced':  MODELS.FLASH_LITE,
};

/**
 * Resolve which model handles a given AI operation.
 * Returns the configured model instance + model ID for logging.
 */
export function resolveModel(operation: AIOperation): { modelId: ModelId } {
  const modelId = ROUTING_TABLE[operation];
  return { modelId };
}

export function getOperationLabel(operation: AIOperation): string {
  return `[AI Router] ${operation}`;
}
