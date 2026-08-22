import { NextRequest, NextResponse } from 'next/server';
import { generateCodingProblem, explainCodingMistake } from '@/ai/services/coding';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, topic, language, difficulty, problemType, problem, userCode, error: codeError } = body;

    if (action === 'explain') {
      if (!problem || !userCode || !language) {
        return NextResponse.json({ error: 'Missing problem, userCode, or language' }, { status: 400 });
      }
      const explanation = await explainCodingMistake({ problem, userCode, language, error: codeError });
      return NextResponse.json({ explanation });
    }

    // Default: generate coding problem
    if (!topic || !language || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields: topic, language, difficulty' }, { status: 400 });
    }

    const codingProblem = await generateCodingProblem({ topic, language, difficulty, problemType });
    return NextResponse.json({ problem: codingProblem });
  } catch (error: any) {
    console.error('[API /ai/coding]', error?.message);
    return NextResponse.json({ error: error?.message || 'Failed to generate coding problem' }, { status: 500 });
  }
}
