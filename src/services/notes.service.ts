import { createClient } from '@/lib/supabase/client';
import { getCurrentUserId } from '@/lib/supabase/authHelper';

export interface NoteItem {
  id: string;
  user_id?: string;
  roadmap_id?: string;
  topic_id?: string;
  title: string;
  content: string;
  source: 'manual' | 'ai_generated' | 'document';
  created_at?: string;
  updated_at?: string;
}

export const notesService = {
  // Fetch all notes for the current authenticated user
  async getAllNotes(): Promise<NoteItem[]> {
    const supabase = createClient();
    const userId = await getCurrentUserId();

    let query = supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
    return data || [];
  },

  // Create a new note for the current user
  async createNote(note: Omit<NoteItem, 'id'>): Promise<NoteItem | null> {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    const noteData = userId ? { ...note, user_id: userId } : note;

    const { data, error } = await supabase
      .from('notes')
      .insert([noteData])
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }
    return data;
  },

  // Update an existing note
  async updateNote(id: string, updates: Partial<NoteItem>): Promise<NoteItem | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return null;
    }
    return data;
  },

  // Delete a note
  async deleteNote(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
      return false;
    }
    return true;
  },
};
