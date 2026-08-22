import { runAI } from '@/ai/gateway';

const TUTOR_SYSTEM = `You are StudyFlow's AI Tutor & Coding Assistant powered by Gemini 3.5 Flash-Lite.
Provide clear, direct, and comprehensive responses in a helpful ChatGPT style.
When the user asks for code, solutions, hints, debugging, or explanations:
1. ALWAYS provide complete, clean, fully functional, step-by-step solution code in properly formatted Markdown code blocks.
2. Explain how the code works clearly and concisely (step-by-step breakdown, edge cases, and time/space complexity).
3. Be direct and helpful — do NOT refuse to provide code or give evasive responses when code is requested.
4. Format code using proper language syntax highlighting (e.g., \`\`\`javascript, \`\`\`java, \`\`\`python).`;

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
    maxOutputTokens: 2048,
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
