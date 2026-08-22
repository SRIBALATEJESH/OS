'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  MapPin, 
  Sparkles, 
  FileText, 
  BookOpen, 
  BrainCircuit, 
  Code2, 
  CheckSquare, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  GraduationCap
} from 'lucide-react';
import { NavItemKey, NavSection } from '@/types';
import { NAV_ITEMS } from '@/data/mockData';
import { taskService } from '@/services/task.service';
import { documentService } from '@/services/document.service';
import { roadmapService } from '@/services/roadmap.service';

interface SidebarProps {
  activeTab: NavItemKey;
  onSelectTab: (key: NavItemKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  MapPin,
  Sparkles,
  FileText,
  BookOpen,
  BrainCircuit,
  Code2,
  CheckSquare,
};

const SECTIONS: NavSection[] = ['OVERVIEW', 'LEARNING', 'PRACTICE', 'PRODUCTIVITY'];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  // Dynamic live badge counts state
  const [roadmapCount, setRoadmapCount] = useState<number>(0);
  const [knowledgeCount, setKnowledgeCount] = useState<number>(0);
  const [taskCount, setTaskCount] = useState<number>(0);

  const fetchLiveCounts = async () => {
    // 1. Roadmaps Count
    try {
      const roadmaps = await roadmapService.getAllRoadmaps();
      setRoadmapCount(roadmaps?.length ?? 0);
    } catch (e) {
      const saved = JSON.parse(localStorage.getItem('studyflow_user_roadmaps') || '[]');
      setRoadmapCount(saved?.length ?? 0);
    }

    // 2. Knowledge Docs Count
    try {
      const docs = await documentService.getAllDocuments();
      const savedDocs = JSON.parse(localStorage.getItem('studyflow_knowledge_documents') || '[]');
      const maxCount = Math.max(docs?.length || 0, savedDocs?.length || 0);
      setKnowledgeCount(maxCount);
    } catch (e) {
      setKnowledgeCount(0);
    }

    // 3. Tasks Due Count
    try {
      const tasks = await taskService.getAllTasks();
      const pending = tasks.filter(t => t.status !== 'Completed');
      setTaskCount(pending.length);
    } catch (e) {
      setTaskCount(0);
    }
  };

  useEffect(() => {
    fetchLiveCounts();

    const handleUpdate = () => fetchLiveCounts();
    window.addEventListener('studyflow-roadmaps-updated', handleUpdate);
    window.addEventListener('studyflow-documents-updated', handleUpdate);
    window.addEventListener('studyflow-tasks-updated', handleUpdate);

    return () => {
      window.removeEventListener('studyflow-roadmaps-updated', handleUpdate);
      window.removeEventListener('studyflow-documents-updated', handleUpdate);
      window.removeEventListener('studyflow-tasks-updated', handleUpdate);
    };
  }, []);

  const renderNavItems = (section: NavSection) => {
    const items = NAV_ITEMS.filter((item) => item.section === section);

    return (
      <div key={section} className="mb-6">
        {!isCollapsed && (
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
            {section}
          </div>
        )}
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
            const isActive = activeTab === item.key;

            // Compute dynamic badge string
            let dynamicBadge = item.badge;
            if (item.key === 'roadmaps') {
              dynamicBadge = `${roadmapCount} Active`;
            } else if (item.key === 'knowledge') {
              dynamicBadge = `${knowledgeCount} Docs`;
            } else if (item.key === 'tasks') {
              dynamicBadge = `${taskCount} Due`;
            }

            return (
              <div key={item.key} className="relative group">
                <button
                  onClick={() => {
                    onSelectTab(item.key);
                    onCloseMobile();
                  }}
                  onMouseEnter={() => setHoveredTooltip(item.key)}
                  onMouseLeave={() => setHoveredTooltip(null)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative
                    ${isActive 
                      ? 'bg-[#10B981]/15 text-[#F9FAFB] border border-[#10B981]/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                      : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
                    }
                    ${isCollapsed ? 'justify-center px-2' : ''}
                  `}
                >
                  {/* Left Active Indicator Bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-2 bottom-2 w-1 bg-[#10B981] rounded-r-full shadow-[0_0_8px_#10B981]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <Icon 
                    className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                      isActive ? 'text-[#10B981]' : 'text-[#9CA3AF] group-hover:text-[#F9FAFB]'
                    }`} 
                  />

                  {/* Label & Badge */}
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                      <span className="truncate">{item.label}</span>
                      {dynamicBadge && (
                        <span className={`
                          text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2
                          ${isActive 
                            ? 'bg-[#10B981]/20 text-[#34D399]' 
                            : 'bg-white/10 text-[#9CA3AF]'
                          }
                        `}>
                          {dynamicBadge}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Floating Tooltip when collapsed on desktop */}
                {isCollapsed && hoveredTooltip === item.key && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#121824] text-white border border-[#10B981]/40 text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none animate-fade-in flex items-center gap-2">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="bg-[#10B981]/20 text-[#34D399] text-[10px] px-1.5 py-0.2 rounded-md">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full py-5 px-3">
      {/* Header Logo Area */}
      <div className="flex items-center justify-between px-2 mb-8">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#059669] text-white flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-base tracking-tight text-[#F9FAFB]">
                StudyFlow
              </span>
              <span className="text-[11px] text-[#10B981] font-medium tracking-wide">
                AI Workspace
              </span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-[#9CA3AF] hover:bg-white/10"
          aria-label="Close Mobile Sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto pr-1">
        {SECTIONS.map((section) => renderNavItems(section))}
      </div>

      {/* Desktop Collapse Toggle Footer */}
      <div className="hidden md:block pt-4 mt-auto border-t border-white/10">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#6B6B65] hover:text-[#171717] hover:bg-white/50 rounded-xl transition-colors"
        >
          {!isCollapsed && <span>Collapse Sidebar</span>}
          <div className="p-1 rounded-lg bg-black/5">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col h-screen sticky top-0 z-30 glass-sidebar select-none"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Drawer Navigation Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#F6F5F1] z-50 md:hidden border-r border-[#E5E3DC] shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
