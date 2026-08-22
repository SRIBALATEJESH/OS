import { z } from 'zod';
import { runAI } from '@/ai/gateway';

const QUIZ_SYSTEM = `You are StudyFlow's AI Quiz Generator.
Generate educational quiz questions with clear, unambiguous answers.
Always include a brief explanation for the correct answer.
Return ONLY valid JSON — no markdown formatting.`;

export const QuizQuestionSchema = z.object({
  question: z.string(),
  question_type: z.enum(['MCQ', 'TF', 'Scenario']),
  options: z.array(z.string()).min(2).max(4),
  correct_answer: z.string(),
  explanation: z.string(),
});

export const QuizSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  difficulty: z.string(),
  questions: z.array(QuizQuestionSchema),
});

export type GeneratedQuiz = z.infer<typeof QuizSchema>;
export type GeneratedQuizQuestion = z.infer<typeof QuizQuestionSchema>;

export async function generateQuiz(params: {
  topic: string;
  difficulty: string;
  count: number;
  types: string[];
}): Promise<GeneratedQuiz> {
  const prompt = `Generate a quiz on the given topic. Return ONLY this JSON structure:
{
  "title": "string",
  "description": "string",
  "difficulty": "${params.difficulty}",
  "questions": [
    {
      "question": "string",
      "question_type": "MCQ|TF|Scenario",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "string matching one option exactly",
      "explanation": "string — why this answer is correct"
    }
  ]
}

Topic: ${params.topic}
Difficulty: ${params.difficulty}
Number of Questions: ${params.count}
Question Types: ${params.types.join(', ')}

Return ONLY the JSON object.`;

  const result = await runAI({
    operation: 'quiz.generate',
    prompt,
    systemInstruction: QUIZ_SYSTEM,
    temperature: 0.5,
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

  if (parsed && Array.isArray(parsed.questions)) {
    parsed.questions = parsed.questions.map((q: any) => ({
      question: q.question || 'Question',
      question_type: ['MCQ', 'TF', 'Scenario'].includes(q.question_type) ? q.question_type : 'MCQ',
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: String(q.correct_answer || (Array.isArray(q.options) ? q.options[0] : 'Option A')),
      explanation: q.explanation || 'Correct answer explanation.',
    }));
  }

  return QuizSchema.parse(parsed);
}

export async function explainQuizAnswer(params: {
  question: string;
  correctAnswer: string;
  userAnswer: string;
}): Promise<string> {
  const result = await runAI({
    operation: 'quiz.explain',
    prompt: `Explain why the correct answer to this quiz question is "${params.correctAnswer}":
Question: ${params.question}
User answered: ${params.userAnswer}
Correct answer: ${params.correctAnswer}

Give a clear, educational explanation in 2-3 sentences.`,
    systemInstruction: QUIZ_SYSTEM,
    temperature: 0.4,
    maxOutputTokens: 512,
  });
  return result.text;
}
