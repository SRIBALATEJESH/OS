'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Circle, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface NodeItem {
  id: string;
  name: string;
  subtopic: string;
  status: 'completed' | 'in-progress' | 'not-started';
  progress: number;
  description: string;
}

const NODES: NodeItem[] = [
  {
    id: 'node-js',
    name: 'Node.js',
    subtopic: 'Event Loop & Async I/O',
    status: 'completed',
    progress: 100,
    description: 'Non-blocking I/O model, libuv thread pool, and event emitter patterns.',
  },
  {
    id: 'express-js',
    name: 'Express.js',
    subtopic: 'Middleware & Routing',
    status: 'in-progress',
    progress: 72,
    description: 'Custom middleware chains, request pipeline, error handling, and routing modules.',
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    subtopic: 'Aggregation & Indexing',
    status: 'not-started',
    progress: 0,
    description: 'Document database modeling, compound indexes, and aggregation pipelines.',
  },
];

interface RoadmapSnapshotProps {
  onSelectTopic: (topic: NodeItem) => void;
}

export const RoadmapSnapshot: React.FC<RoadmapSnapshotProps> = ({ onSelectTopic }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('express-js');

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.85));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4 bg-[#121824]/80 relative overflow-hidden">
      {/* Header & Zoom Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[#F9FAFB]">
            <Layers className="h-4.5 w-4.5 text-[#10B981]" />
            <h3 className="text-base font-bold">Your Learning Path</h3>
          </div>
          <p className="text-xs text-[#9CA3AF]">Backend Development Roadmap Snapshot</p>
        </div>

        {/* Pan / Zoom Toolbar */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/10 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-0.5 text-[10px] font-mono text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
            title="Reset Zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/10 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Legend Header */}
      <div className="flex items-center gap-4 text-[11px] text-[#9CA3AF] pt-1">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" /> ● Completed
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" /> ◐ In Progress
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20 border border-white/30" /> ○ Not Started
        </span>
      </div>

      {/* Interactive Visual Node Tree Canvas */}
      <div 
        className="py-6 px-4 bg-white/5 rounded-2xl border border-white/10 transition-transform duration-300 origin-center"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 relative">
          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-1/2 left-12 right-12 h-0.5 bg-white/10 -translate-y-1/2 -z-0" />

          {NODES.map((node) => {
            const isSelected = selectedNodeId === node.id;

            return (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  onSelectTopic(node);
                }}
                className={`
                  z-10 w-full md:w-56 p-4 rounded-2xl border cursor-pointer transition-all duration-200 space-y-2
                  ${isSelected
                    ? 'bg-[#121824] border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-2 ring-[#10B981]/30 scale-105'
                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F9FAFB]">{node.name}</span>
                  {node.status === 'completed' && (
                    <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                  )}
                  {node.status === 'in-progress' && (
                    <span className="text-xs font-bold text-[#F59E0B]">◐ 72%</span>
                  )}
                  {node.status === 'not-started' && (
                    <Circle className="h-4 w-4 text-[#9CA3AF]" />
                  )}
                </div>

                <div className="text-[11px] text-[#9CA3AF] font-medium line-clamp-1">
                  {node.subtopic}
                </div>

                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      node.status === 'completed' ? 'bg-[#10B981] shadow-[0_0_6px_#10B981]' : node.status === 'in-progress' ? 'bg-[#F59E0B]' : 'bg-transparent'
                    }`}
                    style={{ width: `${node.progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
