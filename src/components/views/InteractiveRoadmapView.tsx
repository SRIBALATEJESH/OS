'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Sparkles,
  FileText,
  BrainCircuit,
  Code2,
  Play,
  Trash2,
  Edit3,
  GripVertical,
  MousePointer2,
  Move,
  X,
  Save,
  Pencil,
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────── */
interface TreeNode {
  id: string;
  title: string;
  label: string;
  status: 'completed' | 'in-progress' | 'not-started' | 'needs-revision';
  progress: number;
  description: string;
  x: number;
  y: number;
  parentId: string | null;
}

import { roadmapService, RoadmapItem } from '@/services/roadmap.service';

/* ─── Types ───────────────────────────────────────────────── */
interface TreeNode {
  id: string;
  title: string;
  label: string;
  status: 'completed' | 'in-progress' | 'not-started' | 'needs-revision';
  progress: number;
  description: string;
  x: number;
  y: number;
  parentId: string | null;
}

interface InteractiveRoadmapViewProps {
  roadmapId?: string | null;
  onBack: () => void;
  onOpenTopicWorkspace: (topicTitle: string) => void;
  onOpenAITutor: () => void;
}

/* ─── Helpers ─────────────────────────────────────────────── */
const statusColor = (s: TreeNode['status']) => {
  switch (s) {
    case 'completed': return { bg: '#10B981', glow: 'rgba(16,185,129,0.4)', text: '#ECFDF5' };
    case 'in-progress': return { bg: '#3B82F6', glow: 'rgba(59,130,246,0.4)', text: '#EFF6FF' };
    case 'needs-revision': return { bg: '#F59E0B', glow: 'rgba(245,158,11,0.4)', text: '#FFFBEB' };
    default: return { bg: '#6B7280', glow: 'rgba(107,114,128,0.3)', text: '#F3F4F6' };
  }
};

const statusLabel = (s: TreeNode['status']) => {
  switch (s) {
    case 'completed': return 'Completed';
    case 'in-progress': return 'In Progress';
    case 'needs-revision': return 'Needs Revision';
    default: return 'Not Started';
  }
};

