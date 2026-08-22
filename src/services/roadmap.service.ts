import { createClient } from '@/lib/supabase/client';
import { getCurrentUserId } from '@/lib/supabase/authHelper';

export interface RoadmapItem {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  goal?: string;
  category: string;
  difficulty?: string;
  duration: string;
  status: 'in-progress' | 'completed' | 'draft' | 'archived';
  progressPercent: number;
  completedTopics: number;
  totalTopics: number;
  lastStudied: string;
  pathPreview: ('completed' | 'current' | 'upcoming')[];
  nodes?: any[];
  created_at?: string;
  updated_at?: string;
}

const getStorageKey = (userId: string | null) =>
  userId ? `studyflow_user_roadmaps_${userId}` : 'studyflow_user_roadmaps_guest';

const DEFAULT_ROADMAPS: RoadmapItem[] = [
  {
    id: 'rm-1',
    title: 'Backend Engineering with Go',
    description: 'Master modern backend systems, microservices, gRPC, and distributed databases.',
    category: 'Development',
    status: 'in-progress',
    progressPercent: 68,
    completedTopics: 7,
    totalTopics: 11,
    duration: '8 weeks',
    lastStudied: 'Yesterday',
    pathPreview: ['completed', 'completed', 'current', 'upcoming', 'upcoming'],
  },
  {
    id: 'rm-2',
    title: 'Data Structures & Algorithms in Java',
    description: 'Deep dive into binary trees, dynamic programming, graph algorithms, and system design.',
    category: 'Programming',
    status: 'in-progress',
    progressPercent: 42,
    completedTopics: 5,
    totalTopics: 12,
    duration: '6 weeks',
    lastStudied: '2 days ago',
    pathPreview: ['completed', 'current', 'upcoming', 'upcoming', 'upcoming'],
  },
  {
    id: 'rm-3',
    title: 'System Architecture & Cloud Infrastructure',
    description: 'Learn Docker, Kubernetes, AWS infrastructure, CI/CD pipelines, and serverless scaling.',
    category: 'DevOps',
    status: 'completed',
    progressPercent: 100,
    completedTopics: 9,
    totalTopics: 9,
    duration: '4 weeks',
    lastStudied: '1 week ago',
    pathPreview: ['completed', 'completed', 'completed', 'completed', 'completed'],
  },
];

export const roadmapService = {
  // Get all roadmaps with Supabase + localStorage fallback
  async getAllRoadmaps(): Promise<RoadmapItem[]> {
    const userId = await getCurrentUserId();
    const storageKey = getStorageKey(userId);

    try {
      const supabase = createClient();
      let query = supabase
        .from('roadmaps')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return data as RoadmapItem[];
      }
    } catch (err) {
      console.warn('[roadmapService] Supabase offline or missing table, falling back to localStorage:', err);
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('[roadmapService] Failed parsing localStorage roadmaps:', e);
        }
      }
      // For logged in users, start with empty array; for guests, use default mockups
      if (!userId) {
        localStorage.setItem(storageKey, JSON.stringify(DEFAULT_ROADMAPS));
        return DEFAULT_ROADMAPS;
      }
    }
    return [];
  },

  // Save new roadmap to Supabase & localStorage
  async createRoadmap(newRoadmapData: Partial<RoadmapItem>): Promise<RoadmapItem> {
    const userId = await getCurrentUserId();
    const storageKey = getStorageKey(userId);

    const newRoadmap: RoadmapItem = {
      id: `rm-${Date.now()}`,
      user_id: userId || undefined,
      title: newRoadmapData.title || 'Untitled Roadmap',
      description: newRoadmapData.description || 'Custom learning path.',
      category: newRoadmapData.category || 'Development',
      status: newRoadmapData.status || 'in-progress',
      progressPercent: newRoadmapData.progressPercent || 0,
      completedTopics: newRoadmapData.completedTopics || 0,
      totalTopics: newRoadmapData.totalTopics || (newRoadmapData.nodes ? newRoadmapData.nodes.length : 6),
      duration: newRoadmapData.duration || '4 weeks',
      lastStudied: 'Just now',
      pathPreview: ['current', 'upcoming', 'upcoming', 'upcoming'],
      nodes: newRoadmapData.nodes || [],
      created_at: new Date().toISOString(),
    };

    // Try Supabase insert
    try {
      const supabase = createClient();
      await supabase.from('roadmaps').insert([newRoadmap]);
    } catch (err) {
      console.warn('[roadmapService] Supabase insert failed, using localStorage fallback:', err);
    }

    // Save to localStorage
    if (typeof window !== 'undefined') {
      const currentList = await this.getAllRoadmaps();
      const updatedList = [newRoadmap, ...currentList.filter(r => r.id !== newRoadmap.id)];
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    }

    return newRoadmap;
  },

  // Delete roadmap from Supabase & localStorage
  async deleteRoadmap(id: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    const storageKey = getStorageKey(userId);

    // Try Supabase delete
    try {
      const supabase = createClient();
      await supabase.from('roadmaps').delete().eq('id', id);
    } catch (err) {
      console.warn('[roadmapService] Supabase delete failed, using localStorage fallback:', err);
    }

    // Remove from localStorage
    if (typeof window !== 'undefined') {
      const currentList = await this.getAllRoadmaps();
      const updatedList = currentList.filter((item) => item.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    }

    return true;
  },

  // Update roadmap progress or nodes
  async updateRoadmap(id: string, updates: Partial<RoadmapItem>): Promise<RoadmapItem | null> {
    const userId = await getCurrentUserId();
    const storageKey = getStorageKey(userId);

    try {
      const supabase = createClient();
      await supabase.from('roadmaps').update(updates).eq('id', id);
    } catch (err) {
      console.warn('[roadmapService] Supabase update failed:', err);
    }

    if (typeof window !== 'undefined') {
      const currentList = await this.getAllRoadmaps();
      const updatedList = currentList.map((item) => (item.id === id ? { ...item, ...updates } : item));
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
      return updatedList.find(r => r.id === id) || null;
    }
    return null;
  },
};
