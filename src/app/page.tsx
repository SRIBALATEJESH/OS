'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/shell/Sidebar';
import { Header } from '@/components/shell/Header';
import { ContextPanel } from '@/components/shell/ContextPanel';
import { AskAIDrawer, AICreatorType } from '@/components/shell/AskAIDrawer';
import { QuickAddModal, QuickAddType } from '@/components/shell/QuickAddModal';

import { DashboardView } from '@/components/views/DashboardView';
import { RoadmapsView } from '@/components/views/RoadmapsView';
import { CreateRoadmapView } from '@/components/views/CreateRoadmapView';
import { AIRoadmapGeneratorView } from '@/components/views/AIRoadmapGeneratorView';
import { InteractiveRoadmapView } from '@/components/views/InteractiveRoadmapView';
import { TopicWorkspaceView } from '@/components/views/TopicWorkspaceView';
import { AITutorView } from '@/components/views/AITutorView';
import { NotesView } from '@/components/views/NotesView';
import { KnowledgeView } from '@/components/views/KnowledgeView';
import { QuizzesView } from '@/components/views/QuizzesView';
import { CodingView } from '@/components/views/CodingView';
import { TasksView } from '@/components/views/TasksView';

import { NavItemKey } from '@/types';

type SubViewMode = 'none' | 'create-roadmap' | 'ai-generator' | 'interactive-tree' | 'topic-workspace';

