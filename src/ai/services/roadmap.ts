import { z } from 'zod';
import { runAI } from '@/ai/gateway';

// === Zod Schemas ===

export const RoadmapTopicSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  estimated_minutes: z.number().optional(),
  children: z.array(z.lazy((): z.ZodTypeAny => RoadmapTopicSchema)).optional(),
});

export const RoadmapSchema = z.object({
  title: z.string(),
  description: z.string(),
  goal: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.string().optional(),
  duration: z.string().optional(),
  topics: z.array(RoadmapTopicSchema),
});

export type GeneratedRoadmap = z.infer<typeof RoadmapSchema>;

// === System Prompt ===
const ROADMAP_SYSTEM = `You are StudyFlow's expert AI Curriculum Architect.
Generate deep, highly specific, subject-tailored learning roadmaps based on the user's goal.
DO NOT return generic placeholders like "Design Patterns", "API Layer", or "CI/CD Pipeline" unless the user's specific topic is DevOps/Web Backend.
For example:
- If the topic is "DSA through Java" or "Data Structures", include real DSA subtopics: Arrays & Dynamic Arrays, Linked Lists, Stacks & Queues, Recursion & Backtracking, Binary Trees & BSTs, Heaps & Priority Queues, Graph Algorithms (BFS/DFS, Dijkstra), Dynamic Programming, Sorting & Searching, and Java Collections Framework.
- If the topic is "Machine Learning", include Math & Linear Algebra, Pandas & Numpy, Supervised Learning, Neural Networks, PyTorch/TensorFlow, Model Evaluation.

Always tailor the modules and subtopics precisely to the user's target subject.
Always respond with valid JSON matching the required schema exactly.`;

// === Generate Roadmap ===
export async function generateRoadmap(params: {
  goal: string;
  level: string;
  duration: string;
  dailyTime: string;
  preferences?: string;
}): Promise<GeneratedRoadmap> {
  const prompt = `Generate a complete learning roadmap as a JSON object with this exact structure:
{
  "title": "string",
  "description": "string", 
  "goal": "string",
  "category": "string",
  "difficulty": "string",
  "duration": "string",
  "topics": [
    {
      "title": "string",
      "description": "string",
      "difficulty": "Beginner|Intermediate|Advanced",
      "estimated_minutes": number,
      "children": [...]
    }
  ]
}

User Request:
- Goal: ${params.goal}
- Current Level: ${params.level}
- Available Duration: ${params.duration}
- Daily Study Time: ${params.dailyTime}
- Preferences: ${params.preferences || 'None'}

Generate 4-8 main topics with 2-5 subtopics each.
Return ONLY the JSON object, no markdown, no explanation.`;

  const result = await runAI({
    operation: 'roadmap.generate',
    prompt,
    systemInstruction: ROADMAP_SYSTEM,
    temperature: 0.6,
    maxOutputTokens: 3000,
    jsonMode: true,
  });

  const cleanJsonText = (text: string) => {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      // Sanitize bad escape characters or unescaped control characters
      const sanitized = cleaned
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
        .replace(/[\u0000-\u001F]+/g, (m) => (m === '\n' ? '\\n' : m === '\r' ? '\\r' : ''));
      return JSON.parse(sanitized);
    }
  };

  const parsed = cleanJsonText(result.text);
  return RoadmapSchema.parse(parsed);
}

export const TopicWorkspaceDetailsSchema = z.object({
  title: z.string(),
  description: z.string(),
  objectives: z.array(z.string()),
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    done: z.boolean(),
  })),
  related_subtopics: z.array(z.string()),
  estimated_minutes: z.number().optional(),
  difficulty: z.string().optional(),
});

export type GeneratedTopicWorkspaceDetails = z.infer<typeof TopicWorkspaceDetailsSchema>;

export async function generateTopicWorkspace(topicTitle: string): Promise<GeneratedTopicWorkspaceDetails> {
  const prompt = `Generate an in-depth interactive study workspace for this learning topic: "${topicTitle}".
Return ONLY this JSON structure:
{
  "title": "${topicTitle}",
  "description": "string — 2-3 sentence overview explaining what this topic covers and why it matters",
  "objectives": [
    "array of 4 core learning objective strings"
  ],
  "checklist": [
    { "id": "1", "text": "array of 4-6 specific actionable subtopic study tasks", "done": false }
  ],
  "related_subtopics": [
    "array of 4 related concepts or next-step topics"
  ],
  "estimated_minutes": 45,
  "difficulty": "Intermediate"
}

Return ONLY valid JSON.`;

  const result = await runAI({
    operation: 'roadmap.generate',
    prompt,
    systemInstruction: ROADMAP_SYSTEM,
    temperature: 0.5,
    jsonMode: true,
  });

  const cleanJsonText = (text: string) => {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      const sanitized = cleaned
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
        .replace(/[\u0000-\u001F]+/g, (m) => (m === '\n' ? '\\n' : m === '\r' ? '\\r' : ''));
      return JSON.parse(sanitized);
    }
  };

  const parsed = cleanJsonText(result.text);
  return TopicWorkspaceDetailsSchema.parse(parsed);
}
