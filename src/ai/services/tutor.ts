import { runAI } from '@/ai/gateway';

const TUTOR_SYSTEM = `You are StudyFlow's Senior AI Tutor & Technical Lead powered by Gemini 3.5 Flash-Lite.
Your mission is to provide deep, highly detailed, exhaustive, and educational explanations to student questions.
When the user asks for explanations, solutions, concepts, or code:
1. Provide IN-DEPTH, step-by-step masterclass explanations covering underlying mechanics, theoretical foundations, and real-world context.
2. ALWAYS provide complete, clean, fully functional, production-ready solution code in properly formatted Markdown code blocks (never use placeholder code or truncated snippets).
3. Thoroughly analyze time and space complexity, edge cases, common pitfalls, and optimization strategies.
4. Format responses cleanly using GitHub Flavored Markdown with bold section headers, bullet lists, code blocks, and clear visual hierarchy.
5. Be direct, enthusiastic, and exceptionally detailed — answer the question completely without omitting important technical specifics.`;

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Generate a tutor response based on a question and conversation context.
 * Only the last N messages are sent to avoid token bloat (as per Phase 3 spec).
 */
export async function tutorChat(params: {
  question: string;
  topic?: string;
  recentMessages?: TutorMessage[];
  weakAreas?: string[];
  memoryContext?: string;
}): Promise<string> {
  const recentHistory = (params.recentMessages || [])
    .slice(-8) // Only last 8 messages as context
    .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n');

  const contextBlock = [
    params.topic ? `Current Topic: ${params.topic}` : '',
    params.weakAreas?.length ? `Student's Weak Areas: ${params.weakAreas.join(', ')}` : '',
    params.memoryContext ? `Learning Memory: ${params.memoryContext}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `${contextBlock ? `Context:\n${contextBlock}\n\n` : ''}${recentHistory ? `Recent Conversation:\n${recentHistory}\n\n` : ''}Student Question: ${params.question}`;

  const result = await runAI({
    operation: 'tutor.chat',
    prompt,
    systemInstruction: TUTOR_SYSTEM,
    temperature: 0.7,
    maxOutputTokens: 4096,
  });

  return result.text;
}

/**
 * Extract learning memories from a conversation session.
 * Used to build a compact student profile without sending all messages.
 */
export async function extractMemory(messages: TutorMessage[]): Promise<string> {
  const history = messages
    .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n');

  const result = await runAI({
    operation: 'memory.extract',
    prompt: `Analyze this tutoring conversation and extract key learning information about the student.

Conversation:
${history}

Return a brief structured summary in this format:
Understands: [topics the student shows understanding of]
Needs Practice: [topics the student is struggling with]
Preferences: [learning preferences noticed]
Notable Questions: [important questions asked]

Keep it concise - maximum 5 bullet points per section.`,
    systemInstruction: TUTOR_SYSTEM,
    temperature: 0.3,
    maxOutputTokens: 512,
  });

  return result.text;
}
