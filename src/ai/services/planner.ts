import { runAI } from '@/ai/gateway';

const PLANNER_SYSTEM = `You are StudyFlow's AI Study Planner and Learning Gap Analyst.
Create realistic, motivating daily and weekly study plans based on actual progress data.
Identify specific gaps in knowledge using quiz scores, coding attempts, and topic completion.
Be encouraging but honest about areas needing work.`;

/**
 * Generate a personalized daily study plan based on real Supabase progress data.
 */
export async function generateStudyPlan(params: {
  incompleteTopics: string[];
  availableMinutes: number;
  upcomingTasks: string[];
  quizPerformance?: string;
  codingPerformance?: string;
}): Promise<string> {
  const result = await runAI({
    operation: 'planner.generate',
    prompt: `Create a practical daily study schedule based on this data:

Incomplete Topics: ${params.incompleteTopics.join(', ') || 'None specified'}
Available Study Time: ${params.availableMinutes} minutes today
Upcoming Tasks: ${params.upcomingTasks.join(', ') || 'None'}
Quiz Performance: ${params.quizPerformance || 'No data yet'}
Coding Performance: ${params.codingPerformance || 'No data yet'}

Format as a numbered daily schedule with time estimates:
1. [Activity] — [X min]
2. [Activity] — [X min]

Be specific and actionable. Total time should match available minutes.`,
    systemInstruction: PLANNER_SYSTEM,
    temperature: 0.6,
    maxOutputTokens: 800,
  });

  return result.text;
}

/**
 * Analyze learning gaps from quiz and coding performance data.
 */
export async function analyzeLearningGaps(params: {
  quizResults: { topic: string; score: number; total: number }[];
  codingAttempts: { topic: string; passed: number; total: number }[];
  completedTopics: string[];
}): Promise<string> {
  const quizSummary = params.quizResults
    .map((q) => `${q.topic}: ${q.score}/${q.total}`)
    .join(', ');

  const codingSummary = params.codingAttempts
    .map((c) => `${c.topic}: ${c.passed}/${c.total} tests passed`)
    .join(', ');

  const result = await runAI({
    operation: 'gap.analysis',
    prompt: `Analyze this student's learning gaps based on their performance data:

Quiz Results: ${quizSummary || 'No quiz data'}
Coding Attempts: ${codingSummary || 'No coding data'}
Completed Topics: ${params.completedTopics.join(', ') || 'None'}

Provide analysis in this format:
Strong Areas: [areas where student performs well]
Needs Improvement: [specific areas needing work with reasons]
Recommended Next Steps: [concrete actions, ordered by priority]`,
    systemInstruction: PLANNER_SYSTEM,
    temperature: 0.4,
    maxOutputTokens: 800,
  });

  return result.text;
}
