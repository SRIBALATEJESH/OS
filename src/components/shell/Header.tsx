'use client';

import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  Plus,
  ChevronDown,
  User,
  PanelRight,
  MapPin,
  CheckSquare,
  FileText,
  BrainCircuit,
  Code2,
  LogOut,
} from 'lucide-react';
import { NavItemKey } from '@/types';
import { NAV_ITEMS } from '@/data/mockData';
import { AICreatorType } from './AskAIDrawer';
import { QuickAddType } from './QuickAddModal';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  activeTab: NavItemKey;
  onOpenMobileSidebar: () => void;
  onOpenAskAI: (mode?: AICreatorType) => void;
  onOpenQuickAdd: (type?: QuickAddType) => void;
  isContextPanelOpen: boolean;
  onToggleContextPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onOpenAskAI,
  onOpenQuickAdd,
  isContextPanelOpen,
  onToggleContextPanel,
}) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAskAIDropdownOpen, setIsAskAIDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
      }
    });
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Error signing out', e);
    }
    window.location.href = '/login';
  };

  const activeNavItem = NAV_ITEMS.find((item) => item.key === activeTab);

  return (
    <header className="h-16 sticky top-0 z-20 glass-header px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Toggle & Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/10 transition-colors"
          aria-label="Open Mobile Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
            <span>Workspace</span>
            <span>/</span>
            <span className="font-medium text-[#F9FAFB]">{activeNavItem?.section || 'OVERVIEW'}</span>
          </div>
          <h1 className="text-lg md:text-xl font-semibold text-[#F9FAFB] tracking-tight">
            {activeNavItem?.label || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Right Actions Header Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Dynamic Ask AI Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setIsAskAIDropdownOpen(!isAskAIDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:opacity-90 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] group cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-emerald-100 group-hover:rotate-12 transition-transform" />
            <span className="text-xs md:text-sm font-semibold">Ask AI</span>
            <ChevronDown className="h-3.5 w-3.5 text-emerald-100 ml-0.5" />
          </button>

          {/* Ask AI Options */}
          {isAskAIDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsAskAIDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-[#121824]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl py-1.5 z-40 animate-fade-in">
                <div className="px-3 py-1 text-[10px] font-bold text-[#9CA3AF] uppercase">Dedicated AI Creators</div>
                <button
                  onClick={() => {
                    setIsAskAIDropdownOpen(false);
                    onOpenAskAI('chat');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10 flex items-center gap-2"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#10B981]" /> AI Doubt Tutor Chat
                </button>
                <button
                  onClick={() => {
                    setIsAskAIDropdownOpen(false);
                    onOpenAskAI('roadmap');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10 flex items-center gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#10B981]" /> AI Canvas Roadmap Creator
                </button>
                <button
                  onClick={() => {
                    setIsAskAIDropdownOpen(false);
                    onOpenAskAI('quiz');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10 flex items-center gap-2"
                >
                  <BrainCircuit className="h-3.5 w-3.5 text-[#10B981]" /> AI Quiz Generator
                </button>
                <button
                  onClick={() => {
                    setIsAskAIDropdownOpen(false);
                    onOpenAskAI('note');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10 flex items-center gap-2"
                >
                  <FileText className="h-3.5 w-3.5 text-[#10B981]" /> AI Notes Creator
                </button>
                <button
                  onClick={() => {
                    setIsAskAIDropdownOpen(false);
                    onOpenAskAI('coding');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10 flex items-center gap-2"
                >
                  <Code2 className="h-3.5 w-3.5 text-[#10B981]" /> AI Coding Generator
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quick Add Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[#F9FAFB] hover:bg-white/10 transition-all text-xs md:text-sm font-medium"
          >
            <Plus className="h-4 w-4 text-[#10B981]" />
            <span className="hidden sm:inline">Quick Add</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
          </button>

          {/* Quick Add Popup Options */}
          {isQuickAddOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsQuickAddOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-[#121824]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl py-1.5 z-40 animate-fade-in">
                <div className="px-3 py-1 text-[10px] font-bold text-[#9CA3AF] uppercase">Quick Create Items</div>
                <button
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    onOpenQuickAdd('task');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10 flex items-center gap-2"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-[#10B981]" /> Add Study Task
                </button>

                <button
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    onOpenQuickAdd('roadmap');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10 flex items-center gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#10B981]" /> Create Roadmap
                </button>

                <button
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    onOpenQuickAdd('note');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10 flex items-center gap-2"
                >
                  <FileText className="h-3.5 w-3.5 text-[#10B981]" /> Draft AI Note
                </button>

                <button
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    onOpenQuickAdd('quiz');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10 flex items-center gap-2"
                >
                  <BrainCircuit className="h-3.5 w-3.5 text-[#10B981]" /> Create Practice Quiz
                </button>

                <button
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    onOpenQuickAdd('coding');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10 flex items-center gap-2"
                >
                  <Code2 className="h-3.5 w-3.5 text-[#10B981]" /> Add Coding Challenge
                </button>
              </div>
            </>
          )}
        </div>

        {/* Toggle Right Context Panel */}
        <button
          onClick={onToggleContextPanel}
          className={`
            p-2 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5
            ${isContextPanelOpen 
              ? 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981]' 
              : 'bg-white/5 border-white/10 text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/10'
            }
          `}
          title="Toggle Context Panel"
        >
          <PanelRight className="h-4.5 w-4.5" />
        </button>

        {/* User Profile Avatar & Log Out Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 pl-2 border-l border-white/10 hover:opacity-80 transition-opacity cursor-pointer"
            title="Account Options"
          >
            <div className="h-8 w-8 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] font-semibold text-xs shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden xl:flex flex-col text-left max-w-[140px]">
              <span className="text-xs font-semibold text-[#F9FAFB] leading-tight truncate">
                {userEmail ? userEmail.split('@')[0] : 'Account'}
              </span>
              <span className="text-[10px] text-[#9CA3AF] truncate">
                {userEmail || 'Signed in'}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-[#121824]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl py-1.5 z-40 animate-fade-in">
                <div className="px-3 py-1.5 border-b border-white/10 text-[10px] text-[#9CA3AF] truncate">
                  Signed in as <span className="font-semibold text-white truncate block">{userEmail || 'StudyFlow User'}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" /> Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
