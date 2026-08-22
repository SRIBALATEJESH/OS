import { NextRequest, NextResponse } from 'next/server';
import { generateQuiz, explainQuizAnswer } from '@/ai/services/quiz';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, topic, difficulty, count, types, question, correctAnswer, userAnswer } = body;

    if (action === 'explain') {
      if (!question || !correctAnswer || !userAnswer) {
        return NextResponse.json({ error: 'Missing question, correctAnswer, or userAnswer' }, { status: 400 });
      }
      const explanation = await explainQuizAnswer({ question, correctAnswer, userAnswer });
      return NextResponse.json({ explanation });
    }

    // Default: generate quiz
    if (!topic) return NextResponse.json({ error: 'Missing required field: topic' }, { status: 400 });

    const quiz = await generateQuiz({
      topic,
      difficulty: difficulty || 'Medium',
      count: count || 5,
      types: types || ['MCQ'],
    });
    return NextResponse.json({ quiz });
  } catch (error: any) {
    console.error('[API /ai/quiz]', error?.message);
    return NextResponse.json({ error: error?.message || 'Failed to generate quiz' }, { status: 500 });
  }
}
