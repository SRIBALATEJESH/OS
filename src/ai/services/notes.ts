import { z } from 'zod';
import { runAI } from '@/ai/gateway';

const NOTES_SYSTEM = `You are StudyFlow's Master AI Educator & Technical Author powered by Gemini 3.5 Flash-Lite.
Generate exhaustive, in-depth, highly structured study notes formatted in GitHub Flavored Markdown.
Include clear section headers (## Overview, ## Core Theoretical Concepts, ## Deep Dive & Architecture, ## Code & Practical Examples, ## Edge Cases & Performance, ## Exam & Interview Revision Sheet).
Use bold markdown text, bullet lists, math equations, and fully functional syntax-highlighted code blocks. Provide maximum technical depth.`;

export const NoteSchema = z.object({
  title: z.string(),
  summary: z.string(),
  key_concepts: z.array(z.string()),
  examples: z.array(z.string()),
  common_mistakes: z.array(z.string()),
  revision_points: z.array(z.string()),
  content: z.string(),
});

export type GeneratedNote = z.infer<typeof NoteSchema>;

export async function generateNote(params: {
  topic: string;
  style: string;
  depth: string;
}): Promise<GeneratedNote> {
  const prompt = `Generate comprehensive, highly detailed, production-grade study notes as a JSON object for this topic.

Topic: ${params.topic}
Style: ${params.style || 'Deep technical masterclass'}
Depth: ${params.depth || 'Comprehensive Deep Dive'}

Return ONLY this JSON structure:
{
  "title": "string — note title",
  "summary": "string — comprehensive 3-5 paragraph executive summary",
  "key_concepts": ["array of 6-12 detailed key concept breakdown strings"],
  "examples": ["array of 4-8 complete code or practical architectural example strings"],
  "common_mistakes": ["array of 4-8 common mistakes, pitfalls & anti-pattern strings"],
  "revision_points": ["array of 8-15 quick revision summary points"],
  "content": "string — complete, 1500+ word masterclass study guide formatted in clean GitHub Flavored Markdown with section headers, bold terms, math formulas, and code blocks"
}

Return ONLY valid JSON.`;

  const result = await runAI({
    operation: 'notes.generate',
    prompt,
    systemInstruction: NOTES_SYSTEM,
    temperature: 0.6,
    maxOutputTokens: 8192,
    jsonMode: true,
  });

  let rawText = result.text.trim();
  if (rawText.startsWith('```')) {
    rawText = rawText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
  }

  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    rawText = rawText.substring(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(rawText);
  return NoteSchema.parse(parsed);
}

export async function summarizeNote(content: string): Promise<string> {
  const result = await runAI({
    operation: 'notes.summarize',
    prompt: `Summarize the following study notes into concise revision points (bullet format):\n\n${content}`,
    systemInstruction: NOTES_SYSTEM,
    temperature: 0.4,
    maxOutputTokens: 1024,
  });
  return result.text;
}
