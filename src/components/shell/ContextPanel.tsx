'use client';

import React from 'react';
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
  ExternalLink
} from 'lucide-react';
import { NavItemKey } from '@/types';
import { MOCK_ROADMAPS } from '@/data/mockData';

interface ContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavItemKey;
  onOpenAskAI: () => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  isOpen,
  onClose,
  activeTab,
  onOpenAskAI,
}) => {
  const activeRoadmap = MOCK_ROADMAPS[0];
  const activeNode = activeRoadmap.nodes.find((n) => n.status === 'in-progress') || activeRoadmap.nodes[1];

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
            className="fixed inset-0 bg-black/20 backdrop-blur-xs z-30 lg:hidden"
          />

          {/* Context Panel Drawer */}
          <motion.aside
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-16 bottom-0 w-80 lg:w-88 z-30 glass-panel border-l border-[#E5E3DC] flex flex-col overflow-y-auto p-5 select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E3DC] mb-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#171717]">
                <Sparkles className="h-4 w-4 text-[#1F6B4F]" />
                <span>Study Context</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[#6B6B65] hover:text-[#171717] hover:bg-black/5 transition-colors"
                aria-label="Close Context Panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Active Topic Focus */}
            <div className="bg-white/80 rounded-2xl p-4 border border-[#E5E3DC] mb-5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] text-[#6B6B65] font-medium mb-1.5">
                <span className="uppercase tracking-wider">Current Focus</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E7F0EB] text-[#1F6B4F] font-semibold">
                  In Progress
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#171717] mb-1 leading-snug">
                {activeNode.title}
              </h3>
              <p className="text-xs text-[#6B6B65] line-clamp-2 leading-relaxed mb-3">
                {activeNode.description}
              </p>
              <div className="flex items-center justify-between text-xs text-[#6B6B65] pt-2 border-t border-[#E5E3DC]/60">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#1F6B4F]" /> ~{activeNode.estimatedHours} hrs left
                </span>
                <span className="flex items-center gap-1 text-[#1F6B4F] font-medium">
                  {activeRoadmap.category}
                </span>
              </div>
            </div>

            {/* AI Assistant Hints & Suggestions */}
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-[#6B6B65] uppercase tracking-wider mb-2.5 px-1">
                AI Recommendations
              </h4>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-[#E7F0EB]/60 border border-[#1F6B4F]/20 text-xs">
                  <div className="flex items-start gap-2">
                    <Brain className="h-4 w-4 text-[#1F6B4F] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#1F6B4F] block mb-1">
                        Concept Connection Hint
                      </span>
                      <p className="text-[#171717] leading-normal">
                        Kafka consumer partition rebalancing strongly ties into Raft consensus quorum rules.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/70 border border-[#E5E3DC] text-xs">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-[#B7791F] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#171717] block mb-1">
                        Practice Question
                      </span>
                      <p className="text-[#6B6B65] leading-normal">
                        What happens to uncommitted log entries when a leader fails during partition isolation?
                      </p>
                      <button
                        onClick={onOpenAskAI}
                        className="mt-2 text-[11px] font-semibold text-[#1F6B4F] hover:underline flex items-center gap-1"
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
              <h4 className="text-xs font-semibold text-[#6B6B65] uppercase tracking-wider mb-2.5 px-1">
                Quick Actions
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onOpenAskAI}
                  className="p-2.5 rounded-xl bg-white/80 border border-[#E5E3DC] hover:border-[#1F6B4F]/40 hover:bg-[#E7F0EB] text-left transition-all"
                >
                  <Sparkles className="h-4 w-4 text-[#1F6B4F] mb-1" />
                  <span className="text-xs font-medium text-[#171717] block">Explain Topic</span>
                  <span className="text-[10px] text-[#6B6B65]">Deep dive AI explanation</span>
                </button>

                <button
                  onClick={onOpenAskAI}
                  className="p-2.5 rounded-xl bg-white/80 border border-[#E5E3DC] hover:border-[#1F6B4F]/40 hover:bg-[#E7F0EB] text-left transition-all"
                >
                  <FileCheck2 className="h-4 w-4 text-[#1F6B4F] mb-1" />
                  <span className="text-xs font-medium text-[#171717] block">Generate Quiz</span>
                  <span className="text-[10px] text-[#6B6B65]">5 quick questions</span>
                </button>
              </div>
            </div>

            {/* Overall Learning Velocity & Stats */}
            <div className="mt-auto pt-4 border-t border-[#E5E3DC]">
              <div className="flex items-center justify-between text-xs text-[#6B6B65] mb-2">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-[#1F6B4F]" /> Velocity
                </span>
                <span className="font-semibold text-[#171717]">4.2 hrs/day</span>
              </div>
              <div className="w-full bg-[#E5E3DC] h-2 rounded-full overflow-hidden">
                <div className="bg-[#1F6B4F] h-full rounded-full w-[68%]" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#6B6B65] mt-1.5">
                <span>Overall Completion</span>
                <span className="font-semibold text-[#1F6B4F]">68%</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