/* ─── Component ───────────────────────────────────────────── */
export const InteractiveRoadmapView: React.FC<InteractiveRoadmapViewProps> = ({
  roadmapId,
  onBack,
  onOpenTopicWorkspace,
  onOpenAITutor,
}) => {
  /* ── State ── */
  const [currentRoadmap, setCurrentRoadmap] = useState<RoadmapItem | null>(null);
  const [nodes, setNodes] = useState<TreeNode[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const all = await roadmapService.getAllRoadmaps();
      const rm = (roadmapId ? all.find(r => r.id === roadmapId) : null) || all[0];
      if (!rm) return;

      setCurrentRoadmap(rm);

      // If roadmap has explicit canvas nodes saved
      if (rm.nodes && Array.isArray(rm.nodes) && rm.nodes.length > 0) {
        const rootNodeId = rm.nodes[0]?.id || 'root';
        const mappedNodes: TreeNode[] = rm.nodes.map((n: any, idx: number) => ({
          id: n.id || `node-${idx}`,
          title: n.title || 'Topic Node',
          label: n.topic || n.difficulty || 'Topic',
          status: n.status === 'Completed' ? 'completed' : n.status === 'In Progress' ? 'in-progress' : 'not-started',
          progress: n.status === 'Completed' ? 100 : n.status === 'In Progress' ? 50 : 0,
          description: Array.isArray(n.subtopics) ? n.subtopics.join(', ') : n.duration || 'Learning topic node',
          x: typeof n.x === 'number' ? n.x : 200 + (idx % 3) * 250,
          y: typeof n.y === 'number' ? n.y : 80 + Math.floor(idx / 3) * 160,
          parentId: n.parentId || (idx === 0 ? null : rootNodeId),
        }));
        setNodes(mappedNodes);
      } else {
        // Build dynamic 2D canvas layout from topic list or roadmap goal
        const rootId = 'root';
        const rootNode: TreeNode = {
          id: rootId,
          title: rm.title,
          label: 'Learning Goal',
          status: rm.progressPercent && rm.progressPercent >= 100 ? 'completed' : 'in-progress',
          progress: rm.progressPercent || 25,
          description: rm.description || `Comprehensive path for ${rm.title}`,
          x: 500,
          y: 60,
          parentId: null,
        };

        const generated: TreeNode[] = [rootNode];
        const defaultTopics = [
          { title: `${rm.title} Fundamentals`, label: 'Core Protocol', progress: 100, status: 'completed' as const },
          { title: `Advanced ${rm.title}`, label: 'Deep Architecture', progress: 50, status: 'in-progress' as const },
          { title: `${rm.title} Ecosystem & Tools`, label: 'Tooling', progress: 0, status: 'not-started' as const },
          { title: `Production & Deployment`, label: 'DevOps', progress: 0, status: 'not-started' as const },
        ];

        defaultTopics.forEach((t, i) => {
          generated.push({
            id: `branch-${i}`,
            title: t.title,
            label: t.label,
            status: t.status,
            progress: t.progress,
            description: `Core modules and practical exercises for ${t.title}.`,
            x: 200 + i * 220,
            y: 240,
            parentId: rootId,
          });
        });

        setNodes(generated);
      }
    };

    loadData();
  }, [roadmapId]);

  const [selectedId, setSelectedId] = useState<string | null>('root');
  const [tool, setTool] = useState<'select' | 'pan'>('select');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNode, setEditingNode] = useState<TreeNode | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });

  /* ── Auto Fit-View logic: Calculate node bounds & center cleanly ── */
  const handleFitView = useCallback(() => {
    if (!nodes || nodes.length === 0 || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const width = canvasRect.width || 800;
    const height = canvasRect.height || 600;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.x + 190 > maxX) maxX = n.x + 190;
      if (n.y < minY) minY = n.y;
      if (n.y + 130 > maxY) maxY = n.y + 130;
    });

    const contentW = maxX - minX || 400;
    const contentH = maxY - minY || 400;

    const padding = 60;
    const scaleX = (width - padding * 2) / contentW;
    const scaleY = (height - padding * 2) / contentH;
    const fittedZoom = Math.max(0.35, Math.min(1.1, Math.min(scaleX, scaleY)));

    const centerX = minX + contentW / 2;
    const centerY = minY + contentH / 2;
    const fittedPanX = width / 2 - centerX * fittedZoom;
    const fittedPanY = height / 2 - centerY * fittedZoom;

    setZoom(fittedZoom);
    setPan({ x: fittedPanX, y: fittedPanY });
  }, [nodes]);

  // Auto-fit nodes on load or fullscreen change
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        handleFitView();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, isFullScreen, handleFitView]);

  const fallbackNode: TreeNode = {
    id: 'loading',
    title: currentRoadmap?.title || 'Loading Roadmap...',
    label: 'Loading',
    status: 'in-progress',
    progress: 0,
    description: 'Fetching roadmap node structure...',
    x: 500,
    y: 60,
    parentId: null,
  };

  const selectedNode = nodes.find(n => n.id === selectedId) || nodes[0] || fallbackNode;

  /* ── Drag logic ── */
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDraggingId(nodeId);
    setSelectedId(nodeId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y };
  }, [tool, nodes]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool === 'pan' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (tool === 'select') {
      const target = e.target as HTMLElement;
      if (target === canvasRef.current || target.closest('[data-canvas-bg]')) {
        setSelectedId(null);
      }
    }
  }, [tool, pan]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingId) {
        const dx = (e.clientX - dragStartRef.current.x) / zoom;
        const dy = (e.clientY - dragStartRef.current.y) / zoom;
        setNodes(prev => prev.map(n =>
          n.id === draggingId
            ? { ...n, x: dragStartRef.current.nodeX + dx, y: dragStartRef.current.nodeY + dy }
            : n
        ));
      }
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    };
    const handleMouseUp = () => {
      setDraggingId(null);
      setIsPanning(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, isPanning, panStart, zoom]);

  /* ── Zoom via wheel ── */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.3, Math.min(2, prev - e.deltaY * 0.001)));
  }, []);

  /* ── Node CRUD ── */
  const addNode = () => {
    if (!newTitle.trim()) return;
    const parentNode = selectedNode;
    const newNode: TreeNode = {
      id: `node-${Date.now()}`,
      title: newTitle.trim(),
      label: newLabel.trim() || 'New Topic',
      status: 'not-started',
      progress: 0,
      description: 'New topic to explore.',
      x: parentNode.x + (Math.random() * 200 - 100),
      y: parentNode.y + 160,
      parentId: parentNode.id,
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedId(newNode.id);
    setShowAddModal(false);
    setNewTitle('');
    setNewLabel('');
  };

  const deleteNode = (id: string) => {
    if (id === 'root') return;
    const getDescendants = (parentId: string): string[] => {
      const children = nodes.filter(n => n.parentId === parentId);
      return children.flatMap(c => [c.id, ...getDescendants(c.id)]);
    };
    const toRemove = new Set([id, ...getDescendants(id)]);
    setNodes(prev => prev.filter(n => !toRemove.has(n.id)));
    setSelectedId('root');
  };

  const saveEdit = () => {
    if (!editingNode) return;
    setNodes(prev => prev.map(n => n.id === editingNode.id ? { ...n, title: editingNode.title, label: editingNode.label, description: editingNode.description, status: editingNode.status } : n));
    setEditingNode(null);
  };

  /* ── SVG path generator (bezier curves like tree branches) ── */
  const getBezierPath = (parent: TreeNode, child: TreeNode) => {
    const sx = parent.x + 90;
    const sy = parent.y + 40;
    const ex = child.x + 90;
    const ey = child.y;
    const midY = (sy + ey) / 2;
    return `M ${sx} ${sy} C ${sx} ${midY}, ${ex} ${midY}, ${ex} ${ey}`;
  };

  const edges = nodes
    .filter(n => n.parentId)
    .map(n => {
      const parent = nodes.find(p => p.id === n.parentId);
      if (!parent) return null;
      return { id: `${parent.id}-${n.id}`, parent, child: n };
    })
    .filter(Boolean) as { id: string; parent: TreeNode; child: TreeNode }[];

  const [showInspector, setShowInspector] = useState(true);

  return (
    <div className={`space-y-4 animate-fade-in flex flex-col ${isFullScreen ? 'fixed inset-0 z-50 bg-[#0B0F17] p-6 h-screen w-screen overflow-hidden' : 'pb-4 h-[calc(100vh-80px)]'}`}>

      {/* ── HEADER BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF] mb-1">
            <button onClick={onBack} className="hover:text-[#F9FAFB] flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Roadmaps
            </button>
            <span>/</span>
            <span className="text-[#10B981]">{currentRoadmap?.category || 'Roadmap'}</span>
            {isFullScreen && (
              <span className="ml-2 px-2 py-0.5 rounded-md bg-[#10B981]/20 text-[#34D399] text-[10px] font-bold border border-[#10B981]/30">
                FULLSCREEN MODE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#F9FAFB]">{currentRoadmap?.title || 'Interactive Roadmap'}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] text-xs font-bold border border-[#10B981]/30">
              {currentRoadmap?.progressPercent || 0}% Complete
            </span>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tool selector */}
          <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10">
            <button
              onClick={() => setTool('select')}
              className={`p-2 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-all ${tool === 'select' ? 'bg-[#10B981] text-white' : 'text-[#9CA3AF] hover:text-white'}`}
              title="Select & Drag Nodes"
            >
              <MousePointer2 className="h-3.5 w-3.5" /> Select
            </button>
            <button
              onClick={() => setTool('pan')}
              className={`p-2 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-all ${tool === 'pan' ? 'bg-[#10B981] text-white' : 'text-[#9CA3AF] hover:text-white'}`}
              title="Pan Canvas"
            >
              <Move className="h-3.5 w-3.5" /> Pan
            </button>
          </div>

          {/* Zoom & Fit controls */}
          <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-0.5">
            <button onClick={() => setZoom(prev => Math.max(0.3, prev - 0.1))} className="p-1.5 hover:bg-white/10 rounded-lg text-[#9CA3AF]" title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono px-2 text-[#9CA3AF] min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} className="p-1.5 hover:bg-white/10 rounded-lg text-[#9CA3AF]" title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleFitView}
              className="px-2 py-1.5 hover:bg-[#10B981]/20 text-[#34D399] rounded-lg text-xs font-bold border-l border-white/10 flex items-center gap-1 transition-all"
              title="Fit All Nodes in View"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Fit View</span>
            </button>
          </div>

          {/* Toggle Inspector Panel */}
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              showInspector
                ? 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30'
                : 'bg-white/5 text-[#9CA3AF] border-white/10 hover:text-white'
            }`}
            title="Toggle Node Inspector Card"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Inspector</span>
          </button>

          {/* Fullscreen Toggle button */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isFullScreen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-white/5 text-[#F9FAFB] border-white/10 hover:bg-white/10'
            }`}
            title="Toggle Fullscreen View"
          >
            <Maximize2 className="h-3.5 w-3.5 text-[#10B981]" />
            <span>{isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          {/* Action buttons */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <Plus className="h-3.5 w-3.5" /> Add Node
          </button>
        </div>
      </div>

      {/* ── 100% FULL-WIDTH CANVAS CONTAINER ── */}
      <div className="flex-1 min-h-0 relative w-full h-full rounded-3xl border border-white/10 bg-[#0B0F17] overflow-hidden">

        {/* ── CANVAS ── */}
        <div
          ref={canvasRef}
          className="w-full h-full relative"
          style={{ cursor: tool === 'pan' || isPanning ? 'grab' : 'default' }}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
        >
          {/* Dot grid background */}
          <div
            data-canvas-bg="true"
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.3) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              backgroundPosition: `${pan.x % 32}px ${pan.y % 32}px`,
            }}
          />

          {/* Ambient glow */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-[#10B981]/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#6366F1]/5 blur-[100px] pointer-events-none" />

          {/* Transformed content layer */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* SVG Edge Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
                </linearGradient>
                <filter id="edgeGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {edges.map(edge => (
                <g key={edge.id}>
                  <path
                    d={getBezierPath(edge.parent, edge.child)}
                    fill="none"
                    stroke={statusColor(edge.child.status).bg}
                    strokeWidth="4"
                    strokeOpacity="0.15"
                    filter="url(#edgeGlow)"
                  />
                  <path
                    d={getBezierPath(edge.parent, edge.child)}
                    fill="none"
                    stroke={statusColor(edge.child.status).bg}
                    strokeWidth="2"
                    strokeOpacity="0.6"
                    strokeDasharray={edge.child.status === 'not-started' ? '6 4' : 'none'}
                  />
                  {edge.child.status === 'in-progress' && (
                    <circle r="3" fill={statusColor(edge.child.status).bg}>
                      <animateMotion dur="3s" repeatCount="indefinite" path={getBezierPath(edge.parent, edge.child)} />
                    </circle>
                  )}
                </g>
              ))}
            </svg>

            {/* Node Layer */}
            {nodes.map(node => {
              const sc = statusColor(node.status);
              const isSelected = selectedId === node.id;
              const isRoot = node.id === 'root';
              const nodeW = 180;

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); }}
                  className={`absolute group transition-shadow duration-200 ${draggingId === node.id ? 'z-30' : 'z-20'}`}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: nodeW,
                    cursor: tool === 'select' ? (draggingId === node.id ? 'grabbing' : 'grab') : 'default',
                  }}
                >
                  <div
                    className={`
                      rounded-2xl p-3 border backdrop-blur-sm transition-all duration-200
                      ${isRoot
                        ? 'bg-gradient-to-br from-[#10B981]/30 to-[#059669]/20 border-[#10B981]/50'
                        : isSelected
                          ? 'bg-[#121824]/90 border-[#10B981] ring-2 ring-[#10B981]/30'
                          : 'bg-[#121824]/80 border-white/10 hover:border-white/20'
                      }
                    `}
                    style={{
                      boxShadow: isSelected
                        ? `0 0 20px ${sc.glow}, 0 0 40px ${sc.glow}`
                        : `0 0 8px ${sc.glow}`,
                    }}
                  >
                    {tool === 'select' && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-3 w-3 text-white/40" />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.bg, boxShadow: `0 0 6px ${sc.bg}` }} />
                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: sc.bg }}>
                          {node.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#F9FAFB]">{node.progress}%</span>
                    </div>

                    <h3 className={`text-xs font-bold ${isRoot ? 'text-white' : 'text-[#F9FAFB]'} leading-tight`}>
                      {node.title}
                    </h3>

                    <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${node.progress}%`,
                          backgroundColor: sc.bg,
                          boxShadow: `0 0 8px ${sc.bg}`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Canvas hint */}
          <div className="absolute bottom-4 left-4 text-[10px] text-white/30 font-mono pointer-events-none z-10">
            Scroll to zoom • {tool === 'select' ? 'Drag nodes to reposition' : 'Drag to pan canvas'}
          </div>
        </div>

        {/* ── FLOATING GLASS NODE INSPECTOR PANEL ── */}
        <AnimatePresence>
          {showInspector && selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 z-40 w-80 max-w-[calc(100vw-32px)] glass-card rounded-3xl p-5 border border-white/10 bg-[#121824]/90 backdrop-blur-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">Node Inspector</span>
                  <h3 className="text-sm font-bold text-[#F9FAFB] truncate max-w-[180px]">{selectedNode.title}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                    style={{
                      backgroundColor: statusColor(selectedNode.status).bg + '20',
                      color: statusColor(selectedNode.status).bg,
                      borderColor: statusColor(selectedNode.status).bg + '40',
                    }}
                  >
                    {statusLabel(selectedNode.status)}
                  </span>
                  <button
                    onClick={() => setShowInspector(false)}
                    className="p-1 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/10"
                    title="Close Inspector"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#9CA3AF] leading-relaxed max-h-24 overflow-y-auto">{selectedNode.description}</p>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#9CA3AF]">Progress</span>
                  <span className="font-bold text-[#F9FAFB]">{selectedNode.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${selectedNode.progress}%`,
                      backgroundColor: statusColor(selectedNode.status).bg,
                      boxShadow: `0 0 10px ${statusColor(selectedNode.status).glow}`,
                    }}
                  />
                </div>
              </div>

              {/* Children list */}
              {nodes.filter(n => n.parentId === selectedId).length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#F9FAFB]">Sub-Topics</div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {nodes.filter(n => n.parentId === selectedId).map(child => (
                      <div
                        key={child.id}
                        onClick={() => setSelectedId(child.id)}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 cursor-pointer transition-all text-xs"
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor(child.status).bg }} />
                        <span className="text-[#F9FAFB] font-medium truncate">{child.title}</span>
                        <span className="ml-auto text-[10px] font-mono text-[#9CA3AF]">{child.progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => onOpenTopicWorkspace(selectedNode.title)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Start Learning
                </button>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => setEditingNode({ ...selectedNode })}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#F9FAFB] font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-1"
                  >
                    <Pencil className="h-3 w-3 text-[#10B981]" /> Edit
                  </button>
                  <button
                    onClick={onOpenAITutor}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#F9FAFB] font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-1"
                  >
                    <Sparkles className="h-3 w-3 text-[#10B981]" /> AI
                  </button>
                  {selectedId !== 'root' && (
                    <button
                      onClick={() => deleteNode(selectedNode.id)}
                      className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold hover:bg-red-500/20 transition-all flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Del
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── ADD NODE MODAL ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 rounded-3xl border border-white/10 bg-[#121824] p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#F9FAFB]">Add New Topic Node</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-[#9CA3AF]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-[#9CA3AF]">
                This node will be added as a child of <span className="text-[#10B981] font-bold">{selectedNode.title}</span>.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#F9FAFB] block mb-1">Topic Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Authentication & JWT"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] text-xs placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#10B981]"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#F9FAFB] block mb-1">Category Label</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="e.g. Security Layer"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] text-xs placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F9FAFB] text-xs font-semibold hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={addNode}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  Add Node
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EDIT NODE MODAL ── */}
      <AnimatePresence>
        {editingNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingNode(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 rounded-3xl border border-white/10 bg-[#121824] p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#F9FAFB]">Edit Node</h2>
                <button onClick={() => setEditingNode(null)} className="p-1 rounded-lg hover:bg-white/10 text-[#9CA3AF]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#F9FAFB] block mb-1">Title</label>
                  <input
                    value={editingNode.title}
                    onChange={e => setEditingNode(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#F9FAFB] block mb-1">Label</label>
                  <input
                    value={editingNode.label}
                    onChange={e => setEditingNode(prev => prev ? { ...prev, label: e.target.value } : null)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#F9FAFB] block mb-1">Description</label>
                  <textarea
                    value={editingNode.description}
                    onChange={e => setEditingNode(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981] resize-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#F9FAFB] block mb-1">Status</label>
                  <select
                    value={editingNode.status}
                    onChange={e => setEditingNode(prev => prev ? { ...prev, status: e.target.value as TreeNode['status'] } : null)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#121824] text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="needs-revision">Needs Revision</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingNode(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F9FAFB] text-xs font-semibold hover:bg-white/10">
                  Cancel
                </button>
                <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <Save className="h-3.5 w-3.5" /> Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
