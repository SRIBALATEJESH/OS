import { createClient } from '@/lib/supabase/client';
import { getCurrentUserId } from '@/lib/supabase/authHelper';

export interface CodingProblemItem {
  id: string;
  user_id?: string;
  topic_id?: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: string;
  constraints?: string;
  examples?: any[];
  starter_code: string;
  solution?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CodingAttemptItem {
  id: string;
  problem_id: string;
  user_id?: string;
  code: string;
  status: string;
  tests_passed: number;
  tests_total: number;
  execution_time?: string;
  submitted_at?: string;
}

export const codingService = {
  // Fetch all coding problems for current authenticated user
  async getAllProblems(): Promise<CodingProblemItem[]> {
    const supabase = createClient();
    const userId = await getCurrentUserId();

    let query = supabase
      .from('coding_problems')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching coding problems:', error);
      return [];
    }
    return data || [];
  },

  // Fetch coding problem by ID
  async getProblemById(id: string): Promise<CodingProblemItem | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('coding_problems')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching coding problem:', error);
      return null;
    }
    return data;
  },

  // Submit code attempt result for current user
  async recordAttempt(attempt: Omit<CodingAttemptItem, 'id'>): Promise<CodingAttemptItem | null> {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    const attemptData = userId ? { ...attempt, user_id: userId } : attempt;

    const { data, error } = await supabase
      .from('coding_attempts')
      .insert([attemptData])
      .select()
      .single();

    if (error) {
      console.error('Error recording coding attempt:', error);
      return null;
    }
    return data;
  },

  // Delete a coding problem
  async deleteProblem(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('coding_problems').delete().eq('id', id);
    if (error) {
      console.error('Error deleting coding problem:', error);
      return false;
    }
    return true;
  },
};
