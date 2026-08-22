'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Check,
  AlertCircle,
  Pencil,
  Clock,
  Folder,
  MousePointer2,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Save,
  Sparkles,
  Layers,
} from 'lucide-react';
import { roadmapService } from '@/services/roadmap.service';

/* ─── Types ───────────────────────────────────────────────── */
interface CanvasNode {
  id: string;
  title: string;
  label: string;
  description: string;
  duration: string;
  x: number;
  y: number;
  parentId: string | null;
}

interface CreateRoadmapViewProps {
  onBack: () => void;
  onSave: (roadmapData: any) => void;
}

/* ─── Helper: Bezier Path Generator ────────────────────────── */
const getBezierPath = (parent: CanvasNode, child: CanvasNode) => {
  const sx = parent.x + 90;
  const sy = parent.y + 40;
  const ex = child.x + 90;
  const ey = child.y;
  const midY = (sy + ey) / 2;
  return `M ${sx} ${sy} C ${sx} ${midY}, ${ex} ${midY}, ${ex} ${ey}`;
};

export const CreateRoadmapView: React.FC<CreateRoadmapViewProps> = ({ onBack, onSave }) => {
  /* ── Form State ── */
  const [roadmapName, setRoadmapName] = useState('Backend Development');
  const [description, setDescription] = useState('Build production-ready backend development skills.');
  const [learningGoal, setLearningGoal] = useState('Become job-ready for backend software engineering roles');
  const [category, setCategory] = useState('Development');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [duration, setDuration] = useState('3 months');

  /* ── Canvas Node State ── */
  const [nodes, setNodes] = useState<CanvasNode[]>([
    { id: 'root', title: 'Backend Engineering', label: 'Goal Root', description: 'Master modern backend development.', duration: '3 months', x: 480, y: 50, parentId: null },
    { id: 'top-1', title: 'Web Fundamentals', label: 'Module 1', description: 'HTTP, DNS, Request/Response cycle', duration: '1 week', x: 200, y: 220, parentId: 'root' },
    { id: 'top-2', title: 'Node.js Core', label: 'Module 2', description: 'Event Loop, Non-blocking I/O, Async', duration: '2 weeks', x: 480, y: 220, parentId: 'root' },
    { id: 'top-3', title: 'Express.js Framework', label: 'Module 3', description: 'Routing, Custom Middleware, Error Handling', duration: '2 weeks', x: 760, y: 220, parentId: 'root' },
    { id: 'sub-1', title: 'HTTP Methods', label: 'Sub-topic', description: 'GET, POST, PUT, DELETE semantics', duration: '2 days', x: 120, y: 390, parentId: 'top-1' },
    { id: 'sub-2', title: 'REST Principles', label: 'Sub-topic', description: 'Resource modeling & status codes', duration: '3 days', x: 280, y: 390, parentId: 'top-1' },
    { id: 'sub-3', title: 'Event Loop', label: 'Sub-topic', description: 'Libuv & event phases', duration: '4 days', x: 420, y: 390, parentId: 'top-2' },
    { id: 'sub-4', title: 'Middleware Pipeline', label: 'Sub-topic', description: 'Request processing flow', duration: '4 days', x: 760, y: 390, parentId: 'top-3' },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>('root');
  const [tool, setTool] = useState<'select' | 'pan'>('select');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNode, setEditingNode] = useState<CanvasNode | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDuration, setNewDuration] = useState('1 week');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });

  const selectedNode = nodes.find(n => n.id === selectedId) || nodes[0];

  /* Update Root Node title if form changes */
  useEffect(() => {
    setNodes(prev => prev.map(n => n.id === 'root' ? { ...n, title: roadmapName || 'Untitled Roadmap', duration } : n));
  }, [roadmapName, duration]);

  /* ── Drag & Pan logic ── */
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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.3, Math.min(2, prev - e.deltaY * 0.001)));
  }, []);

  /* ── CRUD ── */
  const addNode = () => {
    if (!newTitle.trim()) return;
    const parentNode = selectedNode || nodes[0];
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      title: newTitle.trim(),
      label: newLabel.trim() || (parentNode.id === 'root' ? `Module ${nodes.filter(n => n.parentId === 'root').length + 1}` : 'Sub-topic'),
      description: newDesc.trim() || 'Custom topic module',
      duration: newDuration.trim() || '1 week',
      x: parentNode.x + (Math.random() * 180 - 90),
      y: parentNode.y + 160,
      parentId: parentNode.id,
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedId(newNode.id);
    setShowAddModal(false);
    setNewTitle('');
    setNewLabel('');
    setNewDesc('');
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
    setNodes(prev => prev.map(n => n.id === editingNode.id ? { ...n, ...editingNode } : n));
    if (editingNode.id === 'root') setRoadmapName(editingNode.title);
    setEditingNode(null);
  };

  const handleSave = async () => {
    if (!roadmapName.trim()) {
      setValidationError('Roadmap name is required.');
      return;
    }
    if (nodes.length <= 1) {
      setValidationError('Add at least one learning topic node on the canvas.');
      return;
    }
    setValidationError(null);
    setShowSuccessToast(true);

    const savedRoadmap = await roadmapService.createRoadmap({
      title: roadmapName,
      description,
      goal: learningGoal,
      category,
      difficulty,
      duration,
      nodes,
      totalTopics: nodes.length,
    });

    setTimeout(() => {
      onSave(savedRoadmap);
    }, 1000);
  };

  const edges = nodes
    .filter(n => n.parentId)
    .map(n => {
      const parent = nodes.find(p => p.id === n.parentId);
      if (!parent) return null;
      return { id: `${parent.id}-${n.id}`, parent, child: n };
    })
    .filter(Boolean) as { id: string; parent: CanvasNode; child: CanvasNode }[];

  return (
    <div className="space-y-4 animate-fade-in pb-4 h-[calc(100vh-80px)] flex flex-col">
      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#10B981] text-white px-5 py-3 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-3 text-sm font-semibold"
          >
            <Check className="h-5 w-5 bg-white/20 rounded-full p-0.5" />
            <span>Roadmap canvas saved! Returning to library...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF] mb-1">
            <button onClick={onBack} className="hover:text-[#F9FAFB] flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Roadmaps
            </button>
            <span>/</span>
            <span className="text-[#10B981]">Create Canvas Roadmap</span>
          </div>
          <h1 className="text-xl font-bold text-[#F9FAFB]">Roadmap Builder Canvas</h1>
        </div>

        {/* Toolbar & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tool mode */}
          <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10">
            <button
              onClick={() => setTool('select')}
              className={`p-2 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-all ${tool === 'select' ? 'bg-[#10B981] text-white' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              <MousePointer2 className="h-3.5 w-3.5" /> Select
            </button>
            <button
              onClick={() => setTool('pan')}
              className={`p-2 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-all ${tool === 'pan' ? 'bg-[#10B981] text-white' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              <Move className="h-3.5 w-3.5" /> Pan
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-0.5">
            <button onClick={() => setZoom(prev => Math.max(0.3, prev - 0.1))} className="p-1.5 hover:bg-white/10 rounded-lg text-[#9CA3AF]">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono px-2 text-[#9CA3AF] min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} className="p-1.5 hover:bg-white/10 rounded-lg text-[#9CA3AF]">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 hover:bg-white/10 rounded-lg text-[#9CA3AF] border-l border-white/10" title="Reset View">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[#F9FAFB] text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5 text-[#10B981]" /> Add Node
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <Check className="h-4 w-4" /> Save Roadmap
          </button>
        </div>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2 flex-shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ── CANVAS + SETTINGS WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">

        {/* ── INTERACTIVE CANVAS (8 Cols) ── */}
        <div
          ref={canvasRef}
          className="lg:col-span-8 rounded-3xl border border-white/10 bg-[#0B0F17] overflow-hidden relative"
          style={{ cursor: tool === 'pan' || isPanning ? 'grab' : 'default' }}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
        >
          {/* Dot matrix bg */}
          <div
            data-canvas-bg="true"
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.3) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              backgroundPosition: `${pan.x % 32}px ${pan.y % 32}px`,
            }}
          />

          {/* Ambient radial glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#10B981]/5 blur-[120px] pointer-events-none" />

          {/* Transformed layer */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* SVG Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              <defs>
                <filter id="createGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
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
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeOpacity="0.2"
                    filter="url(#createGlow)"
                  />
                  <path
                    d={getBezierPath(edge.parent, edge.child)}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeOpacity="0.7"
                  />
                </g>
              ))}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
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
                        ? 'bg-gradient-to-br from-[#10B981]/30 to-[#059669]/20 border-[#10B981]/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        : isSelected
                          ? 'bg-[#121824]/90 border-[#10B981] ring-2 ring-[#10B981]/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                          : 'bg-[#121824]/80 border-white/10 hover:border-white/20'
                      }
                    `}
                  >
                    {tool === 'select' && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-3 w-3 text-white/40" />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#10B981]">
                        {node.label}
                      </span>
                      <span className="text-[9px] text-[#9CA3AF] font-mono">{node.duration}</span>
                    </div>

                    <h3 className="text-xs font-bold text-[#F9FAFB] leading-tight truncate">
                      {node.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-4 left-4 text-[10px] text-white/30 font-mono pointer-events-none">
            Canvas Builder • Click node to select • Drag to reposition • Scroll to zoom
          </div>
        </div>

        {/* ── SETTINGS & INSPECTOR PANEL (4 Cols) ── */}
        <div className="lg:col-span-4 space-y-4 overflow-y-auto">
          {/* Roadmap Meta Card */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 bg-[#121824]/80 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Folder className="h-4 w-4 text-[#10B981]" />
              <h2 className="text-xs font-bold text-[#F9FAFB]">Roadmap Settings</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#F9FAFB] mb-1">Roadmap Title</label>
                <input
                  type="text"
                  value={roadmapName}
                  onChange={e => setRoadmapName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#F9FAFB] mb-1">Learning Goal</label>
                <input
                  type="text"
                  value={learningGoal}
                  onChange={e => setLearningGoal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#F9FAFB] mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. Full Stack, AI, DevOps"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#F9FAFB] mb-1">Est. Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="e.g. 2 weeks, 3 months"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Node Inspector Card */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 bg-[#121824]/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">Node Inspector</span>
                <h3 className="text-sm font-bold text-[#F9FAFB] truncate">{selectedNode.title}</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                {selectedNode.label}
              </span>
            </div>

            <p className="text-xs text-[#9CA3AF]">{selectedNode.description}</p>
            <div className="text-xs text-[#9CA3AF]">
              Duration: <span className="text-[#F9FAFB] font-semibold">{selectedNode.duration}</span>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex items-center gap-2 text-xs">
              <button
                onClick={() => setEditingNode({ ...selectedNode })}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-[#F9FAFB] font-semibold hover:bg-white/10 flex items-center justify-center gap-1"
              >
                <Pencil className="h-3.5 w-3.5 text-[#10B981]" /> Edit Node
              </button>
              {selectedId !== 'root' && (
                <button
                  onClick={() => deleteNode(selectedNode.id)}
                  className="py-2 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold hover:bg-red-500/20 flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
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
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md mx-4 rounded-3xl border border-white/10 bg-[#121824] p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#F9FAFB]">Add Topic Node to Canvas</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-[#9CA3AF]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-[#9CA3AF]">
                Attaching new branch under <span className="text-[#10B981] font-bold">{selectedNode.title}</span>.
              </p>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#F9FAFB] block mb-1">Topic Title *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Authentication & Security"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#F9FAFB] block mb-1">Label</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="e.g. Security Module"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#F9FAFB] block mb-1">Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="e.g. JWT tokens, hashing passwords, OAuth2"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F9FAFB] text-xs font-semibold hover:bg-white/10">
                  Cancel
                </button>
                <button onClick={addNode} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
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
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md mx-4 rounded-3xl border border-white/10 bg-[#121824] p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#F9FAFB]">Edit Node Properties</h2>
                <button onClick={() => setEditingNode(null)} className="p-1 rounded-lg hover:bg-white/10 text-[#9CA3AF]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#F9FAFB] block mb-1">Title</label>
                  <input
                    value={editingNode.title}
                    onChange={e => setEditingNode({ ...editingNode, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#F9FAFB] block mb-1">Label</label>
                  <input
                    value={editingNode.label}
                    onChange={e => setEditingNode({ ...editingNode, label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#F9FAFB] block mb-1">Description</label>
                  <textarea
                    value={editingNode.description}
                    onChange={e => setEditingNode({ ...editingNode, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981] resize-none"
                  />
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
