import { NextRequest, NextResponse } from 'next/server';
import { tutorChat, extractMemory, TutorMessage } from '@/ai/services/tutor';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, question, message, prompt, topic, recentMessages, weakAreas, memoryContext, messages } = body;

    if (action === 'extract-memory') {
      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json({ error: 'Missing messages array for memory extraction' }, { status: 400 });
      }
      const memory = await extractMemory(messages as TutorMessage[]);
      return NextResponse.json({ memory });
    }

    // Default: tutor chat response (accept question, message, or prompt)
    const userQuestion = question || message || prompt;
    if (!userQuestion) return NextResponse.json({ error: 'Missing required field: question' }, { status: 400 });

    const response = await tutorChat({
      question: userQuestion,
      topic: topic || 'General',
      recentMessages: (recentMessages || []) as TutorMessage[],
      weakAreas: weakAreas || [],
      memoryContext,
    });

    return NextResponse.json({ response, reply: response, text: response });
  } catch (error: any) {
    console.error('[API /ai/tutor]', error?.message);
    return NextResponse.json({ error: error?.message || 'Tutor AI failed to respond' }, { status: 500 });
  }
}
