'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckSquare,
  MapPin,
  FileText,
  Plus,
  Sparkles,
  BrainCircuit,
  Code2,
  CheckCircle2,
  Calendar,
  Layers,
  Loader2,
} from 'lucide-react';
import { taskService } from '@/services/task.service';
import { activityService } from '@/services/activity.service';
import { getUserScopedKey } from '@/lib/supabase/authHelper';

export type QuickAddType = 'task' | 'roadmap' | 'note' | 'quiz' | 'coding';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: QuickAddType;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  initialType = 'task',
}) => {
  const [activeType, setActiveType] = useState<QuickAddType>(initialType);

  /* Form Fields */
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Distributed Systems');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [language, setLanguage] = useState<'Java' | 'JavaScript' | 'Python'>('Java');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  useEffect(() => {
    if (initialType) setActiveType(initialType);
  }, [initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isCreating) return;

    setIsCreating(true);

    try {
      if (activeType === 'task') {
        const priorityLabel = priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : 'Low';
        await taskService.createTask({
          title: title.trim(),
          priority: priorityLabel as any,
          status: 'Pending',
          estimated_minutes: 30,
        });
        activityService.logActivity({
          type: 'task',
          title: `Created Task: "${title.trim()}"`,
          detail: `Priority: ${priorityLabel} • Estimated 30 min`,
          timestamp: 'Just now',
        });
        window.dispatchEvent(new CustomEvent('studyflow-tasks-updated'));
      } else if (activeType === 'roadmap') {
        const newRoadmap = {
          id: `roadmap-${Date.now()}`,
          title: title.trim(),
          category: subject,
          level: difficulty,
          status: 'In Progress',
          completion: 0,
          nodesCount: 5,
          color: 'from-[#10B981] to-[#059669]',
          updated: 'Just now',
        };
        const existing = JSON.parse(localStorage.getItem(getUserScopedKey('studyflow_custom_roadmaps')) || '[]');
        localStorage.setItem(getUserScopedKey('studyflow_custom_roadmaps'), JSON.stringify([newRoadmap, ...existing]));
        activityService.logActivity({
          type: 'roadmap',
          title: `Added Roadmap: "${title.trim()}"`,
          detail: `Subject: ${subject} • Level: ${difficulty}`,
          timestamp: 'Just now',
        });
        window.dispatchEvent(new CustomEvent('studyflow-roadmaps-updated'));
      } else if (activeType === 'note') {
        const newNote = {
          id: `note-${Date.now()}`,
          title: title.trim(),
          topic: subject,
          updatedDate: 'Just now',
          readTime: '3 min read',
          preview: `Quick draft on ${title.trim()} (${subject}).`,
          content: `# ${title.trim()}\n\nSubject: ${subject}\n\nDrafted note content ready for revision.`,
        };
        const existing = JSON.parse(localStorage.getItem(getUserScopedKey('studyflow_notes')) || '[]');
        localStorage.setItem(getUserScopedKey('studyflow_notes'), JSON.stringify([newNote, ...existing]));
        activityService.logActivity({
          type: 'note',
          title: `Created Note: "${title.trim()}"`,
          detail: `Topic: ${subject}`,
          timestamp: 'Just now',
        });
        window.dispatchEvent(new CustomEvent('studyflow-notes-updated'));
      } else if (activeType === 'quiz') {
        const newQuiz = {
          id: `quiz-${Date.now()}`,
          title: title.trim(),
          topic: subject,
          questionsCount: 5,
          difficulty,
          bestScore: 0,
          lastPlayed: 'Not started',
        };
        const existing = JSON.parse(localStorage.getItem(getUserScopedKey('studyflow_quizzes')) || '[]');
        localStorage.setItem(getUserScopedKey('studyflow_quizzes'), JSON.stringify([newQuiz, ...existing]));
        activityService.logActivity({
          type: 'quiz',
          title: `Created Practice Quiz: "${title.trim()}"`,
          detail: `Topic: ${subject} • Difficulty: ${difficulty}`,
          timestamp: 'Just now',
        });
        window.dispatchEvent(new CustomEvent('studyflow-quizzes-updated'));
      } else if (activeType === 'coding') {
        const newChallenge = {
          id: `code-${Date.now()}`,
          title: title.trim(),
          language,
          difficulty,
          status: 'Unsolved',
          description: `Implement ${title.trim()} in ${language}.`,
        };
        const existing = JSON.parse(localStorage.getItem(getUserScopedKey('studyflow_coding_challenges')) || '[]');
        localStorage.setItem(getUserScopedKey('studyflow_coding_challenges'), JSON.stringify([newChallenge, ...existing]));
        activityService.logActivity({
          type: 'coding',
          title: `Created Coding Problem: "${title.trim()}"`,
          detail: `Language: ${language} • Difficulty: ${difficulty}`,
          timestamp: 'Just now',
        });
        window.dispatchEvent(new CustomEvent('studyflow-coding-updated'));
      }

      setIsCreating(false);
      setIsCreated(true);
      setTimeout(() => {
        setIsCreated(false);
        setTitle('');
        onClose();
      }, 1000);
    } catch (err) {
      console.error('[QuickAddModal] Error creating item:', err);
      setIsCreating(false);
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

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed top-20 max-w-xl w-[92%] left-1/2 -translate-x-1/2 z-50 glass-card rounded-3xl p-6 border border-[#10B981]/40 bg-[#121824]/95 text-gray-100 shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] flex items-center justify-center font-bold">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F9FAFB]">Quick Workspace Creation</h3>
                  <p className="text-xs text-[#9CA3AF]">Instantly add items to any module</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SEPARATE CREATION TYPE PILLS */}
            <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl mb-5 border border-white/10 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveType('task')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${activeType === 'task' ? 'bg-[#10B981] text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-[#9CA3AF] hover:text-white'}`}
              >
                <CheckSquare className="h-3.5 w-3.5" /> Task
              </button>

              <button
                type="button"
                onClick={() => setActiveType('roadmap')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${activeType === 'roadmap' ? 'bg-[#10B981] text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-[#9CA3AF] hover:text-white'}`}
              >
                <MapPin className="h-3.5 w-3.5" /> Roadmap
              </button>

              <button
                type="button"
                onClick={() => setActiveType('note')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${activeType === 'note' ? 'bg-[#10B981] text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-[#9CA3AF] hover:text-white'}`}
              >
                <FileText className="h-3.5 w-3.5" /> Note
              </button>

              <button
                type="button"
                onClick={() => setActiveType('quiz')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${activeType === 'quiz' ? 'bg-[#10B981] text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-[#9CA3AF] hover:text-white'}`}
              >
                <BrainCircuit className="h-3.5 w-3.5" /> Quiz
              </button>

              <button
                type="button"
                onClick={() => setActiveType('coding')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${activeType === 'coding' ? 'bg-[#10B981] text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-[#9CA3AF] hover:text-white'}`}
              >
                <Code2 className="h-3.5 w-3.5" /> Coding
              </button>
            </div>

            {/* CREATED SUCCESS OVERLAY */}
            {isCreated ? (
              <div className="py-8 text-center animate-fade-in space-y-2">
                <CheckCircle2 className="h-12 w-12 text-[#10B981] mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-[#F9FAFB]">
                  {activeType === 'task' ? 'Study Task Created!' : activeType === 'roadmap' ? 'Roadmap Initialized!' : activeType === 'note' ? 'AI Note Drafted!' : activeType === 'quiz' ? 'Practice Quiz Added!' : 'Coding Challenge Created!'}
                </h4>
                <p className="text-xs text-[#9CA3AF]">Added into your active StudyFlow Workspace.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#F9FAFB] mb-1">
                    {activeType === 'task' ? 'Task Title' : activeType === 'roadmap' ? 'Roadmap Topic' : activeType === 'note' ? 'Note Headline' : activeType === 'quiz' ? 'Quiz Title' : 'Challenge Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      activeType === 'task'
                        ? 'e.g. Review Raft Log Replication safety'
                        : activeType === 'roadmap'
                        ? 'e.g. Quantum Computing & Qiskit'
                        : activeType === 'note'
                        ? 'e.g. Transformer Self-Attention Mechanics'
                        : activeType === 'quiz'
                        ? 'e.g. Redis In-Memory Data Structures'
                        : 'e.g. Implement Concurrent Hash Map'
                    }
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#F9FAFB] mb-1">Subject Area</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#121824] border border-white/10 text-xs text-[#F9FAFB]"
                    >
                      <option>Distributed Systems</option>
                      <option>Deep Learning</option>
                      <option>Web Backend Engineering</option>
                      <option>Algorithms & Data Structures</option>
                    </select>
                  </div>

                  {activeType === 'task' && (
                    <div>
                      <label className="block font-semibold text-[#F9FAFB] mb-1">Priority</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-[#121824] border border-white/10 text-xs text-[#F9FAFB]"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                  )}

                  {activeType === 'coding' && (
                    <div>
                      <label className="block font-semibold text-[#F9FAFB] mb-1">Target Compiler</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-[#121824] border border-white/10 text-xs text-[#F9FAFB]"
                      >
                        <option value="Java">Java 17</option>
                        <option value="JavaScript">JavaScript (Node 20)</option>
                        <option value="Python">Python 3.11</option>
                      </select>
                    </div>
                  )}

                  {(activeType === 'quiz' || activeType === 'coding' || activeType === 'roadmap') && (
                    <div>
                      <label className="block font-semibold text-[#F9FAFB] mb-1">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-[#121824] border border-white/10 text-xs text-[#F9FAFB]"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9CA3AF] hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    Save & Create Item
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
