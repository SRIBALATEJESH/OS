'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Play, 
  Sparkles, 
  FileText, 
  BrainCircuit, 
  Code2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  BookOpen, 
  Trash2, 
  Layers,
  History,
  Loader2
} from 'lucide-react';

interface TopicWorkspaceViewProps {
  topicTitle?: string;
  onBack: () => void;
  onNavigateToAITutor: () => void;
  onNavigateToNotes: () => void;
  onNavigateToQuizzes: () => void;
  onNavigateToCoding: () => void;
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface TopicDetails {
  description: string;
  objectives: string[];
  checklist: ChecklistItem[];
  relatedSubtopics: string[];
  estimatedMinutes: number;
  difficulty: string;
}

export const TopicWorkspaceView: React.FC<TopicWorkspaceViewProps> = ({
  topicTitle = 'Learning Module',
  onBack,
  onNavigateToAITutor,
  onNavigateToNotes,
  onNavigateToQuizzes,
  onNavigateToCoding,
}) => {
  const [loading, setLoading] = useState(true);
  const [topicDetails, setTopicDetails] = useState<TopicDetails>({
    description: `AI is building your study module for "${topicTitle}"...`,
    objectives: [],
    checklist: [],
    relatedSubtopics: [],
    estimatedMinutes: 45,
    difficulty: 'Intermediate',
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch AI generated topic module
  useEffect(() => {
    let isMounted = true;
    const fetchTopicData = async () => {
      setLoading(true);
      const cacheKey = `studyflow_topic_${topicTitle.replace(/\s+/g, '_')}`;
      
      // Check localStorage cache first
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (isMounted) {
            setTopicDetails(parsed);
            setChecklist(parsed.checklist || []);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to read topic cache', e);
      }

      // Fetch from Gemini 3.5 Flash-Lite AI endpoint
      try {
        const res = await fetch('/api/ai/roadmap/topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topicTitle }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.topicDetails && isMounted) {
            const details: TopicDetails = {
              description: data.topicDetails.description || `Comprehensive study module for ${topicTitle}.`,
              objectives: data.topicDetails.objectives || [
                `Master foundational concepts of ${topicTitle}`,
                `Understand practical implementation and usage`,
                `Analyze real-world scenarios and edge cases`,
                `Test knowledge with interactive practice`,
              ],
              checklist: (data.topicDetails.checklist || []).map((item: any, idx: number) => ({
                id: item.id || `ai-task-${idx}`,
                text: item.text || item,
                done: Boolean(item.done),
              })),
              relatedSubtopics: data.topicDetails.related_subtopics || [
                `${topicTitle} Core Architecture`,
                `${topicTitle} Best Practices`,
                `${topicTitle} Optimization`,
                `Advanced ${topicTitle}`,
              ],
              estimatedMinutes: data.topicDetails.estimated_minutes || 45,
              difficulty: data.topicDetails.difficulty || 'Intermediate',
            };

            setTopicDetails(details);
            setChecklist(details.checklist);
            try {
              localStorage.setItem(cacheKey, JSON.stringify(details));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Failed to generate AI topic workspace details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTopicData();
    return () => { isMounted = false; };
  }, [topicTitle]);

  const saveProgress = (items: ChecklistItem[]) => {
    const doneCount = items.filter(c => c.done).length;
    const pct = Math.round((doneCount / (items.length || 1)) * 100);
    try {
      const progressKey = `studyflow_topic_progress_${topicTitle}`;
      localStorage.setItem(progressKey, JSON.stringify({ progress: pct, completed: pct >= 100 }));
    } catch (e) {}
  };

  const toggleCheck = (id: string) => {
    setChecklist(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, done: !item.done } : item);
      saveProgress(updated);
      return updated;
    });
  };

  const handleMarkAllCompleted = () => {
    const completedItems = checklist.map(item => ({ ...item, done: true }));
    setChecklist(completedItems);
    saveProgress(completedItems);
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const newItem = { id: Date.now().toString(), text: newItemText.trim(), done: false };
    setChecklist(prev => {
      const updated = [...prev, newItem];
      saveProgress(updated);
      return updated;
    });
    setNewItemText('');
    setIsAdding(false);
  };

  const handleDeleteItem = (id: string) => {
    setChecklist(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveProgress(updated);
      return updated;
    });
  };

  const completedCount = checklist.filter(c => c.done).length;
  const progressPercent = Math.round((completedCount / (checklist.length || 1)) * 100);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* PAGE HEADER & BREADCRUMB */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF] mb-1">
            <button onClick={onBack} className="hover:text-[#F9FAFB] flex items-center gap-1 cursor-pointer">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Roadmap
            </button>
            <span>/</span>
            <span className="text-[#10B981]">Topic Workspace</span>
            <span>/</span>
            <span className="text-[#F9FAFB] font-bold">{topicTitle}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F9FAFB] flex items-center gap-2">
            {topicTitle}
            {loading && <Loader2 className="h-5 w-5 animate-spin text-[#10B981]" />}
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 max-w-3xl leading-relaxed">
            {topicDetails.description}
          </p>
        </div>

        {/* Header Action Badges & Complete Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleMarkAllCompleted}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4 text-white" />
            <span>{progressPercent >= 100 ? 'Topic Completed' : 'Mark Topic Completed'}</span>
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-[#10B981]/20 text-[#34D399] text-xs font-bold border border-[#10B981]/30">
            {progressPercent}% Complete
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#9CA3AF]">
            {topicDetails.difficulty}
          </div>
        </div>
      </div>

      {/* LOADING OVERLAY SKELETON */}
      {loading && (
        <div className="p-6 rounded-3xl bg-[#121824]/60 border border-white/10 flex items-center justify-center gap-3 text-xs text-[#9CA3AF]">
          <Sparkles className="h-4 w-4 text-[#10B981] animate-pulse" />
          <span>Generating AI Learning Objectives & Checklist via Gemini 3.5 Flash-Lite...</span>
        </div>
      )}

      {/* TWO COLUMN MAIN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT/MAIN COLUMN (8 Cols): OBJECTIVES & CHECKLIST */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Learning Objectives */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 bg-[#121824]/90 space-y-3">
            <h2 className="text-sm font-bold text-[#F9FAFB] flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#10B981]" /> Learning Objectives
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              {topicDetails.objectives.length > 0 ? (
                topicDetails.objectives.map((obj, i) => (
                  <li key={i} className="p-3 rounded-xl bg-white/5 text-[#F9FAFB] font-medium flex items-center gap-2 border border-white/5">
                    <span className="h-2 w-2 rounded-full bg-[#10B981] shrink-0" />
                    <span className="leading-snug">{obj}</span>
                  </li>
                ))
              ) : (
                <div className="text-xs text-[#9CA3AF]">Building objectives...</div>
              )}
            </ul>
          </div>

          {/* Interactive Learning Checklist */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 bg-[#121824]/90 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h2 className="text-sm font-bold text-[#F9FAFB]">Topic Checklist</h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{completedCount} of {checklist.length} tasks completed</p>
              </div>

              <button
                onClick={() => setIsAdding(true)}
                className="px-3 py-1.5 rounded-xl bg-[#10B981]/20 text-[#34D399] text-xs font-semibold hover:bg-[#10B981] hover:text-white transition-all flex items-center gap-1 border border-[#10B981]/30"
              >
                <Plus className="h-3.5 w-3.5" /> Add Task
              </button>
            </div>

            {/* Inline Add Box */}
            {isAdding && (
              <div className="p-3 rounded-2xl bg-white/5 border border-[#10B981]/40 flex items-center gap-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Enter subtopic checklist item..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#0B0F17] border border-white/10 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                />
                <button
                  onClick={handleAddItem}
                  className="px-3 py-1.5 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#0D9668]"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-2.5 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Checklist Items Stack */}
            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`
                    p-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs cursor-pointer group
                    ${item.done
                      ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#9CA3AF]'
                      : 'bg-white/5 border-white/10 text-[#F9FAFB] hover:border-[#10B981]/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {item.done ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-[#10B981] shrink-0" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 text-[#9CA3AF] shrink-0 group-hover:text-[#10B981]" />
                    )}
                    <span className={item.done ? 'line-through font-medium' : 'font-semibold'}>
                      {item.text}
                    </span>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                    className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Related Subtopics & Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-white/10 bg-[#121824]/90 space-y-2">
              <h3 className="text-xs font-bold text-[#F9FAFB] flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-[#10B981]" /> Related Subtopics
              </h3>
              <div className="space-y-1.5 text-xs">
                {topicDetails.relatedSubtopics.map((s, i) => (
                  <div key={i} className="p-2 rounded-xl bg-white/5 text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/10 cursor-pointer transition-all">
                    • {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10 bg-[#121824]/90 space-y-2">
              <h3 className="text-xs font-bold text-[#F9FAFB] flex items-center gap-1.5">
                <History className="h-4 w-4 text-[#10B981]" /> Recent Activity
              </h3>
              <div className="space-y-2 text-xs">
                <div className="text-[#9CA3AF]">✓ Module workspace generated via Gemini 3.5 Flash-Lite</div>
                <div className="text-[#9CA3AF]">📝 AI Tutor & Notes linked to current topic</div>
                <div className="text-[#9CA3AF]">💬 Topic tasks initialized</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 Cols): TOPIC ACTIONS PANEL */}
        <div className="lg:col-span-4">
          <div className="glass-card rounded-3xl p-6 border border-white/10 bg-[#121824]/90 sticky top-24 space-y-4">
            <h2 className="text-sm font-bold text-[#F9FAFB] pb-3 border-b border-white/10">Topic Actions</h2>

            <button
              onClick={onNavigateToNotes}
              className="w-full py-3 rounded-2xl bg-[#10B981] text-white text-xs font-bold hover:bg-[#0D9668] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Continue Learning</span>
            </button>

            <div className="space-y-2 pt-2">
              <button
                onClick={onNavigateToAITutor}
                className="w-full p-3 rounded-2xl bg-[#10B981]/20 text-[#34D399] text-xs font-bold hover:bg-[#10B981] hover:text-white transition-all flex items-center justify-between border border-[#10B981]/30"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Ask AI Tutor</span>
                </div>
                <span>→</span>
              </button>

              <button
                onClick={onNavigateToNotes}
                className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-[#F9FAFB] text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#10B981]" />
                  <span>Generate Notes</span>
                </div>
                <span>→</span>
              </button>

              <button
                onClick={onNavigateToQuizzes}
                className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-[#F9FAFB] text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-[#F59E0B]" />
                  <span>Take Quiz</span>
                </div>
                <span>→</span>
              </button>

              <button
                onClick={onNavigateToCoding}
                className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-[#F9FAFB] text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[#10B981]" />
                  <span>Practice Coding</span>
                </div>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
