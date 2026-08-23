'use client';

import React, { useState, useRef, useEffect } from 'react';
import { getUserScopedKey } from '@/lib/supabase/authHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Sparkles, 
  Search, 
  Pin, 
  Archive, 
  Trash2, 
  Edit3, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Copy, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown, 
  ChevronRight, 
  MessageSquare, 
  BrainCircuit, 
  FileText, 
  Code2, 
  Check, 
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { NavItemKey } from '@/types';
import { FormattedMarkdown } from '@/components/ui/FormattedMarkdown';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  codeSnippet?: string;
  codeLanguage?: string;
}

interface ChatConversation {
  id: string;
  title: string;
  topic: string;
  lastMessage: string;
  lastActive: string;
  messageCount: number;
  messages: ChatMessage[];
  topicProgress?: number;
  weakAreas?: string;
  isPinned?: boolean;
}

interface AITutorViewProps {
  initialTopic?: string;
  onNavigate?: (key: NavItemKey, topic?: string) => void;
}

export const AITutorView: React.FC<AITutorViewProps> = ({ initialTopic, onNavigate }) => {
  const [viewMode, setViewMode] = useState<'library' | 'chat'>('chat');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [activeTopic, setActiveTopic] = useState<string>(initialTopic || 'Express Middleware');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Editing state for user prompts
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Dynamic Related Study Assets loaded from localStorage
  const [relatedNotes, setRelatedNotes] = useState<any[]>([]);
  const [relatedQuizzes, setRelatedQuizzes] = useState<any[]>([]);
  const [relatedCoding, setRelatedCoding] = useState<any[]>([]);

  // New Custom Topic Modal State
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');

  const defaultQuickTopics = [
    '🚀 Express Middleware',
    '🌳 Binary Search Trees',
    '⚡ Async/Await & Event Loop',
    '💾 SQL Joins & B-Tree Indexing',
    '☕ Java Multithreading & Concurrency',
    '🌐 System Design: Distributed Caching',
  ];

  // Helper to save conversations to localStorage
  const saveConversations = (updated: ChatConversation[]) => {
    setConversations(updated);
    try {
      localStorage.setItem(getUserScopedKey('studyflow_saved_tutor_sessions'), JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save AI Tutor sessions to localStorage', e);
    }
  };

  // Load conversations and related study assets from localStorage on mount
  useEffect(() => {
    try {
      // 1. Load Tutor Sessions
      const saved = localStorage.getItem(getUserScopedKey('studyflow_saved_tutor_sessions'));
      let loadedConversations: ChatConversation[] = saved ? JSON.parse(saved) : [];

      if (loadedConversations.length === 0) {
        const defaultTopic = initialTopic || 'Express Middleware';
        const defaultId = 'chat-default-1';
        const defaultSession: ChatConversation = {
          id: defaultId,
          title: `Study Session: ${defaultTopic}`,
          topic: defaultTopic,
          lastMessage: `Welcome to your AI Tutor workspace for **${defaultTopic}**! Ask me anything about ${defaultTopic}, request concept explanations, or ask for step-by-step code solutions.`,
          lastActive: 'Just now',
          messageCount: 1,
          topicProgress: 72,
          weakAreas: 'Error-handling 4-arity signature',
          messages: [
            {
              id: 'msg-init-1',
              sender: 'ai',
              text: `Welcome to your AI Tutor workspace for **${defaultTopic}**! Ask me anything about ${defaultTopic}, request concept explanations, or ask for step-by-step code solutions.`,
              timestamp: 'Just now',
            },
          ],
        };
        loadedConversations = [defaultSession];
        try {
          localStorage.setItem(getUserScopedKey('studyflow_saved_tutor_sessions'), JSON.stringify(loadedConversations));
        } catch (e) {}
      }

      setConversations(loadedConversations);

      const active = loadedConversations.find(c => initialTopic ? c.topic.toLowerCase().includes(initialTopic.toLowerCase()) : true) || loadedConversations[0];
      setActiveChatId(active.id);
      setActiveTopic(active.topic);
      setMessages(active.messages || []);

      // 2. Load Related Study Assets from localStorage
      const savedNotesStr = localStorage.getItem(getUserScopedKey('studyflow_saved_notes'));
      if (savedNotesStr) setRelatedNotes(JSON.parse(savedNotesStr));

      const savedQuizzesStr = localStorage.getItem(getUserScopedKey('studyflow_saved_quizzes'));
      if (savedQuizzesStr) setRelatedQuizzes(JSON.parse(savedQuizzesStr));

      const savedCodingStr = localStorage.getItem(getUserScopedKey('studyflow_saved_coding_problems'));
      if (savedCodingStr) setRelatedCoding(JSON.parse(savedCodingStr));

    } catch (e) {
      console.warn('Error initializing AI Tutor View data', e);
    }
  }, [initialTopic]);

  // Select active conversation
  const handleSelectConversation = (conv: ChatConversation) => {
    setActiveChatId(conv.id);
    setActiveTopic(conv.topic);
    setMessages(conv.messages || []);
    setViewMode('chat');
  };

  // Create new conversation with custom user topic
  const handleCreateNewChat = (topicName?: string, customTitle?: string) => {
    const targetTopic = topicName || customTopicInput.trim() || 'Express Middleware';
    const targetTitle = customTitle || customTitleInput.trim() || `Study Session: ${targetTopic}`;
    const newId = 'chat-' + Date.now();

    const initMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: `👋 Hi! I'm your AI Tutor powered by Gemini 3.5 Flash-Lite for **${targetTopic}**. Ask me any doubt, concept explanation, or code request!`,
      timestamp: 'Just now',
    };

    const newConv: ChatConversation = {
      id: newId,
      title: targetTitle,
      topic: targetTopic,
      lastMessage: initMsg.text,
      lastActive: 'Just now',
      messageCount: 1,
      topicProgress: 45,
      weakAreas: `Core principles & syntax of ${targetTopic}`,
      messages: [initMsg],
    };

    const updated = [newConv, ...conversations];
    saveConversations(updated);
    setActiveChatId(newId);
    setActiveTopic(targetTopic);
    setMessages([initMsg]);
    setIsNewTopicModalOpen(false);
    setCustomTopicInput('');
    setCustomTitleInput('');
    setViewMode('chat');
  };

  // Delete conversation handler
  const handleDeleteConversation = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Delete this AI Tutor conversation session permanently?')) {
      const updated = conversations.filter(c => c.id !== id);
      saveConversations(updated);

      if (activeChatId === id) {
        if (updated.length > 0) {
          handleSelectConversation(updated[0]);
        } else {
          handleCreateNewChat('General Topic');
        }
      }
    }
  };

  const activeChat = conversations.find(c => c.id === activeChatId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isAiThinking) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: now,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsAiThinking(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text.trim(),
          topic: activeTopic,
          recentMessages: messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      const json = await res.json();
      const aiText = json?.response || 'Sorry, I could not get a response right now. Please try again.';

      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...updatedMessages, aiReply];
      setMessages(finalMessages);

      // Extract potential weak area dynamically from prompt text
      let detectedWeakArea = activeChat?.weakAreas || `Core concepts & syntax of ${activeTopic}`;
      const lower = text.toLowerCase();
      if (lower.includes('error') || lower.includes('exception') || lower.includes('bug') || lower.includes('fail')) {
        detectedWeakArea = `Error-handling & edge cases in ${activeTopic}`;
      } else if (lower.includes('performance') || lower.includes('speed') || lower.includes('optimize') || lower.includes('fast')) {
        detectedWeakArea = `Performance tuning & time complexity in ${activeTopic}`;
      } else if (lower.includes('async') || lower.includes('promise') || lower.includes('thread') || lower.includes('concurrency')) {
        detectedWeakArea = `Asynchronous execution & concurrency control`;
      } else if (lower.includes('syntax') || lower.includes('how to') || lower.includes('example') || lower.includes('code')) {
        detectedWeakArea = `Practical syntax implementation & API details`;
      } else if (lower.includes('interview') || lower.includes('question') || lower.includes('test')) {
        detectedWeakArea = `Advanced interview questions & practical scenarios`;
      }

      // Dynamically calculate topic progress
      const newProgress = Math.min(95, Math.max(30, (activeChat?.topicProgress || 45) + 5));

      // Save updated messages, topicProgress, and weakAreas to state & localStorage
      const updatedConvs = conversations.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            lastMessage: text.trim(),
            lastActive: 'Just now',
            messageCount: finalMessages.length,
            topicProgress: newProgress,
            weakAreas: detectedWeakArea,
            messages: finalMessages,
          };
        }
        return c;
      });
      saveConversations(updatedConvs);

    } catch (err) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: '⚠️ Network error connecting to AI Tutor. Check your GEMINI_API_KEY in .env.local.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEditMessage = async (msgId: string) => {
    if (!editingText.trim() || isAiThinking) return;

    const targetIdx = messages.findIndex((m) => m.id === msgId);
    if (targetIdx === -1) return;

    const updatedUserMsg: ChatMessage = {
      ...messages[targetIdx],
      text: editingText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const truncatedMessages = [...messages.slice(0, targetIdx), updatedUserMsg];
    setMessages(truncatedMessages);
    setEditingMessageId(null);
    setEditingText('');
    setIsAiThinking(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: editingText.trim(),
          topic: activeTopic,
          recentMessages: truncatedMessages.slice(0, targetIdx).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      const json = await res.json();
      const aiText = json?.response || 'Sorry, I could not get a response right now. Please try again.';

      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...truncatedMessages, aiReply];
      setMessages(finalMessages);

      const updatedConvs = conversations.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            lastMessage: editingText.trim(),
            lastActive: 'Just now',
            messageCount: finalMessages.length,
            messages: finalMessages,
          };
        }
        return c;
      });
      saveConversations(updatedConvs);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: '⚠️ Network error connecting to AI Tutor. Check your GEMINI_API_KEY in .env.local.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const quickPrompts = [
    'Explain this simply',
    'Give me a code example',
    'Quiz me on this topic',
    'Give me a coding problem',
    'Summarize our discussion'
  ];

  return (
    <div className="h-full w-full flex flex-col overflow-hidden animate-fade-in">
      
      {/* SCREEN 08: CONVERSATION LIBRARY VIEW MODE */}
      {viewMode === 'library' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/10">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#F9FAFB]">AI Tutor Conversations</h1>
              <p className="text-xs md:text-sm text-[#9CA3AF]">
                Continue a learning discussion or start a new AI tutoring chat.
              </p>
            </div>

            <button
              onClick={() => { setViewMode('chat'); }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Library Search & Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Library List (7 Cols) */}
            <div className="lg:col-span-7 glass-card rounded-3xl p-6 border border-white/10 bg-[#121824]/80 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search AI tutor chats..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 text-xs bg-white/5 text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              {/* Chat Cards */}
              <div className="space-y-2.5">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`
                      p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 group relative
                      ${activeChatId === c.id
                        ? 'bg-[#10B981]/20 border-[#10B981]'
                        : 'bg-white/5 border-white/10 hover:border-[#10B981]/40'
                      }
                    `}
                    onClick={() => { setActiveChatId(c.id); setViewMode('chat'); }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {c.isPinned && <Pin className="h-3.5 w-3.5 text-[#10B981] fill-current" />}
                        <span className="text-xs font-bold text-[#F9FAFB]">{c.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#9CA3AF]">{c.lastActive}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete conversation "${c.title}"?`)) {
                              setConversations(prev => prev.filter(item => item.id !== c.id));
                              if (activeChatId === c.id) {
                                const remaining = conversations.filter(item => item.id !== c.id);
                                if (remaining.length > 0) setActiveChatId(remaining[0].id);
                              }
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-[#9CA3AF] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-[#34D399] bg-[#10B981]/20 border border-[#10B981]/30 px-2 py-0.5 rounded-md inline-block">
                      {c.topic}
                    </span>

                    <p className="text-xs text-[#9CA3AF] line-clamp-1">{c.lastMessage}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Preview Box (5 Cols) */}
            <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-white/10 bg-[#121824]/80 space-y-4">
              <span className="text-[10px] uppercase font-bold text-[#10B981]">Selected Conversation</span>
              <h3 className="text-base font-bold text-[#F9FAFB]">{activeChat?.title || 'No chat selected'}</h3>
              <p className="text-xs text-[#9CA3AF]">{activeChat?.topic || 'Start a new chat'} • {activeChat?.messageCount || 0} messages</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-[#F9FAFB] italic">
                "{activeChat?.lastMessage || 'Click New Chat to start a conversation with Gemini 3.5 Flash-Lite'}"
              </div>

              <button
                onClick={() => setViewMode('chat')}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Continue Conversation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 09: FULL INTERACTIVE AI CHAT INTERFACE MODE */}
      {viewMode === 'chat' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 h-full min-h-0 w-full overflow-hidden">
          
          {/* LEFT CONVERSATIONS SIDEBAR */}
          <div className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 glass-card rounded-3xl p-4 border border-white/10 bg-[#121824]/80 space-y-4 overflow-y-auto h-full min-h-0 custom-scrollbar">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setViewMode('library')}
                className="text-xs text-[#9CA3AF] hover:text-[#F9FAFB] flex items-center gap-1 font-semibold"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Library
              </button>

              <button
                onClick={() => setIsNewTopicModalOpen(true)}
                className="p-1.5 rounded-xl bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30 hover:bg-[#10B981] hover:text-white transition-all flex items-center gap-1 text-[11px] font-bold"
                title="New Chat Session"
              >
                <Plus className="h-3.5 w-3.5" /> New
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectConversation(c)}
                  className={`
                    p-3 rounded-2xl border transition-all cursor-pointer text-xs space-y-1 group relative
                    ${activeChatId === c.id
                      ? 'bg-[#10B981] text-white border-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-white/5 border-white/10 text-[#F9FAFB] hover:border-[#10B981]/40'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold truncate pr-4">{c.title}</div>
                    <button
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      className={`p-1 rounded-md transition-all ${activeChatId === c.id ? 'hover:bg-black/30 text-white' : 'hover:bg-red-500/20 text-[#9CA3AF] hover:text-red-400 opacity-0 group-hover:opacity-100'}`}
                      title="Delete Chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className={`text-[10px] truncate ${activeChatId === c.id ? 'opacity-90' : 'text-[#9CA3AF]'}`}>
                    {c.topic}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER CHAT WORKSPACE (Dynamic flex-1 expanded width) */}
          <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden glass-card rounded-3xl border border-white/10 bg-[#121824]/90">
            
            {/* Chat Top Header */}
            <div className="p-4 border-b border-white/10 bg-[#121824] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-sm font-bold text-[#F9FAFB]">
                  {activeChat?.title || 'AI Tutor Chat'}
                </h2>
                <div className="text-[11px] text-[#10B981] font-semibold">
                  Topic: {activeTopic}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => activeChat && handleDeleteConversation(activeChat.id, e)}
                  className="px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1"
                  title="Delete Chat Session"
                >
                  <Trash2 className="h-3 w-3" /> Clear Session
                </button>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                  <Sparkles className="h-3 w-3" />
                  <span>Topic Memory Active</span>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0 custom-scrollbar">
              {messages.length === 0 && !isAiThinking && (
                <div className="text-center text-xs text-[#9CA3AF] py-8 space-y-2">
                  <Sparkles className="h-8 w-8 text-[#10B981]/50 mx-auto" />
                  <p className="font-semibold">Powered by Gemini 3.5 Flash-Lite</p>
                  <p>Ask me anything about your study topics!</p>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col group ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`
                      max-w-full md:max-w-[96%] w-full rounded-2xl p-4 text-xs leading-relaxed space-y-2 relative overflow-hidden
                      ${m.sender === 'user'
                        ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-tr-none shadow-[0_0_15px_rgba(16,185,129,0.2)] ml-auto max-w-[85%]'
                        : 'bg-white/5 text-[#F9FAFB] border border-white/10 rounded-tl-none w-full'
                      }
                    `}
                  >
                    {m.sender === 'user' ? (
                      editingMessageId === m.id ? (
                        <div className="w-full space-y-2 p-1 min-w-[260px]">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-[#0B0F17] text-[#F9FAFB] border border-[#10B981] text-xs focus:outline-none resize-none"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-2 text-[10px]">
                            <button
                              onClick={handleCancelEdit}
                              className="px-2.5 py-1 rounded-lg bg-white/10 text-[#9CA3AF] hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEditMessage(m.id)}
                              className="px-3 py-1 rounded-lg bg-[#10B981] text-white font-semibold hover:bg-[#0D9668] flex items-center gap-1 shadow-sm"
                            >
                              Save & Resubmit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{m.text}</div>
                      )
                    ) : (
                      <div className="w-full overflow-x-auto custom-scrollbar text-xs leading-relaxed font-normal text-[#F9FAFB]">
                        <FormattedMarkdown content={m.text} />
                      </div>
                    )}

                    {/* Code Snippet Box */}
                    {m.codeSnippet && (
                      <div className="rounded-xl bg-[#0B0F17] text-emerald-300 p-3 font-mono text-[11px] border border-white/10 overflow-x-auto space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] pb-1 border-b border-white/10">
                          <span>{m.codeLanguage || 'code'}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(m.codeSnippet || '')}
                            className="hover:text-white flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" /> Copy
                          </button>
                        </div>
                        <pre>{m.codeSnippet}</pre>
                      </div>
                    )}
                  </div>

                  {/* Message Timestamp & Action Row */}
                  <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-[#9CA3AF]">
                    <span>{m.timestamp}</span>
                    {m.sender === 'user' && editingMessageId !== m.id && (
                      <button
                        onClick={() => handleStartEdit(m)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#10B981] flex items-center gap-1 font-medium"
                        title="Edit prompt and regenerate response"
                      >
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* AI Typing Indicator — live Gemini thinking animation */}
              {isAiThinking && (
                <div className="flex flex-col items-start">
                  <div className="max-w-[88%] rounded-2xl p-4 bg-white/5 border border-white/10 rounded-tl-none flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[11px] text-[#9CA3AF]">Gemini 3.5 Flash-Lite thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>{/* END Messages Scroll Area */}

            {/* Quick Prompt Pills Bar */}
            <div className="px-4 py-2 bg-[#0B0F17]/80 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(qp)}
                  className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#10B981] shrink-0 font-medium transition-all"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Bottom Composer Box */}
            <div className="p-3 bg-[#121824] border-t border-white/10 flex items-center gap-2 shrink-0">
              <button
                className="p-2 rounded-xl text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]"
                title="Attach Document"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask anything about this topic..."
                className="flex-1 px-3 py-2 text-xs bg-white/5 text-[#F9FAFB] placeholder:text-[#9CA3AF] border border-white/10 rounded-xl focus:outline-none focus:border-[#10B981]"
              />

              <button
                onClick={() => handleSendMessage()}
                className="p-2 rounded-xl bg-[#10B981] text-white hover:bg-[#059669] transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* RIGHT CONTEXT PANEL */}
          <div className="hidden xl:flex flex-col w-72 xl:w-80 shrink-0 glass-card rounded-3xl p-4 border border-white/10 bg-[#121824]/80 space-y-4 overflow-y-auto h-full min-h-0 custom-scrollbar">
            <h3 className="text-xs font-bold text-[#F9FAFB] pb-2 border-b border-white/10">Topic Context</h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 space-y-1">
                <span className="text-[10px] font-bold text-[#34D399] uppercase">Current Topic</span>
                <div className="font-bold text-[#F9FAFB]">{activeTopic}</div>
                <div className="text-[11px] text-[#9CA3AF]">{activeChat?.topicProgress || 72}% Topic Progress</div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Weak Areas</span>
                <div className="text-[11px] font-semibold text-[#F9FAFB]">{activeChat?.weakAreas || 'Core concepts & practical syntax'}</div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="text-[11px] font-bold text-[#F9FAFB] flex items-center justify-between">
                  <span>Related Study Assets</span>
                  <span className="text-[9px] text-[#10B981]">Saved Data</span>
                </div>

                {/* Related Notes Card */}
                <div
                  onClick={() => onNavigate?.('notes', activeTopic)}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold flex items-center justify-between text-[#F9FAFB] hover:border-[#10B981] transition-all cursor-pointer group"
                >
                  <span className="flex items-center gap-1.5 truncate pr-2">
                    <FileText className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                    <span className="truncate group-hover:text-[#10B981] transition-colors">
                      {relatedNotes[0]?.title || `${activeTopic} Notes`}
                    </span>
                  </span>
                  <span className="text-[#10B981] shrink-0 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                </div>

                {/* Related Quiz Card */}
                <div
                  onClick={() => onNavigate?.('quizzes', activeTopic)}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold flex items-center justify-between text-[#F9FAFB] hover:border-amber-400 transition-all cursor-pointer group"
                >
                  <span className="flex items-center gap-1.5 truncate pr-2">
                    <BrainCircuit className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="truncate group-hover:text-amber-400 transition-colors">
                      {relatedQuizzes[0]?.topic || `${activeTopic} Quiz`}
                    </span>
                  </span>
                  <span className="text-amber-400 shrink-0 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                </div>

                {/* Related Coding Problem Card */}
                <div
                  onClick={() => onNavigate?.('coding', activeTopic)}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold flex items-center justify-between text-[#F9FAFB] hover:border-[#10B981] transition-all cursor-pointer group"
                >
                  <span className="flex items-center gap-1.5 truncate pr-2">
                    <Code2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                    <span className="truncate group-hover:text-[#10B981] transition-colors">
                      {relatedCoding[0]?.title || `${activeTopic} Challenge`}
                    </span>
                  </span>
                  <span className="text-[#10B981] shrink-0 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* NEW CUSTOM TOPIC CREATION MODAL OVERLAY */}
      {isNewTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card rounded-3xl p-6 border border-white/10 bg-[#121824] max-w-lg w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#10B981]" />
                <div>
                  <h3 className="text-base font-bold text-[#F9FAFB]">Create Custom Study Session</h3>
                  <p className="text-xs text-[#9CA3AF]">Specify any custom subject or choose a quick topic preset.</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewTopicModalOpen(false)}
                className="p-1 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#F9FAFB] mb-1.5">Custom Topic Name *</label>
                <input
                  type="text"
                  value={customTopicInput}
                  onChange={(e) => {
                    setCustomTopicInput(e.target.value);
                    if (!customTitleInput) setCustomTitleInput(`Study Session: ${e.target.value}`);
                  }}
                  placeholder="e.g. Express Middleware & Error Handling"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#9CA3AF] mb-2">Or select a Suggested Topic Pill:</label>
                <div className="flex flex-wrap gap-1.5">
                  {defaultQuickTopics.map((st, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const cleanTopic = st.replace(/^[^\s]+\s/, '');
                        setCustomTopicInput(cleanTopic);
                        setCustomTitleInput(`Study Session: ${cleanTopic}`);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#F9FAFB] hover:border-[#10B981] hover:bg-[#10B981]/10 transition-all font-medium"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#F9FAFB] mb-1.5">Session Title (Optional)</label>
                <input
                  type="text"
                  value={customTitleInput}
                  onChange={(e) => setCustomTitleInput(e.target.value)}
                  placeholder={`Study Session: ${customTopicInput || 'Custom Topic'}`}
                  className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  onClick={() => setIsNewTopicModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreateNewChat(customTopicInput, customTitleInput)}
                  disabled={!customTopicInput.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Create Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
