import { createClient } from '@/lib/supabase/client';
import { getCurrentUserId } from '@/lib/supabase/authHelper';

export interface TaskItem {
  id: string;
  user_id?: string;
  topic_id?: string;
  title: string;
  description?: string;
  task_type?: string;
  priority?: 'High' | 'Medium' | 'Low';
  status?: 'Completed' | 'In Progress' | 'Pending';
  estimated_minutes?: number;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
}

export const taskService = {
  // Fetch all tasks for the current authenticated user
  async getAllTasks(): Promise<TaskItem[]> {
    const supabase = createClient();
    const userId = await getCurrentUserId();

    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    return data || [];
  },

  // Create a new task for the current user
  async createTask(task: Omit<TaskItem, 'id'>): Promise<TaskItem | null> {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    const taskData = userId ? { ...task, user_id: userId } : task;

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }
    return data;
  },

  // Update task status or priority
  async updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return null;
    }
    return data;
  },

  // Delete a task
  async deleteTask(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }
    return true;
  },
};
