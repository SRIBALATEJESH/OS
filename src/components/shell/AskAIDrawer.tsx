'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  BookOpen,
  Code2,
  Lightbulb,
  MapPin,
  FileText,
  BrainCircuit,
  Plus,
  CheckCircle2,
  Loader2,
  Layers,
  Zap,
} from 'lucide-react';

export type AICreatorType = 'chat' | 'roadmap' | 'quiz' | 'note' | 'coding';

interface AskAIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AICreatorType;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const AskAIDrawer: React.FC<AskAIDrawerProps> = ({ isOpen, onClose, initialMode = 'chat' }) => {
  const [activeTab, setActiveTab] = useState<AICreatorType>(initialMode);

  /* ── 1. AI Tutor Chat State ── */
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Hello! I am your StudyFlow AI Tutor. Select an AI Creation tool above or ask any doubt to get started!',
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatGenerating, setIsChatGenerating] = useState(false);

  /* ── 2. AI Roadmap Creator State ── */
  const [roadmapGoal, setRoadmapGoal] = useState('');
  const [roadmapLevel, setRoadmapLevel] = useState('Intermediate');
  const [roadmapDuration, setRoadmapDuration] = useState('2 months');
  const [isRoadmapCreating, setIsRoadmapCreating] = useState(false);
  const [roadmapCreatedSuccess, setRoadmapCreatedSuccess] = useState(false);

  /* ── 3. AI Quiz Creator State ── */
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState('Intermediate');
  const [quizQuestionCount, setQuizQuestionCount] = useState('10 Questions');
  const [isQuizCreating, setIsQuizCreating] = useState(false);
  const [quizCreatedSuccess, setQuizCreatedSuccess] = useState(false);

  /* ── 4. AI Note Creator State ── */
  const [noteTopic, setNoteTopic] = useState('');
  const [noteStyle, setNoteStyle] = useState('Detailed Explanation with Code');
  const [noteDepth, setNoteDepth] = useState('Comprehensive');
  const [isNoteCreating, setIsNoteCreating] = useState(false);
  const [noteCreatedSuccess, setNoteCreatedSuccess] = useState(false);

  /* ── 5. AI Coding Challenge Creator State ── */
  const [codingTopic, setCodingTopic] = useState('');
  const [codingLang, setCodingLang] = useState('Java');
  const [codingDifficulty, setCodingDifficulty] = useState('Hard');
  const [isCodingCreating, setIsCodingCreating] = useState(false);
  const [codingCreatedSuccess, setCodingCreatedSuccess] = useState(false);

  /* Handler: Chat message send via Gemini 3.5 Flash-Lite */
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatGenerating) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    const prompt = chatInput.trim();
    setChatInput('');
    setIsChatGenerating(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          topic: 'General Study Doubt',
          recentMessages: messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      const json = await res.json();
      const replyText = json?.text || json?.response || json?.reply || 'I am ready to help you with your studies!';

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('[AskAIDrawer] Chat AI error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'Sorry, I encountered an issue connecting to Gemini AI. Please try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatGenerating(false);
    }
  };

  /* Creator Handlers with Gemini AI generation & persistence */
  const handleGenerateRoadmap = async () => {
    if (isRoadmapCreating) return;
    setIsRoadmapCreating(true);

    try {
      const res = await fetch('/api/ai/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: roadmapGoal,
          targetDuration: roadmapDuration,
          skillLevel: roadmapLevel,
        }),
      });
      const data = await res.json();

      const newRoadmap = {
        id: `roadmap-${Date.now()}`,
        title: roadmapGoal,
        category: 'AI Generated',
        level: roadmapLevel,
        status: 'In Progress',
        completion: 0,
        nodesCount: data?.nodes?.length || 5,
        color: 'from-[#10B981] to-[#059669]',
        updated: 'Just now',
        nodes: data?.nodes,
        edges: data?.edges,
      };

      const existing = JSON.parse(localStorage.getItem('studyflow_custom_roadmaps') || '[]');
      localStorage.setItem('studyflow_custom_roadmaps', JSON.stringify([newRoadmap, ...existing]));
      window.dispatchEvent(new CustomEvent('studyflow-roadmaps-updated'));

      setIsRoadmapCreating(false);
      setRoadmapCreatedSuccess(true);
      setTimeout(() => setRoadmapCreatedSuccess(false), 2500);
    } catch (err) {
      console.error('[AskAIDrawer] Generate roadmap error:', err);
      setIsRoadmapCreating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (isQuizCreating) return;
    setIsQuizCreating(true);

    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: quizTopic,
          difficulty: quizDifficulty,
          count: parseInt(quizQuestionCount) || 5,
        }),
      });
      const data = await res.json();

      const newQuiz = {
        id: `quiz-${Date.now()}`,
        title: `${quizTopic} Practice Quiz`,
        topic: quizTopic,
        questionsCount: data?.questions?.length || 5,
        difficulty: quizDifficulty,
        bestScore: 0,
        lastPlayed: 'Just now',
        questionsData: data?.questions || [],
      };

      const existing = JSON.parse(localStorage.getItem('studyflow_quizzes') || '[]');
      localStorage.setItem('studyflow_quizzes', JSON.stringify([newQuiz, ...existing]));
      window.dispatchEvent(new CustomEvent('studyflow-quizzes-updated'));

      setIsQuizCreating(false);
      setQuizCreatedSuccess(true);
      setTimeout(() => setQuizCreatedSuccess(false), 2500);
    } catch (err) {
      console.error('[AskAIDrawer] Generate quiz error:', err);
      setIsQuizCreating(false);
    }
  };

  const handleGenerateNote = async () => {
    if (isNoteCreating) return;
    setIsNoteCreating(true);

    try {
      const res = await fetch('/api/ai/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: noteTopic,
          style: noteStyle,
          depth: noteDepth,
        }),
      });
      const data = await res.json();
      const noteContent = data?.note?.content || data?.note || `# ${noteTopic}\n\nComprehensive study notes.`;

      const newNote = {
        id: `note-${Date.now()}`,
        title: noteTopic,
        topic: 'AI Generated Note',
        updatedDate: 'Just now',
        readTime: '4 min read',
        preview: typeof noteContent === 'string' ? noteContent.slice(0, 120) + '...' : `Study note on ${noteTopic}`,
        content: typeof noteContent === 'string' ? noteContent : `# ${noteTopic}\n\nStructured study note.`,
      };

      const existing = JSON.parse(localStorage.getItem('studyflow_notes') || '[]');
      localStorage.setItem('studyflow_notes', JSON.stringify([newNote, ...existing]));
      window.dispatchEvent(new CustomEvent('studyflow-notes-updated'));

      setIsNoteCreating(false);
      setNoteCreatedSuccess(true);
      setTimeout(() => setNoteCreatedSuccess(false), 2500);
    } catch (err) {
      console.error('[AskAIDrawer] Generate note error:', err);
      setIsNoteCreating(false);
    }
  };

  const handleGenerateCoding = async () => {
    if (isCodingCreating) return;
    setIsCodingCreating(true);

    try {
      const res = await fetch('/api/ai/coding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: codingTopic,
          language: codingLang,
          difficulty: codingDifficulty,
        }),
      });
      const data = await res.json();
      const problemObj = data?.problem;

      const newChallenge = {
        id: `code-${Date.now()}`,
        title: problemObj?.title || codingTopic,
        language: codingLang,
        difficulty: codingDifficulty,
        status: 'Unsolved',
        description: problemObj?.description || `Implement ${codingTopic} algorithm in ${codingLang}.`,
        starterCode: problemObj?.starterCode,
        testCases: problemObj?.testCases,
      };

      const existing = JSON.parse(localStorage.getItem('studyflow_coding_challenges') || '[]');
      localStorage.setItem('studyflow_coding_challenges', JSON.stringify([newChallenge, ...existing]));
      window.dispatchEvent(new CustomEvent('studyflow-coding-updated'));

      setIsCodingCreating(false);
      setCodingCreatedSuccess(true);
      setTimeout(() => setCodingCreatedSuccess(false), 2500);
    } catch (err) {
      console.error('[AskAIDrawer] Generate coding error:', err);
      setIsCodingCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* AI Drawer Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed top-10 bottom-10 left-4 right-4 max-w-3xl mx-auto z-50 glass-card rounded-3xl border border-[#10B981]/40 bg-[#121824]/95 text-gray-100 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#121824] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#059669] text-white flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F9FAFB]">StudyFlow AI Studio</h2>
                  <p className="text-xs text-[#9CA3AF]">Create Roadmaps, Quizzes, Notes, Coding Challenges & Ask Doubts</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SEPARATE CREATION TABS BAR */}
            <div className="px-4 py-2.5 bg-black/40 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${activeTab === 'chat' ? 'bg-[#10B981] text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-[#9CA3AF] hover:text-white'}`}
              >
                <Bot className="h-3.5 w-3.5" /> AI Doubt Tutor
              </button>

              <button
                onClick={() => setActiveTab('roadmap')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${activeTab === 'roadmap' ? 'bg-[#10B981] text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-[#9CA3AF] hover:text-white'}`}
              >
                <MapPin className="h-3.5 w-3.5" /> AI Roadmap
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${activeTab === 'quiz' ? 'bg-[#10B981] text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-[#9CA3AF] hover:text-white'}`}
              >
                <BrainCircuit className="h-3.5 w-3.5" /> AI Quiz
              </button>

              <button
                onClick={() => setActiveTab('note')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${activeTab === 'note' ? 'bg-[#10B981] text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-[#9CA3AF] hover:text-white'}`}
              >
                <FileText className="h-3.5 w-3.5" /> AI Notes
              </button>

              <button
                onClick={() => setActiveTab('coding')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${activeTab === 'coding' ? 'bg-[#10B981] text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-[#9CA3AF] hover:text-white'}`}
              >
                <Code2 className="h-3.5 w-3.5" /> AI Coding Challenge
              </button>
            </div>

            {/* TAB 1: AI DOUBT TUTOR CHAT */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.sender === 'ai' && (
                        <div className="h-8 w-8 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0 mt-1">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                      <div className={`max-w-[82%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed whitespace-pre-line ${m.sender === 'user' ? 'bg-[#10B981] text-white rounded-br-none font-medium' : 'bg-white/5 border border-white/10 text-[#F9FAFB] rounded-bl-none'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {isChatGenerating && (
                    <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#10B981]" /> AI is thinking...
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[#121824] border-t border-white/10 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Ask any study doubt or concept explanation..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                  <button onClick={handleSendChat} className="px-4 py-2.5 rounded-xl bg-[#10B981] text-white font-bold text-xs flex items-center gap-1">
                    <Send className="h-3.5 w-3.5" /> Send
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: AI ROADMAP CREATOR */}
            {activeTab === 'roadmap' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <MapPin className="h-5 w-5 text-[#10B981]" />
                  <h3 className="text-sm font-bold text-[#F9FAFB]">Generate Custom AI 2D Canvas Roadmap</h3>
                </div>

                {roadmapCreatedSuccess ? (
                  <div className="py-12 text-center space-y-2">
                    <CheckCircle2 className="h-12 w-12 text-[#10B981] mx-auto animate-bounce" />
                    <h4 className="text-base font-bold text-[#F9FAFB]">AI Canvas Roadmap Generated!</h4>
                    <p className="text-xs text-[#9CA3AF]">Added to your interactive Roadmap Canvas Library.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-[#F9FAFB] mb-1">Learning Objective</label>
                      <textarea
                        value={roadmapGoal}
                        onChange={(e) => setRoadmapGoal(e.target.value)}
                        rows={3}
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-[#F9FAFB] mb-1">Experience Level</label>
                        <select value={roadmapLevel} onChange={(e) => setRoadmapLevel(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#121824] border border-white/10 text-xs text-[#F9FAFB]">
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[#F9FAFB] mb-1">Target Duration</label>
                        <input
                          type="text"
                          value={roadmapDuration}
                          onChange={(e) => setRoadmapDuration(e.target.value)}
                          placeholder="e.g. 2 weeks, 3 months"
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateRoadmap}
                      disabled={isRoadmapCreating}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                    >
                      {isRoadmapCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      <span>Generate 2D Canvas Roadmap</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AI QUIZ CREATOR */}
            {activeTab === 'quiz' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <BrainCircuit className="h-5 w-5 text-[#10B981]" />
                  <h3 className="text-sm font-bold text-[#F9FAFB]">Generate AI Practice Quiz</h3>
                </div>

                {quizCreatedSuccess ? (
                  <div className="py-12 text-center space-y-2">
                    <CheckCircle2 className="h-12 w-12 text-[#10B981] mx-auto animate-bounce" />
                    <h4 className="text-base font-bold text-[#F9FAFB]">AI Quiz Generated & Added!</h4>
                    <p className="text-xs text-[#9CA3AF]">Ready to play in Quiz Center.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-[#F9FAFB] mb-1">Quiz Topic</label>
                      <input
                        type="text"
                        value={quizTopic}
                        onChange={(e) => setQuizTopic(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-[#F9FAFB] mb-1">Difficulty</label>
                        <select value={quizDifficulty} onChange={(e) => setQuizDifficulty(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#121824] border border-white/10 text-xs text-[#F9FAFB]">
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[#F9FAFB] mb-1">Question Count</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={quizQuestionCount}
                          onChange={(e) => setQuizQuestionCount(e.target.value)}
                          placeholder="Custom count (e.g. 7)"
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateQuiz}
                      disabled={isQuizCreating}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                    >
                      {isQuizCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                      <span>Generate Quiz Questions</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: AI NOTES CREATOR */}
            {activeTab === 'note' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <FileText className="h-5 w-5 text-[#10B981]" />
                  <h3 className="text-sm font-bold text-[#F9FAFB]">Draft AI Structured Study Notes</h3>
                </div>

                {noteCreatedSuccess ? (
                  <div className="py-12 text-center space-y-2">
                    <CheckCircle2 className="h-12 w-12 text-[#10B981] mx-auto animate-bounce" />
                    <h4 className="text-base font-bold text-[#F9FAFB]">Structured AI Note Created!</h4>
                    <p className="text-xs text-[#9CA3AF]">Added to My Notes library.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-[#F9FAFB] mb-1">Subject Topic</label>
                      <input
                        type="text"
                        value={noteTopic}
                        onChange={(e) => setNoteTopic(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-[#F9FAFB] mb-1">Formatting Style</label>
                        <select value={noteStyle} onChange={(e) => setNoteStyle(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#121824] border border-white/10 text-xs text-[#F9FAFB]">
                          <option>Detailed Explanation</option>
                          <option>Summary Bullets</option>
                          <option>Code & Syntax Focused</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[#F9FAFB] mb-1">Depth</label>
                        <select value={noteDepth} onChange={(e) => setNoteDepth(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#121824] border border-white/10 text-xs text-[#F9FAFB]">
                          <option>Standard</option>
                          <option>Comprehensive</option>
                          <option>Rapid Revision</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateNote}
                      disabled={isNoteCreating}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                    >
                      {isNoteCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                      <span>Generate Study Notes</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: AI CODING CHALLENGE CREATOR */}
            {activeTab === 'coding' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <Code2 className="h-5 w-5 text-[#10B981]" />
                  <h3 className="text-sm font-bold text-[#F9FAFB]">Generate AI Coding Challenge</h3>
                </div>

                {codingCreatedSuccess ? (
                  <div className="py-12 text-center space-y-2">
                    <CheckCircle2 className="h-12 w-12 text-[#10B981] mx-auto animate-bounce" />
                    <h4 className="text-base font-bold text-[#F9FAFB]">Coding Problem Generated!</h4>
                    <p className="text-xs text-[#9CA3AF]">Added to Interactive Coding Playground.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-[#F9FAFB] mb-1">Target Problem Topic</label>
                      <input
                        type="text"
                        value={codingTopic}
                        onChange={(e) => setCodingTopic(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-[#F9FAFB] mb-1">Target Language</label>
                        <select value={codingLang} onChange={(e) => setCodingLang(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#121824] border border-white/10 text-xs text-[#F9FAFB]">
                          <option>Java</option>
                          <option>JavaScript</option>
                          <option>Python</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[#F9FAFB] mb-1">Difficulty</label>
                        <select value={codingDifficulty} onChange={(e) => setCodingDifficulty(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#121824] border border-white/10 text-xs text-[#F9FAFB]">
                          <option>Easy</option>
                          <option>Medium</option>
                          <option>Hard</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateCoding}
                      disabled={isCodingCreating}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                    >
                      {isCodingCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Code2 className="h-4 w-4" />}
                      <span>Generate Coding Challenge</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
