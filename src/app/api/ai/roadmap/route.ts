import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmap } from '@/ai/services/roadmap';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goal, level, duration, dailyTime, preferences } = body;

    if (!goal || !level || !duration || !dailyTime) {
      return NextResponse.json({ error: 'Missing required fields: goal, level, duration, dailyTime' }, { status: 400 });
    }

    const roadmap = await generateRoadmap({ goal, level, duration, dailyTime, preferences });
    return NextResponse.json({ roadmap });
  } catch (error: any) {
    console.error('[API /ai/roadmap]', error?.message);
    return NextResponse.json({ error: error?.message || 'Failed to generate roadmap' }, { status: 500 });
  }
}
