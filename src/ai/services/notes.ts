import { z } from 'zod';
import { runAI } from '@/ai/gateway';

const NOTES_SYSTEM = `You are StudyFlow's AI Notes Generator.
Generate clear, structured study notes with key concepts, examples, and revision points.
Format notes in clean structured text — NOT markdown with asterisks.
Use section headers like "## Overview", "## Key Concepts", "## Examples", "## Common Mistakes".`;

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
  const prompt = `Generate structured study notes as a JSON object for this topic.

Return ONLY this JSON structure:
{
  "title": "string — note title",
  "summary": "string — 2-3 sentence overview",
  "key_concepts": ["array of 4-8 key concept strings"],
  "examples": ["array of 3-5 code or practical example strings"],
  "common_mistakes": ["array of 3-5 common mistake strings"],
  "revision_points": ["array of 5-10 revision point strings"],
  "content": "string — full formatted note content with section headers"
}

Topic: ${params.topic}
Style: ${params.style}
Depth: ${params.depth}

Return ONLY the JSON, no markdown, no extra text.`;

  const result = await runAI({
    operation: 'notes.generate',
    prompt,
    systemInstruction: NOTES_SYSTEM,
    temperature: 0.6,
    jsonMode: true,
  });

  const parsed = JSON.parse(result.text);
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
