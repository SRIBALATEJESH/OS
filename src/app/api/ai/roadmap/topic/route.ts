import { NextRequest, NextResponse } from 'next/server';
import { generateTopicWorkspace } from '@/ai/services/roadmap';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topicTitle } = body;

    if (!topicTitle) {
      return NextResponse.json({ error: 'Missing required field: topicTitle' }, { status: 400 });
    }

    const topicDetails = await generateTopicWorkspace(topicTitle);
    return NextResponse.json({ topicDetails });
  } catch (error: any) {
    console.error('[API /ai/roadmap/topic]', error?.message);
    return NextResponse.json({ error: error?.message || 'Failed to generate topic details' }, { status: 500 });
  }
}
