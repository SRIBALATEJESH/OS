import { NextRequest, NextResponse } from 'next/server';
import { generateNote, summarizeNote } from '@/ai/services/notes';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, topic, style, depth, content } = body;

    if (action === 'summarize') {
      if (!content) return NextResponse.json({ error: 'Missing content to summarize' }, { status: 400 });
      const summary = await summarizeNote(content);
      return NextResponse.json({ summary });
    }

    // Default: generate note
    if (!topic) return NextResponse.json({ error: 'Missing required field: topic' }, { status: 400 });

    const note = await generateNote({
      topic,
      style: style || 'Detailed explanation',
      depth: depth || 'Standard',
    });
    return NextResponse.json({ note });
  } catch (error: any) {
    console.error('[API /ai/notes]', error?.message);
    return NextResponse.json({ error: error?.message || 'Failed to generate note' }, { status: 500 });
  }
}
