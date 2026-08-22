import { createClient } from '@/lib/supabase/client';
import { getCurrentUserId } from '@/lib/supabase/authHelper';

export interface QuizItem {
  id: string;
  user_id?: string;
  topic_id?: string;
  title: string;
  description?: string;
  difficulty?: string;
  question_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface QuizQuestionItem {
  id: string;
  quiz_id: string;
  question: string;
  question_type?: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  order_index?: number;
}

export interface QuizAttemptItem {
  id: string;
  quiz_id: string;
  user_id?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  started_at?: string;
  completed_at?: string;
}

export const quizService = {
  // Fetch all quizzes for current authenticated user
  async getAllQuizzes(): Promise<QuizItem[]> {
    const supabase = createClient();
    const userId = await getCurrentUserId();

    let query = supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching quizzes:', error);
      return [];
    }
    return data || [];
  },

  // Fetch full quiz with questions
  async getQuizWithQuestions(id: string): Promise<{ quiz: QuizItem | null; questions: QuizQuestionItem[] }> {
    const supabase = createClient();
    const { data: quiz, error: qError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();

    if (qError || !quiz) {
      console.error('Error fetching quiz:', qError);
      return { quiz: null, questions: [] };
    }

    const { data: questions, error: questError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', id)
      .order('order_index', { ascending: true });

    if (questError) {
      console.error('Error fetching quiz questions:', questError);
      return { quiz, questions: [] };
    }

    return { quiz, questions: questions || [] };
  },

  // Submit quiz attempt result for current user
  async recordAttempt(attempt: Omit<QuizAttemptItem, 'id'>): Promise<QuizAttemptItem | null> {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    const attemptData = userId ? { ...attempt, user_id: userId } : attempt;

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert([attemptData])
      .select()
      .single();

    if (error) {
      console.error('Error recording quiz attempt:', error);
      return null;
    }
    return data;
  },

  // Delete a quiz
  async deleteQuiz(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) {
      console.error('Error deleting quiz:', error);
      return false;
    }
    return true;
  },
};
