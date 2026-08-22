import { createClient } from '@/lib/supabase/client';

export interface ConversationItem {
  id: string;
  user_id?: string;
  roadmap_id?: string;
  topic_id?: string;
  title: string;
  module_type: string;
  summary?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessageItem {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

export const chatService = {
  // Fetch all conversations for current user
  async getConversations(): Promise<ConversationItem[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
    return data || [];
  },

  // Create a new conversation session
  async createConversation(title: string, moduleType: string = 'tutor'): Promise<ConversationItem | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ title, module_type: moduleType }])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    return data;
  },

  // Fetch all messages for a specific conversation
  async getMessages(conversationId: string): Promise<ChatMessageItem[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    return data || [];
  },

  // Append a new message to a conversation
  async sendMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<ChatMessageItem | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{ conversation_id: conversationId, role, content }])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    // Update updated_at timestamp on the conversation
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);

    return data;
  },

  // Delete a conversation and all associated chat messages
  async deleteConversation(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
    return true;
  },
};
