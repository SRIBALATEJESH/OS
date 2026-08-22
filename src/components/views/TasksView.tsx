'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  AlertCircle, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Copy, 
  ArrowLeft, 
  Check, 
  Tag, 
  Layers,
  BookOpen,
  Loader2,
  Inbox,
  RefreshCw
} from 'lucide-react';
import { taskService, TaskItem } from '@/services/task.service';

interface TasksViewProps {
  onOpenQuickAdd?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onOpenQuickAdd }) => {
  const [subMode, setSubMode] = useState<'dashboard' | 'create'>('dashboard');

  // Realtime Supabase Tasks state
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /* Fetch live tasks from Supabase */
  const loadTasks = async () => {
    setIsLoading(true);
    const dbTasks = await taskService.getAllTasks();
    setTasks(dbTasks || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTasks();

    const handleTasksUpdated = () => {
      loadTasks();
    };
    window.addEventListener('studyflow-tasks-updated', handleTasksUpdated);
    return () => window.removeEventListener('studyflow-tasks-updated', handleTasksUpdated);
  }, []);

  // Form state for Screen 26
  const [newTitle, setNewTitle] = useState('Complete Express Middleware Revision');
  const [newTopic, setNewTopic] = useState('Express.js');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High'>('High');
  const [newMinutes, setNewMinutes] = useState(30);

  const toggleTaskDone = async (id: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus as any } : t));
    await taskService.updateTask(id, { status: nextStatus as any });
  };

  const handleSaveTask = async () => {
    if (!newTitle.trim()) return;
    const taskData: Omit<TaskItem, 'id'> = {
      title: newTitle.trim(),
      priority: newPriority,
      status: 'Pending',
      estimated_minutes: newMinutes,
    };
    const created = await taskService.createTask(taskData);
    if (created) {
      setTasks(prev => [created, ...prev]);
    }
    setSubMode('dashboard');
  };

  const handleDeleteTask = async (id: string, title: string) => {
    if (confirm(`Delete task "${title}" from Supabase?`)) {
      await taskService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const pendingTasks = tasks.filter(t => t.status !== 'Completed');

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* SCREEN 25: STUDY TASKS DASHBOARD MODE */}
      {subMode === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/10">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#F9FAFB]">Study Tasks</h1>
              <p className="text-xs md:text-sm text-[#9CA3AF]">
                Manage study goals backed by live Supabase data persistence.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={loadTasks} className="p-2 rounded-xl bg-white/5 text-[#9CA3AF] hover:text-white border border-white/10">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setSubMode('create')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-1 bg-[#121824]/80">
              <div className="text-[11px] font-semibold text-[#9CA3AF]">Total Tasks</div>
              <div className="text-2xl font-bold text-[#F9FAFB]">{tasks.length}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-1 bg-[#121824]/80">
              <div className="text-[11px] font-semibold text-[#9CA3AF]">Completed</div>
              <div className="text-2xl font-bold text-[#10B981]">{completedTasks.length}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-1 bg-[#121824]/80">
              <div className="text-[11px] font-semibold text-[#9CA3AF]">Pending</div>
              <div className="text-2xl font-bold text-amber-400">{pendingTasks.length}</div>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="p-12 text-center text-xs text-[#9CA3AF] flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 text-[#10B981] animate-spin" />
              <span>Fetching live study tasks from Supabase...</span>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && tasks.length === 0 && (
            <div className="glass-card rounded-3xl p-12 text-center border border-white/10 bg-[#121824]/80 space-y-4 max-w-md mx-auto my-8">
              <div className="h-16 w-16 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto">
                <Inbox className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F9FAFB]">No Study Tasks</h3>
                <p className="text-xs text-[#9CA3AF] mt-1">Your task list is empty. Add a goal to track your progress!</p>
              </div>
              <button
                onClick={() => setSubMode('create')}
                className="px-5 py-2.5 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:opacity-90 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Add First Task
              </button>
            </div>
          )}

          {/* Task Checklist */}
          {!isLoading && tasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#10B981] uppercase tracking-wider">Live Task Checklist</h3>
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between text-xs ${t.status === 'Completed' ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#9CA3AF]' : 'bg-[#121824]/80 border-white/10 hover:border-[#10B981]/40'}`}
                  >
                    <div
                      onClick={() => toggleTaskDone(t.id, t.status)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      {t.status === 'Completed' ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-[#10B981]" />
                      ) : (
                        <Circle className="h-4.5 w-4.5 text-[#9CA3AF]" />
                      )}
                      <span className={t.status === 'Completed' ? 'line-through font-medium' : 'font-semibold text-[#F9FAFB]'}>
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        📅 {t.due_date || 'Today, 6:00 PM'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] font-semibold">{t.priority || 'Medium'}</span>
                      <span>{t.estimated_minutes || 30} min</span>
                      <button
                        onClick={() => handleDeleteTask(t.id, t.title)}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-[#9CA3AF] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCREEN 26: CREATE / EDIT TASK WORKSPACE MODE */}
      {subMode === 'create' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF] pb-3 border-b border-white/10">
            <button onClick={() => setSubMode('dashboard')} className="hover:text-[#F9FAFB] flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Study Tasks
            </button>
            <span>/</span>
            <span className="text-[#10B981]">Create Study Task</span>
          </div>

          <div className="max-w-xl mx-auto glass-card rounded-3xl p-6 border border-white/10 bg-[#121824]/80 space-y-4">
            <h2 className="text-sm font-bold text-[#F9FAFB]">Task Details</h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#F9FAFB] mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#F9FAFB] mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e: any) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#121824] text-[#F9FAFB]"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              <button
                onClick={handleSaveTask}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              >
                Save Task to Supabase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
