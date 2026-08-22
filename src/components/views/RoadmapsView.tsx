'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Sparkles, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Trash2, 
  FolderPlus, 
  Copy, 
  Archive, 
  AlertTriangle,
  BookOpen,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { roadmapService, RoadmapItem } from '@/services/roadmap.service';

interface RoadmapsViewProps {
  onOpenAskAI: () => void;
  onOpenQuickAdd: () => void;
  onOpenCreateRoadmap: () => void;
  onOpenAIRoadmapGenerator?: () => void;
  onOpenInteractiveRoadmap?: (roadmapId?: string) => void;
}

export const RoadmapsView: React.FC<RoadmapsViewProps> = ({
  onOpenAskAI,
  onOpenQuickAdd,
  onOpenCreateRoadmap,
  onOpenAIRoadmapGenerator,
  onOpenInteractiveRoadmap,
}) => {
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed' | 'draft' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'progress' | 'name'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Menu & Modal state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deletingRoadmapId, setDeletingRoadmapId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  /* Load roadmaps strictly from roadmapService */
  const loadRoadmaps = async () => {
    setIsLoading(true);
    const data = await roadmapService.getAllRoadmaps();
    setRoadmaps(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRoadmaps();

    const handleRoadmapsUpdated = () => {
      loadRoadmaps();
    };
    window.addEventListener('studyflow-roadmaps-updated', handleRoadmapsUpdated);
    return () => window.removeEventListener('studyflow-roadmaps-updated', handleRoadmapsUpdated);
  }, []);

  // Filter & Search Logic
  const filteredRoadmaps = roadmaps
    .filter((rm) => {
      const matchesSearch = rm.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (rm.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' ? true : rm.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'progress') return (b.progressPercent || 0) - (a.progressPercent || 0);
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      return 0; // default recently updated
    });

  const handleDeleteConfirm = async () => {
    if (deletingRoadmapId) {
      setIsDeleting(true);
      await roadmapService.deleteRoadmap(deletingRoadmapId);
      setRoadmaps((prev) => prev.filter((r) => r.id !== deletingRoadmapId));
      setDeletingRoadmapId(null);
      setIsDeleting(false);
    }
  };

  // Metrics
  const activeCount = roadmaps.filter(r => r.status === 'in-progress').length;
  const completedCount = roadmaps.filter(r => r.status === 'completed').length;
  const totalTopicsCount = roadmaps.reduce((acc, r) => acc + (r.totalTopics || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F9FAFB]">Your Roadmaps</h1>
          <p className="text-xs md:text-sm text-[#9CA3AF]">
            Build structured learning paths powered by Gemini 3.5 Flash-Lite.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenCreateRoadmap}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs md:text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <Plus className="h-4 w-4" />
            <span>Create Roadmap</span>
          </button>

          <button
            onClick={onOpenAIRoadmapGenerator || onOpenAskAI}
            className="px-4 py-2 rounded-xl bg-white/5 text-[#F9FAFB] border border-white/10 text-xs md:text-sm font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-[#10B981]" />
            <span>Generate with AI</span>
          </button>
        </div>
      </div>

      {/* ROADMAP SUMMARY OVERVIEW ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-1 bg-[#121824]/80">
          <div className="text-[11px] font-semibold text-[#9CA3AF]">Active Roadmaps</div>
          <div className="text-2xl font-bold text-[#F9FAFB]">{activeCount}</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-1 bg-[#121824]/80">
          <div className="text-[11px] font-semibold text-[#9CA3AF]">Completed</div>
          <div className="text-2xl font-bold text-[#10B981]">{completedCount}</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-1 bg-[#121824]/80">
          <div className="text-[11px] font-semibold text-[#9CA3AF]">Total Topics</div>
          <div className="text-2xl font-bold text-[#F9FAFB]">{totalTopicsCount}</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-1 bg-[#121824]/80">
          <div className="text-[11px] font-semibold text-[#9CA3AF]">Database Synced</div>
          <div className="text-xs font-bold text-[#34D399] pt-2">Supabase / Local</div>
        </div>
      </div>

      {/* FILTER & VIEW TOOLBAR */}
      <div className="glass-card rounded-2xl p-3 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#121824]/80">
        {/* Left: Search Bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your roadmaps..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#10B981]"
          />
        </div>

        {/* Refresh Button */}
        <button onClick={loadRoadmaps} className="p-2 rounded-xl bg-white/5 text-[#9CA3AF] hover:text-white border border-white/10">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>

        {/* Middle: Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'in-progress', 'completed', 'draft', 'archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                filterStatus === st
                  ? 'bg-[#10B981] text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
              }`}
            >
              {st === 'all' ? 'All' : st.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Right: Sort & Grid/List Toggle */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#121824] text-xs text-[#9CA3AF] focus:outline-none focus:border-[#10B981]"
          >
            <option value="updated">Recently Updated</option>
            <option value="progress">Highest Progress</option>
            <option value="name">Name</option>
          </select>

          <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'grid' ? 'bg-[#10B981] text-white shadow-xs' : 'text-[#9CA3AF]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'list' ? 'bg-[#10B981] text-white shadow-xs' : 'text-[#9CA3AF]'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* LOADING INDICATOR */}
      {isLoading && (
        <div className="p-12 text-center text-xs text-[#9CA3AF] flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 text-[#10B981] animate-spin" />
          <span>Fetching roadmaps from database...</span>
        </div>
      )}

      {/* EMPTY STATE */}
      {!isLoading && filteredRoadmaps.length === 0 && (
        <div className="glass-card rounded-3xl p-12 text-center border border-white/10 bg-[#121824]/80 space-y-4 max-w-md mx-auto">
          <div className="h-12 w-12 rounded-2xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center mx-auto border border-[#10B981]/30">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F9FAFB]">No learning paths yet</h3>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Create your first roadmap and turn a goal into a structured learning journey.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenCreateRoadmap}
              className="px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669]"
            >
              Create Manually
            </button>
            <button
              onClick={onOpenAIRoadmapGenerator || onOpenAskAI}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#F9FAFB]"
            >
              Generate with AI
            </button>
          </div>
        </div>
      )}

      {/* ROADMAPS GRID / LIST RENDERING */}
      {!isLoading && filteredRoadmaps.length > 0 && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoadmaps.map((rm) => (
              <motion.div
                key={rm.id}
                layout
                className="glass-card rounded-3xl p-6 border border-white/10 hover:border-[#10B981]/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 bg-[#121824]/80 relative group"
              >
                {/* Card Top: Category & More Menu */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                    {rm.category}
                  </span>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === rm.id ? null : rm.id)}
                      className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/10"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === rm.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-[#121824] border border-white/10 rounded-xl shadow-xl py-1 z-30 text-xs">
                        <button
                          onClick={() => { setActiveMenuId(null); onOpenCreateRoadmap(); }}
                          className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-[#F9FAFB]"
                        >
                          Edit Roadmap
                        </button>
                        <button
                          onClick={() => { setActiveMenuId(null); setDeletingRoadmapId(rm.id); }}
                          className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 text-red-400"
                        >
                          Delete Roadmap
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Main: Title & Description */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#F9FAFB] group-hover:text-[#10B981] transition-colors">
                    {rm.title}
                  </h3>
                  <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">
                    {rm.description}
                  </p>
                </div>

                {/* Card Middle: Progress Bar & Topics Count */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#9CA3AF]">{rm.completedTopics || 0} / {rm.totalTopics || 6} topics</span>
                    <span className="text-[#10B981]">{rm.progressPercent || 0}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#10B981] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#10B981]"
                      style={{ width: `${rm.progressPercent || 0}%` }}
                    />
                  </div>

                  {/* Path Preview Line */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {(rm.pathPreview || ['completed', 'current', 'upcoming']).map((st, i) => (
                        <span
                          key={i}
                          className={`h-2 w-2 rounded-full ${
                            st === 'completed'
                              ? 'bg-[#10B981] shadow-[0_0_4px_#10B981]'
                              : st === 'current'
                              ? 'bg-[#F59E0B] ring-2 ring-amber-500/30'
                              : 'bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#9CA3AF]">{rm.duration || '4 weeks'}</span>
                  </div>
                </div>

                {/* Card Bottom: Last Studied & Action */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                  <span className="text-[11px] text-[#9CA3AF]">Last studied {rm.lastStudied || 'Recently'}</span>
                  <button
                    onClick={() => onOpenInteractiveRoadmap ? onOpenInteractiveRoadmap(rm.id) : onOpenCreateRoadmap()}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  >
                    <span>Open Roadmap</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="glass-card rounded-3xl p-4 border border-white/10 space-y-2 bg-[#121824]/80">
            {filteredRoadmaps.map((rm) => (
              <div
                key={rm.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#10B981]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F9FAFB]">{rm.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                      {rm.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#9CA3AF]">{rm.description}</p>
                </div>

                <div className="flex items-center gap-6 shrink-0 text-xs">
                  <div className="text-right">
                    <div className="font-bold text-[#10B981]">{rm.progressPercent || 0}%</div>
                    <div className="text-[10px] text-[#9CA3AF]">{rm.completedTopics || 0}/{rm.totalTopics || 6} topics</div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="text-[#F9FAFB]">{rm.duration || '4 weeks'}</div>
                    <div className="text-[10px] text-[#9CA3AF]">{rm.lastStudied || 'Recently'}</div>
                  </div>

                  <button
                    onClick={() => onOpenInteractiveRoadmap ? onOpenInteractiveRoadmap(rm.id) : onOpenCreateRoadmap()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-semibold hover:opacity-90 transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  >
                    <span>Open Roadmap</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingRoadmapId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingRoadmapId(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-[#121824] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 text-center"
            >
              <div className="h-12 w-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F9FAFB]">Delete Roadmap?</h3>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  This action cannot be undone. All topic progress will be permanently removed.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setDeletingRoadmapId(null)}
                  className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
