'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Brain,
  HelpCircle,
  FileCheck2,
  MapPin
} from 'lucide-react';
import { NavItemKey } from '@/types';
import { roadmapService, RoadmapItem } from '@/services/roadmap.service';
import { AICreatorType } from '@/components/shell/AskAIDrawer';

interface ContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavItemKey;
  onOpenAskAI: (mode?: AICreatorType) => void;
  onNavigate: (tab: NavItemKey) => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  isOpen,
  onClose,
  activeTab,
  onOpenAskAI,
  onNavigate,
}) => {
  const [activeRoadmap, setActiveRoadmap] = useState<RoadmapItem | null>(null);

  useEffect(() => {
    roadmapService.getAllRoadmaps().then((roadmaps) => {
      if (roadmaps && roadmaps.length > 0) {
        setActiveRoadmap(roadmaps[0]);
      }
    });
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          />

          {/* Context Panel Drawer */}
          <motion.aside
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-16 bottom-0 w-80 lg:w-88 z-30 bg-[#0B0F17]/95 backdrop-blur-xl border-l border-white/10 flex flex-col overflow-y-auto p-5 select-none text-[#F9FAFB]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F9FAFB]">
                <Sparkles className="h-4 w-4 text-[#10B981]" />
                <span>Study Context</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close Context Panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Active Topic Focus */}
            <div
              onClick={() => onNavigate('roadmaps')}
              className="bg-[#121824] rounded-2xl p-4 border border-white/10 mb-5 shadow-lg cursor-pointer hover:border-[#10B981]/40 transition-all"
            >
              <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] font-medium mb-1.5">
                <span className="uppercase tracking-wider">Current Focus</span>
                <span className="px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] font-semibold text-[10px] border border-[#10B981]/30">
                  {activeRoadmap ? 'Active' : 'No Roadmap'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F9FAFB] mb-1 leading-snug">
                {activeRoadmap?.title || 'No Active Learning Goal'}
              </h3>
              <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed mb-3">
                {activeRoadmap?.description || 'Select or create a 2D roadmap to activate real-time topic tracking.'}
              </p>
              <div className="flex items-center justify-between text-xs text-[#9CA3AF] pt-2 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#10B981]" /> {activeRoadmap?.duration || 'Custom'}
                </span>
                <span className="flex items-center gap-1 text-[#10B981] font-semibold">
                  {activeRoadmap?.category || 'StudyFlow'}
                </span>
              </div>
            </div>

            {/* AI Assistant Hints & Suggestions */}
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2.5 px-1">
                AI Assistant Tools
              </h4>
              <div className="space-y-2.5">
                <div
                  onClick={() => onNavigate('ai-tutor')}
                  className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-xs cursor-pointer hover:bg-[#10B981]/15 transition-all"
                >
                  <div className="flex items-start gap-2">
                    <Brain className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#34D399] block mb-1">
                        AI Study Buddy
                      </span>
                      <p className="text-[#9CA3AF] leading-normal">
                        Ask any doubt, draft notes, or generate custom practice quizzes on the fly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#121824] border border-white/10 text-xs">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#F9FAFB] block mb-1">
                        Instant Doubt Tutor
                      </span>
                      <p className="text-[#9CA3AF] leading-normal">
                        Have a complex coding or concept doubt? Use AI Doubt Tutor anytime.
                      </p>
                      <button
                        onClick={() => onNavigate('ai-tutor')}
                        className="mt-2 text-[11px] font-semibold text-[#10B981] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Ask AI Tutor <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2.5 px-1">
                Quick Actions
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onNavigate('notes');
                    onOpenAskAI('note');
                  }}
                  className="p-2.5 rounded-xl bg-[#121824] border border-white/10 hover:border-[#10B981]/50 hover:bg-[#10B981]/10 text-left transition-all group cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-[#10B981] mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-[#F9FAFB] block">Explain Topic</span>
                  <span className="text-[10px] text-[#9CA3AF]">AI explanation</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('quizzes');
                    onOpenAskAI('quiz');
                  }}
                  className="p-2.5 rounded-xl bg-[#121824] border border-white/10 hover:border-[#10B981]/50 hover:bg-[#10B981]/10 text-left transition-all group cursor-pointer"
                >
                  <FileCheck2 className="h-4 w-4 text-[#10B981] mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-[#F9FAFB] block">Generate Quiz</span>
                  <span className="text-[10px] text-[#9CA3AF]">Practice questions</span>
                </button>
              </div>
            </div>

            {/* Overall Learning Velocity & Stats */}
            <div className="mt-auto pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-2">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-[#10B981]" /> Learning Progress
                </span>
                <span className="font-semibold text-[#F9FAFB]">
                  {activeRoadmap?.progressPercent ?? 0}%
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#10B981] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#10B981]"
                  style={{ width: `${activeRoadmap?.progressPercent ?? 0}%` }}
                />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
