import { z } from 'zod';
import { runAI } from '@/ai/gateway';

const CODING_SYSTEM = `You are StudyFlow's AI Coding Problem Generator and Explanation Engine.
Generate well-defined coding problems with clear descriptions, test cases, and starter code.
When explaining mistakes, be specific, concise, and educational.
Return ONLY valid JSON when asked for structured output.`;

export const TestCaseSchema = z.object({
  input: z.string(),
  expected_output: z.string(),
  description: z.string().optional(),
});

export const CodingProblemSchema = z.object({
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  language: z.string(),
  constraints: z.string().optional(),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })),
  starter_code: z.string(),
  hints: z.array(z.string()).optional(),
  test_cases: z.array(TestCaseSchema),
});

export type GeneratedCodingProblem = z.infer<typeof CodingProblemSchema>;

export async function generateCodingProblem(params: {
  topic: string;
  language: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  problemType?: string;
}): Promise<GeneratedCodingProblem> {
  const prompt = `Generate a coding problem. Return ONLY this JSON structure:
{
  "title": "string",
  "description": "string — clear problem statement",
  "difficulty": "${params.difficulty}",
  "language": "${params.language}",
  "constraints": "string — time/space constraints",
  "examples": [
    { "input": "string", "output": "string", "explanation": "string" }
  ],
  "starter_code": "string — starter code template in ${params.language}",
  "hints": ["hint 1", "hint 2"],
  "test_cases": [
    { "input": "string", "expected_output": "string", "description": "string" }
  ]
}

Topic: ${params.topic}
Language: ${params.language}
Difficulty: ${params.difficulty}
Problem Type: ${params.problemType || 'General'}

Return ONLY the JSON object.`;

  const result = await runAI({
    operation: 'coding.generate',
    prompt,
    systemInstruction: CODING_SYSTEM,
    temperature: 0.5,
    jsonMode: true,
  });

  const parsed = JSON.parse(result.text);
  return CodingProblemSchema.parse(parsed);
}

export async function explainCodingMistake(params: {
  problem: string;
  userCode: string;
  language: string;
  error?: string;
}): Promise<string> {
  const result = await runAI({
    operation: 'coding.explain',
    prompt: `A student submitted this ${params.language} code solution for the following problem. Explain their mistake and provide the correct approach.

Problem: ${params.problem}

Student's Code:
\`\`\`${params.language}
${params.userCode}
\`\`\`

${params.error ? `Error/Failure: ${params.error}` : ''}

Give a clear, educational explanation pointing out:
1. What is wrong with their approach
2. Why the correct solution works
3. The corrected code snippet`,
    systemInstruction: CODING_SYSTEM,
    temperature: 0.4,
    maxOutputTokens: 1500,
  });
  return result.text;
}
