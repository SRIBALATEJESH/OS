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

export interface CodeValidationResult {
  compiled: boolean;
  compilerError?: string;
  testResults: Array<{
    id: number;
    status: 'passed' | 'failed';
    actualOutput: string;
    error?: string;
  }>;
  passedCount: number;
  totalCount: number;
  feedback?: string;
}

export async function validateCodeSubmission(params: {
  problemTitle: string;
  problemDescription: string;
  language: string;
  userCode: string;
  testCases: Array<{ id: number; input: string; expectedOutput: string }>;
}): Promise<CodeValidationResult> {
  const prompt = `You are a strict Code Compiler and Automated Test Execution System.
Evaluate this student code submission against the problem description and test cases.

Problem Title: ${params.problemTitle}
Problem Description: ${params.problemDescription}
Language: ${params.language}

Student's Submitted Code:
\`\`\`${params.language.toLowerCase()}
${params.userCode}
\`\`\`

Test Cases to Validate:
${JSON.stringify(params.testCases, null, 2)}

Instructions:
1. Check if the code has syntax errors or incomplete statements in ${params.language}. If so, set "compiled": false and provide "compilerError".
2. If compiled is true, simulate execution for EACH test case. Compare actual output against expected output.
3. Return ONLY valid JSON in this exact structure:
{
  "compiled": boolean,
  "compilerError": "string or null",
  "testResults": [
    {
      "id": number (matching test case id),
      "status": "passed" or "failed",
      "actualOutput": "string (actual evaluated output)",
      "error": "string or null if logic error/exception occurred"
    }
  ],
  "passedCount": number,
  "totalCount": number,
  "feedback": "concise explanation of why tests failed or tips if any failed"
}`;

  try {
    const result = await runAI({
      operation: 'coding.validate',
      prompt,
      systemInstruction: CODING_SYSTEM,
      temperature: 0.2,
      jsonMode: true,
    });

    const parsed = JSON.parse(result.text);
    return {
      compiled: parsed.compiled !== false,
      compilerError: parsed.compilerError || undefined,
      testResults: Array.isArray(parsed.testResults) ? parsed.testResults : params.testCases.map(tc => ({
        id: tc.id,
        status: 'failed' as const,
        actualOutput: 'Execution Error',
      })),
      passedCount: typeof parsed.passedCount === 'number' ? parsed.passedCount : 0,
      totalCount: params.testCases.length,
      feedback: parsed.feedback || undefined,
    };
  } catch (err: any) {
    console.error('Failed to validate code via AI:', err);
    return {
      compiled: true,
      testResults: params.testCases.map(tc => ({
        id: tc.id,
        status: 'failed' as const,
        actualOutput: 'Validation Failed to Run',
      })),
      passedCount: 0,
      totalCount: params.testCases.length,
      feedback: 'Failed to run automated AI validator.',
    };
  }
}