export default function StudyFlowShell() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<NavItemKey>('dashboard');
  const [subView, setSubView] = useState<SubViewMode>('none');
  const [activeTopicTitle, setActiveTopicTitle] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Verify authenticated session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setIsAuthenticated(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setIsAuthenticated(true);
      }
    });

    try {
      const savedTab = localStorage.getItem('studyflow_active_tab') as NavItemKey | null;
      if (savedTab) setActiveTab(savedTab);
      const savedTopic = localStorage.getItem('studyflow_active_topic');
      if (savedTopic) setActiveTopicTitle(savedTopic);
    } catch (e) {}
    setIsMounted(true);

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);

  /* Modal / Drawer Dynamic States */
  const [isAskAIOpen, setIsAskAIOpen] = useState(false);
  const [askAIMode, setAskAIMode] = useState<AICreatorType>('chat');

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType>('task');

  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);

  // Reset subview and persist tab selection when switching main tabs
  const handleSelectTab = (key: NavItemKey) => {
    setSubView('none');
    setActiveTab(key);
    try {
      localStorage.setItem('studyflow_active_tab', key);
    } catch (e) {
      console.warn('Failed to persist active tab to localStorage', e);
    }
  };

  const handleUpdateTopicTitle = (topic: string) => {
    setActiveTopicTitle(topic);
    try {
      localStorage.setItem('studyflow_active_topic', topic);
    } catch (e) {
      console.warn('Failed to persist active topic to localStorage', e);
    }
  };

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setAskAIMode('chat');
        setIsAskAIOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenAskAI = (mode: AICreatorType = 'chat') => {
    setAskAIMode(mode);
    setIsAskAIOpen(true);
  };

  const handleOpenQuickAdd = (type: QuickAddType = 'task') => {
    setQuickAddType(type);
    setIsQuickAddOpen(true);
  };

  const renderActiveView = () => {
    if (subView === 'create-roadmap') {
      return (
        <CreateRoadmapView
          onBack={() => setSubView('none')}
          onSave={() => {
            setSubView('none');
            setActiveTab('roadmaps');
          }}
        />
      );
    }

    if (subView === 'ai-generator') {
      return (
        <AIRoadmapGeneratorView
          onBack={() => setSubView('none')}
          onSave={() => {
            setSubView('none');
            setActiveTab('roadmaps');
          }}
        />
      );
    }

    if (subView === 'interactive-tree') {
      return (
        <InteractiveRoadmapView
          roadmapId={activeRoadmapId}
          onBack={() => setSubView('none')}
          onOpenTopicWorkspace={(topicTitle) => {
            setActiveTopicTitle(topicTitle);
            setSubView('topic-workspace');
          }}
          onOpenAITutor={() => handleSelectTab('ai-tutor')}
        />
      );
    }

    if (subView === 'topic-workspace') {
      return (
        <TopicWorkspaceView
          topicTitle={activeTopicTitle}
          onBack={() => setSubView('interactive-tree')}
          onNavigateToAITutor={() => handleSelectTab('ai-tutor')}
          onNavigateToNotes={() => handleSelectTab('notes')}
          onNavigateToQuizzes={() => handleSelectTab('quizzes')}
          onNavigateToCoding={() => handleSelectTab('coding')}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(key) => handleSelectTab(key)}
            onOpenAskAI={() => handleOpenAskAI('chat')}
            onOpenQuickAdd={handleOpenQuickAdd}
          />
        );
      case 'roadmaps':
        return (
          <RoadmapsView
            onOpenAskAI={() => handleOpenAskAI('roadmap')}
            onOpenQuickAdd={() => handleOpenQuickAdd('roadmap')}
            onOpenCreateRoadmap={() => setSubView('create-roadmap')}
            onOpenAIRoadmapGenerator={() => setSubView('ai-generator')}
            onOpenInteractiveRoadmap={(id) => {
              setActiveRoadmapId(id || null);
              setSubView('interactive-tree');
            }}
          />
        );
      case 'ai-tutor':
        return (
          <AITutorView
            initialTopic={activeTopicTitle}
            onNavigate={(key, topic) => {
              if (topic) handleUpdateTopicTitle(topic);
              handleSelectTab(key);
            }}
          />
        );
      case 'notes':
        return <NotesView initialTopic={activeTopicTitle} onOpenQuickAdd={handleOpenQuickAdd} />;
      case 'knowledge':
        return <KnowledgeView onOpenAskAI={() => handleOpenAskAI('chat')} />;
      case 'quizzes':
        return <QuizzesView initialTopic={activeTopicTitle} />;
      case 'coding':
        return <CodingView initialTopic={activeTopicTitle} />;
      case 'tasks':
        return <TasksView onOpenQuickAdd={handleOpenQuickAdd} />;
      default:
        return (
          <DashboardView
            onNavigate={(key) => handleSelectTab(key)}
            onOpenAskAI={() => handleOpenAskAI('chat')}
            onOpenQuickAdd={handleOpenQuickAdd}
          />
        );
    }
  };

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#10B981] text-xs font-semibold">
          <div className="w-4 h-4 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
          <span>Loading StudyFlow Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-dvh bg-[#0B0F17] text-[#F9FAFB] flex flex-col md:flex-row antialiased selection:bg-[#10B981]/20 selection:text-[#10B981] relative overflow-hidden">
      {/* Ambient Gradient Mesh Spheres */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <div className="ambient-glow-3" />

      {/* 1. Left Sidebar Component */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(key) => handleSelectTab(key)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Shell Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300">
        {/* 2. Top Header Component */}
        <Header
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAskAI={handleOpenAskAI}
          onOpenQuickAdd={handleOpenQuickAdd}
          isContextPanelOpen={isContextPanelOpen}
          onToggleContextPanel={() => setIsContextPanelOpen(!isContextPanelOpen)}
        />

        {/* 3. Main Content Container Area */}
        <main
          className={`
            flex-1 w-full transition-all duration-300
            ${['ai-tutor', 'coding', 'knowledge'].includes(activeTab)
              ? 'h-full overflow-hidden p-2 md:p-4 max-w-none'
              : 'overflow-y-auto scroll-smooth p-4 sm:p-6 md:p-8 max-w-7xl mx-auto'
            }
            ${isContextPanelOpen ? 'lg:pr-[23rem]' : ''}
          `}
        >
          {renderActiveView()}
        </main>
      </div>

      {/* 4. Optional Right Context Panel */}
      <ContextPanel
        isOpen={isContextPanelOpen}
        onClose={() => setIsContextPanelOpen(false)}
        activeTab={activeTab}
        onOpenAskAI={(mode) => handleOpenAskAI(mode)}
        onNavigate={(key) => handleSelectTab(key)}
      />

      {/* Global Interactive Modals / Drawers */}
      <AskAIDrawer
        isOpen={isAskAIOpen}
        onClose={() => setIsAskAIOpen(false)}
        initialMode={askAIMode}
      />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialType={quickAddType}
      />
    </div>
  );
}
