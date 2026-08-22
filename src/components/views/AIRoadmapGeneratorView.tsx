'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Move,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Clock,
  BookOpen,
  CheckCircle2,
  Loader2,
  Layers,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { roadmapService } from '@/services/roadmap.service';

interface CanvasNode {
  id: string;
  parentId: string | null;
  title: string;
  topic: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Completed' | 'In Progress' | 'Not Started';
  x: number;
  y: number;
  subtopics: string[];
}

interface AIRoadmapGeneratorViewProps {
  onBack: () => void;
  onSave: (roadmapData: any) => void;
}

export const AIRoadmapGeneratorView: React.FC<AIRoadmapGeneratorViewProps> = ({ onBack, onSave }) => {
  /* ── Canvas Interactivity State ── */
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeTool, setActiveTool] = useState<'select' | 'pan'>('select');
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  /* ── Floating AI Generator Prompt Drawer State ── */
  const [isPromptOpen, setIsPromptOpen] = useState<boolean>(true);
  const [goal, setGoal] = useState<string>('Master Production Distributed Systems & Microservices in Go');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [duration, setDuration] = useState<string>('2 months');
  const [weeklyCommitment, setWeeklyCommitment] = useState<string>('10 hours/week');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(0);

  const generationSteps = [
    'Parsing learning goal & context...',
    'Extracting prerequisite topics...',
    'Building 2D tree hierarchy & branch nodes...',
    'Calculating Bezier branch coordinates...',
    'Rendering interactive canvas nodes...',
  ];

  /* ── Node State (Generated Canvas Tree) ── */
  const [nodes, setNodes] = useState<CanvasNode[]>([
    {
      id: 'node-root',
      parentId: null,
      title: 'Distributed Systems & Go Microservices',
      topic: 'Root Milestone',
      duration: '8 weeks',
      difficulty: 'Advanced',
      status: 'In Progress',
      x: 380,
      y: 60,
      subtopics: ['Core Concepts', 'Raft Consensus', 'Kafka Messaging'],
    },
    {
      id: 'node-1',
      parentId: 'node-root',
      title: 'Go Concurrent Primitives & Goroutines',
      topic: 'Module 1',
      duration: '1 week',
      difficulty: 'Intermediate',
      status: 'Completed',
      x: 120,
      y: 220,
      subtopics: ['Channels & Mutexes', 'Context Package', 'Worker Pools'],
    },
    {
      id: 'node-2',
      parentId: 'node-root',
      title: 'gRPC & Protocol Buffers Architecture',
      topic: 'Module 2',
      duration: '2 weeks',
      difficulty: 'Intermediate',
      status: 'In Progress',
      x: 640,
      y: 220,
      subtopics: ['Protobuf Schemas', 'Streaming gRPC', 'Interceptors'],
    },
    {
      id: 'node-3',
      parentId: 'node-1',
      title: 'Distributed Consensus: Raft & Paxos',
      topic: 'Module 3',
      duration: '2 weeks',
      difficulty: 'Advanced',
      status: 'Not Started',
      x: 60,
      y: 400,
      subtopics: ['Leader Election', 'Log Replication', 'ETCD Basics'],
    },
    {
      id: 'node-4',
      parentId: 'node-2',
      title: 'Event-Driven Architectures with Kafka',
      topic: 'Module 4',
      duration: '2 weeks',
      difficulty: 'Advanced',
      status: 'Not Started',
      x: 420,
      y: 400,
      subtopics: ['Producers & Consumers', 'Partitioning', 'Event Sourcing'],
    },
    {
      id: 'node-5',
      parentId: 'node-2',
      title: 'Observability, Tracing & Prometheus',
      topic: 'Module 5',
      duration: '1 week',
      difficulty: 'Intermediate',
      status: 'Not Started',
      x: 780,
      y: 400,
      subtopics: ['OpenTelemetry', 'Jaeger Tracing', 'Metrics Exporters'],
    },
  ]);

  /* ── Auto Fit View Logic ── */
  const handleFitView = () => {
    if (!nodes.length || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const nodeW = 240;
    const nodeH = 160;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      if (n.x < minX) minX = n.x;
      if (n.x + nodeW > maxX) maxX = n.x + nodeW;
      if (n.y < minY) minY = n.y;
      if (n.y + nodeH > maxY) maxY = n.y + nodeH;
    });

    const contentW = maxX - minX;
    const contentH = maxY - minY;

    if (contentW <= 0 || contentH <= 0) return;

    const scaleX = (rect.width - 100) / contentW;
    const scaleY = (rect.height - 100) / contentH;
    const fittedZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.2);

    const centerX = rect.width / 2 - ((minX + contentW / 2) * fittedZoom);
    const centerY = rect.height / 2 - ((minY + contentH / 2) * fittedZoom);

    setZoomLevel(fittedZoom);
    setPanOffset({ x: Math.round(centerX), y: Math.round(centerY) });
  };

  /* Auto-fit view when nodes are generated or screen mode changes */
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleFitView();
    }, 150);
    return () => clearTimeout(timer);
  }, [nodes.length, isFullScreen]);

  /* ── Modals State ── */
  const [editingNode, setEditingNode] = useState<CanvasNode | null>(null);
  const [addingChildParentId, setAddingChildParentId] = useState<string | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState<string>('');

  /* ── Canvas Drag & Pan Handlers ── */
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'pan' || e.button === 1) {
      setIsPanning(true);
      setDragStartPos({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - dragStartPos.x,
        y: e.clientY - dragStartPos.y,
      });
    } else if (draggedNodeId) {
      const dx = (e.clientX - dragStartPos.x) / zoomLevel;
      const dy = (e.clientY - dragStartPos.y) / zoomLevel;
      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggedNodeId
            ? { ...node, x: Math.round(node.x + dx), y: Math.round(node.y + dy) }
            : node
        )
      );
      setDragStartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  /* ── AI Roadmap Generation Trigger ── */
  const handleGenerateCanvasRoadmap = async () => {
    if (!goal.trim()) return;
    setIsGenerating(true);
    setGenerationStep(0);

    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => (prev < generationSteps.length - 1 ? prev + 1 : prev));
    }, 500);

    try {
      const res = await fetch('/api/ai/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          level,
          duration,
          dailyTime: '2 hours/day',
          preferences: 'Detailed step-by-step topic breakdown',
        }),
      });

      const json = await res.json();
      const roadmapData = json?.roadmap;

      if (!roadmapData || !roadmapData.topics) {
        throw new Error(json?.error || 'Invalid roadmap structure from API');
      }

      // Convert topics hierarchy to CanvasNode 2D tree
      const generatedNodes: CanvasNode[] = [];

      // Root Node
      const rootId = 'node-root';
      generatedNodes.push({
        id: rootId,
        parentId: null,
        title: roadmapData.title || goal,
        topic: 'Root Milestone',
        duration: roadmapData.duration || duration,
        difficulty: (roadmapData.difficulty as any) || level,
        status: 'In Progress',
        x: 450,
        y: 60,
        subtopics: (roadmapData.topics || []).slice(0, 3).map((t: any) => t.title),
      });

      const topics = roadmapData.topics || [];
      const totalTop = topics.length;
      const startX = 60;
      const spacingX = Math.max(260, Math.min(340, 1200 / Math.max(1, totalTop)));

      topics.forEach((topic: any, idx: number) => {
        const topId = `node-top-${idx + 1}`;
        const topX = startX + idx * spacingX;
        const topY = 240;

        const subtopicTitles = (topic.children || []).map((c: any) => c.title);

        generatedNodes.push({
          id: topId,
          parentId: rootId,
          title: topic.title,
          topic: `Module ${idx + 1}`,
          duration: topic.estimated_minutes ? `${Math.round(topic.estimated_minutes / 60)} hrs` : '1 week',
          difficulty: (topic.difficulty as any) || level,
          status: idx === 0 ? 'Completed' : idx === 1 ? 'In Progress' : 'Not Started',
          x: topX,
          y: topY,
          subtopics: subtopicTitles.length > 0 ? subtopicTitles : [topic.description || 'Core concepts'],
        });

        // Add 2nd level children if available
        if (topic.children && topic.children.length > 0) {
          topic.children.forEach((child: any, cIdx: number) => {
            const childId = `node-child-${idx}-${cIdx}`;
            generatedNodes.push({
              id: childId,
              parentId: topId,
              title: child.title,
              topic: `Topic ${idx + 1}.${cIdx + 1}`,
              duration: child.estimated_minutes ? `${child.estimated_minutes} mins` : '3 days',
              difficulty: (child.difficulty as any) || topic.difficulty || level,
              status: 'Not Started',
              x: topX + (cIdx % 2 === 0 ? -30 : 30),
              y: topY + 180 + cIdx * 130,
              subtopics: [child.description || 'Topic breakdown'],
            });
          });
        }
      });

      setNodes(generatedNodes);
      setTimeout(() => {
        handleFitView();
      }, 100);
    } catch (err) {
      console.error('[AIRoadmapGeneratorView] AI generation failed:', err);
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  /* ── Add Child Node Handler ── */
  const handleAddChildNode = () => {
    if (!addingChildParentId || !newNodeTitle.trim()) return;
    const parent = nodes.find((n) => n.id === addingChildParentId);
    const newId = `node-${Date.now()}`;
    const newNode: CanvasNode = {
      id: newId,
      parentId: addingChildParentId,
      title: newNodeTitle.trim(),
      topic: `Module ${nodes.length}`,
      duration: '1 week',
      difficulty: 'Intermediate',
      status: 'Not Started',
      x: parent ? parent.x + 80 : 400,
      y: parent ? parent.y + 180 : 300,
      subtopics: ['Subtopic 1', 'Subtopic 2'],
    };
    setNodes((prev) => [...prev, newNode]);
    setAddingChildParentId(null);
    setNewNodeTitle('');
  };

  /* ── Delete Node Handler ── */
  const handleDeleteNode = (id: string) => {
    if (confirm('Delete this canvas node and all its child branches?')) {
      const idsToDelete = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        nodes.forEach((n) => {
          if (n.parentId && idsToDelete.has(n.parentId) && !idsToDelete.has(n.id)) {
            idsToDelete.add(n.id);
            changed = true;
          }
        });
      }
      setNodes((prev) => prev.filter((n) => !idsToDelete.has(n.id)));
    }
  };

  const handleSaveCanvasRoadmap = async () => {
    const saved = await roadmapService.createRoadmap({
      title: goal || 'AI Canvas Roadmap',
      description: `Structured learning path with ${nodes.length} topics generated by Gemini 3.5 Flash-Lite.`,
      category: 'AI Generated',
      status: 'in-progress',
      duration: duration || '4 weeks',
      nodes: nodes,
      totalTopics: nodes.length,
    });
    onSave(saved);
  };

  return (
    <div className={`space-y-3 animate-fade-in flex flex-col select-none ${isFullScreen ? 'fixed inset-0 z-50 bg-[#0B0F17] p-6 h-screen w-screen overflow-hidden' : 'pb-12 h-[calc(100vh-80px)]'}`}>

      {/* ── HEADER TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF] mb-0.5">
            <button onClick={onBack} className="hover:text-white flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Roadmaps
            </button>
            <span>/</span>
            <span className="text-[#10B981] font-bold">AI Canvas Builder</span>
            {isFullScreen && (
              <span className="ml-2 px-2 py-0.5 rounded-md bg-[#10B981]/20 text-[#34D399] text-[10px] font-bold border border-[#10B981]/30">
                FULLSCREEN MODE
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-[#F9FAFB]">Interactive AI Roadmap Canvas</h1>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Select vs Pan Tool */}
          <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10 text-xs">
            <button
              onClick={() => setActiveTool('select')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${activeTool === 'select' ? 'bg-[#10B981] text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              <MousePointer className="h-3.5 w-3.5" /> Select Node
            </button>
            <button
              onClick={() => setActiveTool('pan')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${activeTool === 'pan' ? 'bg-[#10B981] text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              <Move className="h-3.5 w-3.5" /> Pan Canvas
            </button>
          </div>

          {/* Zoom & Fit Controls */}
          <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10 text-xs">
            <button onClick={() => setZoomLevel((z) => Math.max(0.3, z - 0.1))} className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white" title="Zoom Out">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-[#F9FAFB] min-w-[36px] text-center">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.1))} className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white" title="Zoom In">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleFitView}
              className="px-2 py-1 hover:bg-[#10B981]/20 text-[#34D399] rounded-lg text-xs font-bold border-l border-white/10 flex items-center gap-1 transition-all"
              title="Fit All Nodes in View"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Fit View</span>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isFullScreen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-white/5 text-[#F9FAFB] border-white/10 hover:bg-white/10'
            }`}
            title="Toggle Fullscreen View"
          >
            <Maximize2 className="h-3.5 w-3.5 text-[#10B981]" />
            <span>{isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          {/* Toggle AI Drawer */}
          <button
            onClick={() => setIsPromptOpen(!isPromptOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${isPromptOpen ? 'bg-[#10B981]/20 border-[#10B981] text-[#34D399]' : 'bg-white/5 border-white/10 text-[#9CA3AF] hover:text-white'}`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#10B981]" /> AI Prompt Panel
          </button>

          {/* Save Roadmap */}
          <button
            onClick={handleSaveCanvasRoadmap}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <Check className="h-4 w-4" /> Save Roadmap
          </button>
        </div>
      </div>

      {/* ── CANVAS WORKSPACE CONTAINER ── */}
      <div className="relative h-[calc(100vh-140px)] min-h-[620px] rounded-3xl border border-white/10 bg-[#0B0F17] overflow-hidden">

        {/* ── FLOATING AI GENERATOR PROMPT DRAWER ── */}
        <AnimatePresence>
          {isPromptOpen && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              className="absolute left-4 top-4 z-20 w-80 glass-card rounded-3xl p-5 border border-[#10B981]/40 bg-[#121824]/95 text-xs space-y-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-sm font-bold text-[#F9FAFB]">
                  <Sparkles className="h-4 w-4 text-[#10B981]" />
                  <span>AI Canvas Generator</span>
                </div>
                <button onClick={() => setIsPromptOpen(false)} className="text-[#9CA3AF] hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-[#F9FAFB] mb-1">What do you want to learn?</label>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[#F9FAFB] mb-1">Level</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as any)}
                      className="w-full p-2 rounded-xl bg-[#121824] border border-white/10 text-xs text-[#F9FAFB]"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#F9FAFB] mb-1">Target Duration</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 2 weeks, 3 months"
                      className="w-full p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateCanvasRoadmap}
                  disabled={isGenerating}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating Canvas Nodes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate 2D Canvas Tree</span>
                    </>
                  )}
                </button>

                {isGenerating && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-center">
                    <div className="text-[11px] font-semibold text-[#34D399]">{generationSteps[generationStep]}</div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#10B981] h-full transition-all duration-300"
                        style={{ width: `${((generationStep + 1) / generationSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 2D INFINITE DOT-MATRIX CANVAS SURFACE ── */}
        <div
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`w-full h-full relative overflow-hidden cursor-${activeTool === 'pan' || isPanning ? 'grab' : 'default'}`}
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: `${24 * zoomLevel}px ${24 * zoomLevel}px`,
          }}
        >
          {/* Canvas Transform Workspace */}
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: '0 0',
              width: '3000px',
              height: '3000px',
              position: 'absolute',
            }}
          >
            {/* SVG Bezier Branch Connection Lines Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <linearGradient id="aiBranchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {nodes.map((node) => {
                if (!node.parentId) return null;
                const parentNode = nodes.find((n) => n.id === node.parentId);
                if (!parentNode) return null;

                const startX = parentNode.x + 120;
                const startY = parentNode.y + 70;
                const endX = node.x + 120;
                const endY = node.y;

                const controlY1 = startY + (endY - startY) / 2;
                const controlY2 = startY + (endY - startY) / 2;
                const pathData = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;

                return (
                  <g key={`edge-${node.id}`}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke="url(#aiBranchGrad)"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                    />
                    <circle cx={startX} cy={startY} r="4" fill="#10B981" />
                    <circle cx={endX} cy={endY} r="4" fill="#34D399" />
                  </g>
                );
              })}
            </svg>

            {/* Canvas Tree Nodes Cards */}
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  position: 'absolute',
                  width: '240px',
                }}
                onMouseDown={(e) => {
                  if (activeTool === 'select') {
                    e.stopPropagation();
                    setDraggedNodeId(node.id);
                    setDragStartPos({ x: e.clientX, y: e.clientY });
                  }
                }}
                className={`
                  glass-card rounded-2xl p-4 border transition-all shadow-xl z-10 cursor-move group
                  ${node.status === 'Completed'
                    ? 'bg-[#121824]/90 border-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : node.status === 'In Progress'
                    ? 'bg-[#121824]/90 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-[#121824]/90 border-white/10 hover:border-[#10B981]/50'
                  }
                `}
              >
                {/* Node Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                    {node.topic}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingChildParentId(node.id);
                      }}
                      className="p-1 rounded-md hover:bg-white/10 text-white"
                      title="Add Child Branch"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                      className="p-1 rounded-md hover:bg-red-500/20 text-red-400"
                      title="Delete Branch"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Node Body */}
                <div className="py-2 space-y-1">
                  <h3 className="text-xs font-bold text-[#F9FAFB] leading-snug">{node.title}</h3>
                  <div className="text-[10px] text-[#9CA3AF]">{node.duration} • {node.difficulty}</div>
                </div>

                {/* Subtopics Pills */}
                <div className="flex flex-wrap gap-1 pt-1 border-t border-white/10">
                  {node.subtopics.map((sub, i) => (
                    <span key={i} className="text-[9px] text-[#9CA3AF] bg-white/5 border border-white/10 px-1.5 py-0.2 rounded-md">
                      {sub}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ADD CHILD NODE MODAL ── */}
      <AnimatePresence>
        {addingChildParentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="glass-card rounded-3xl p-6 border border-[#10B981]/40 bg-[#121824] w-full max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-sm font-bold text-[#F9FAFB]">
                <span>Add Branch Topic Node</span>
                <button onClick={() => setAddingChildParentId(null)} className="text-[#9CA3AF] hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F9FAFB] mb-1">Topic Title</label>
                <input
                  type="text"
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                  placeholder="e.g. Distributed Caching & Redis"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setAddingChildParentId(null)} className="px-4 py-2 rounded-xl bg-white/5 text-xs text-[#9CA3AF]">
                  Cancel
                </button>
                <button onClick={handleAddChildNode} className="px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold">
                  Add Node to Canvas
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
