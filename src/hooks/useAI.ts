/**
 * useAI — Client-side hook for calling StudyFlow AI API routes.
 *
 * This is the ONLY way React components should call AI features.
 * It calls Next.js server-side API routes — never directly to Gemini.
 *
 * Security: Gemini API keys stay server-side in process.env.GEMINI_API_KEY
 */

import { useState } from 'react';

interface AICallOptions {
  endpoint: 'roadmap' | 'notes' | 'quiz' | 'coding' | 'tutor';
  body: Record<string, any>;
}

interface AIResult<T = any> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function callAI<T = any>(options: AICallOptions): Promise<T | null> {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/${options.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options.body),
      });

      const json = await response.json();

      if (!response.ok) {
        const errMsg = json?.error || `AI API error: ${response.status}`;
        setError(errMsg);
        return null;
      }

      return json as T;
    } catch (err: any) {
      const errMsg = err?.message || 'Network error calling AI service';
      setError(errMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  // ── Convenience helpers ──

  async function generateRoadmap(params: { goal: string; level: string; duration: string; dailyTime: string; preferences?: string }) {
    return callAI({ endpoint: 'roadmap', body: params });
  }

  async function generateNote(params: { topic: string; style?: string; depth?: string }) {
    return callAI({ endpoint: 'notes', body: { action: 'generate', ...params } });
  }

  async function summarizeNote(content: string) {
    return callAI({ endpoint: 'notes', body: { action: 'summarize', content } });
  }

  async function generateQuiz(params: { topic: string; difficulty?: string; count?: number; types?: string[] }) {
    return callAI({ endpoint: 'quiz', body: { ...params } });
  }

  async function explainQuizAnswer(params: { question: string; correctAnswer: string; userAnswer: string }) {
    return callAI({ endpoint: 'quiz', body: { action: 'explain', ...params } });
  }

  async function generateCodingProblem(params: { topic: string; language: string; difficulty: string; problemType?: string }) {
    return callAI({ endpoint: 'coding', body: params });
  }

  async function explainCodingMistake(params: { problem: string; userCode: string; language: string; error?: string }) {
    return callAI({ endpoint: 'coding', body: { action: 'explain', ...params } });
  }

  async function askTutor(params: {
    question: string;
    topic?: string;
    recentMessages?: { role: string; content: string }[];
    weakAreas?: string[];
    memoryContext?: string;
  }) {
    return callAI({ endpoint: 'tutor', body: params });
  }

  return {
    isLoading,
    error,
    callAI,
    generateRoadmap,
    generateNote,
    summarizeNote,
    generateQuiz,
    explainQuizAnswer,
    generateCodingProblem,
    explainCodingMistake,
    askTutor,
  };
}
