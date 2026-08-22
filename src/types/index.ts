export type NavSection = 'OVERVIEW' | 'LEARNING' | 'PRACTICE' | 'PRODUCTIVITY';

export type NavItemKey = 
  | 'dashboard'
  | 'roadmaps'
  | 'ai-tutor'
  | 'notes'
  | 'knowledge'
  | 'quizzes'
  | 'coding'
  | 'tasks';

export interface NavItem {
  key: NavItemKey;
  label: string;
  section: NavSection;
  iconName: string;
  badge?: string | number;
}

export interface RoadmapNode {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'locked';
  estimatedHours: number;
  description: string;
  children?: RoadmapNode[];
}

export interface StudyRoadmap {
  id: string;
  title: string;
  category: string;
  progressPercent: number;
  totalTopics: number;
  completedTopics: number;
  nodes: RoadmapNode[];
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  estimatedMinutes: number;
}

export interface StudyNote {
  id: string;
  title: string;
  summary: string;
  subject: string;
  updatedAt: string;
  tags: string[];
}

export interface KnowledgeDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'epub' | 'txt' | 'md';
  fileSize: string;
  chunksCount: number;
  uploadedAt: string;
  status: 'indexed' | 'processing';
}

export interface QuizItem {
  id: string;
  title: string;
  subject: string;
  questionsCount: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  bestScore?: number;
}

export interface RoadmapCard {
  id: string;
  title: string;
  description: string;
  category: string;
  progressPercent: number;
  totalTopics: number;
  completedTopics: number;
  duration: string;
  lastStudied: string;
  status: 'in-progress' | 'completed' | 'draft' | 'archived';
  pathPreview: ('completed' | 'current' | 'upcoming')[];
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: string;
  completed: boolean;
  category: string;
}
