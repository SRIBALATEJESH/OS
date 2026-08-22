'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  Flame,
  BookOpen,
  Plus,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Play,
  Brain,
  Inbox,
  RefreshCw,
  Loader2,
  Activity,
  Layers,
} from 'lucide-react';
import { NavItemKey } from '@/types';
import { taskService, TaskItem } from '@/services/task.service';
import { activityService, ActivityItem } from '@/services/activity.service';
import { roadmapService, RoadmapItem } from '@/services/roadmap.service';

interface DashboardViewProps {
  onNavigate: (key: NavItemKey) => void;
  onOpenAskAI: () => void;
  onOpenQuickAdd: (type?: 'task' | 'roadmap' | 'note') => void;
  onSelectTopicContext?: (topic: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAskAI,
  onOpenQuickAdd,
}) => {
  // Real-time Supabase Tasks State
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState<boolean>(true);

  // Real-time Activities State
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Real-time Roadmaps State
  const [activeRoadmap, setActiveRoadmap] = useState<RoadmapItem | null>(null);

  // Load all live data
  const loadDashboardData = async () => {
    setIsTasksLoading(true);
    try {
      const [dbTasks, dbRoadmaps] = await Promise.all([
        taskService.getAllTasks(),
        roadmapService.getAllRoadmaps(),
      ]);
      setTasks(dbTasks || []);
      if (dbRoadmaps && dbRoadmaps.length > 0) {
        setActiveRoadmap(dbRoadmaps[0]);
      }
    } catch (err) {
      console.warn('[DashboardView] Error loading data:', err);
    } finally {
      setIsTasksLoading(false);
    }

    setActivities(activityService.getAllActivities());
  };

  useEffect(() => {
    loadDashboardData();

    // Listen to real-time events
    const handleTasksUpdate = () => loadDashboardData();
    const handleActivityUpdate = () => setActivities(activityService.getAllActivities());
    const handleRoadmapsUpdate = () => loadDashboardData();

    window.addEventListener('studyflow-tasks-updated', handleTasksUpdate);
    window.addEventListener('studyflow-activity-updated', handleActivityUpdate);
    window.addEventListener('studyflow-roadmaps-updated', handleRoadmapsUpdate);

    return () => {
      window.removeEventListener('studyflow-tasks-updated', handleTasksUpdate);
      window.removeEventListener('studyflow-activity-updated', handleActivityUpdate);
      window.removeEventListener('studyflow-roadmaps-updated', handleRoadmapsUpdate);
    };
  }, []);

  // Toggle Task Status
  const toggleTask = async (id: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus as any } : t))
    );
    await taskService.updateTask(id, { status: nextStatus as any });

    const targetTask = tasks.find((t) => t.id === id);
    if (targetTask) {
      activityService.logActivity({
        type: 'task',
        title: nextStatus === 'Completed' ? `Completed Task: "${targetTask.title}"` : `Reopened Task: "${targetTask.title}"`,
        detail: `Status changed to ${nextStatus}`,
        timestamp: 'Just now',
      });
    }
  };

  const completedTasks = tasks.filter((t) => t.status === 'Completed');

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] tracking-tight">
            Study Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#9CA3AF]">
            Real-time continuous learning, daily study plan, and activity timeline.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onOpenQuickAdd('task')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-[#F9FAFB] hover:bg-white/10 transition-all text-xs font-semibold"
          >
            <Plus className="h-4 w-4 text-[#10B981]" />
            <span>Quick Add Task</span>
          </button>

          <button
            onClick={onOpenAskAI}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:opacity-90 transition-all text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <Sparkles className="h-4 w-4 text-emerald-100" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* 3 CORE SECTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION 1 — CONTINUOUS LEARNING */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-white/10 flex-1 flex flex-col justify-between hover:border-[#10B981]/40 transition-all duration-300 bg-[#121824]/80 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Continuous Learning
                </span>
                <span className="text-[11px] text-[#9CA3AF] bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  Live Active Roadmap
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#9CA3AF] mb-1">
                  Active Focus:{' '}
                  <strong className="text-[#F9FAFB]">
                    {activeRoadmap?.title || 'Distributed Systems & Engineering'}
                  </strong>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] tracking-tight">
                  {activeRoadmap?.category || 'Software Architecture & Cloud Infrastructure'}
                </h2>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#9CA3AF]">Overall Completion</span>
                  <span className="text-[#10B981] font-bold">
                    {activeRoadmap?.progressPercent || 45}%
                  </span>
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${activeRoadmap?.progressPercent || 45}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="bg-[#10B981] h-full rounded-full shadow-[0_0_12px_#10B981]"
                  />
                </div>
              </div>
            </div>

            {/* Continuous Learning Footer Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/10">
              <button
                onClick={onOpenAskAI}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Continue Learning with AI</span>
              </button>

              <button
                onClick={() => onNavigate('roadmaps')}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs sm:text-sm font-semibold text-[#F9FAFB] transition-all flex items-center gap-1.5"
              >
                <span>View Roadmaps</span>
                <ArrowUpRight className="h-4 w-4 text-[#9CA3AF]" />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2 — TODAY'S PLAN STUDY (Live Supabase Tasks) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 sm:p-7 border border-white/10 space-y-4 bg-[#121824]/80 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-[#F9FAFB]">Today's Plan Study</h3>
                <p className="text-xs text-[#9CA3AF]">Live tasks synchronized with database.</p>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-semibold text-[#10B981] hover:underline"
              >
                View All
              </button>
            </div>

            {/* Task Stats Indicator */}
            {tasks.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#9CA3AF]">
                  <span>Progress</span>
                  <span className="text-[#10B981]">
                    {completedTasks.length} of {tasks.length} completed
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#10B981] h-full rounded-full transition-all duration-300 shadow-[0_0_8px_#10B981]"
                    style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Task Items List */}
            {isTasksLoading ? (
              <div className="py-8 text-center text-xs text-[#9CA3AF] flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 text-[#10B981] animate-spin" />
                <span>Loading live study tasks...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#9CA3AF] space-y-3">
                <Inbox className="h-8 w-8 mx-auto text-[#10B981]/60" />
                <p>No study tasks scheduled yet.</p>
                <button
                  onClick={() => onOpenQuickAdd('task')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#10B981] text-white text-xs font-semibold"
                >
                  Add Study Task
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {tasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t.id, t.status)}
                    className={`
                      p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 text-xs
                      ${
                        t.status === 'Completed'
                          ? 'bg-[#10B981]/10 border-[#10B981]/30 opacity-70'
                          : 'bg-white/5 border-white/10 hover:border-[#10B981]/40'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {t.status === 'Completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-[#9CA3AF] shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span
                          className={`font-medium block truncate ${
                            t.status === 'Completed' ? 'line-through text-[#9CA3AF]' : 'text-[#F9FAFB]'
                          }`}
                        >
                          {t.title}
                        </span>
                        <span className="text-[10px] text-[#9CA3AF] flex items-center gap-2 mt-0.5">
                          <span className="text-emerald-400 font-medium">
                            📅 {t.due_date || 'Today, 6:00 PM'}
                          </span>
                          <span>• {t.estimated_minutes || 30} min</span>
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] font-semibold shrink-0">
                      {t.priority || 'Medium'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onOpenQuickAdd('task')}
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Plus className="h-4 w-4 text-[#10B981]" />
            <span>Add Task to Study Plan</span>
          </button>
        </div>

        {/* SECTION 3 — RECENT ACTIVITY (Real User Action Timeline) */}
        <div className="lg:col-span-12 glass-card rounded-3xl p-6 sm:p-7 border border-white/10 space-y-4 bg-[#121824]/80">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#10B981]" />
              <h3 className="text-base font-bold text-[#F9FAFB]">Recent Activity</h3>
            </div>
            <span className="text-xs text-[#9CA3AF]">Real-time Event Timeline</span>
          </div>

          {activities.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#9CA3AF] space-y-2">
              <p>No recent activities recorded yet.</p>
              <p className="text-[11px] text-[#9CA3AF]/70">
                Actions like completing tasks, adding notes, creating practice quizzes, and uploading documents will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activities.slice(0, 6).map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 hover:border-[#10B981]/40 transition-all"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#10B981] capitalize">{act.type}</span>
                    <span className="text-[#9CA3AF] text-[10px]">{act.timestamp}</span>
                  </div>
                  <div className="text-xs font-semibold text-[#F9FAFB] leading-snug">{act.title}</div>
                  <div className="text-[11px] text-[#9CA3AF] line-clamp-1">{act.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
