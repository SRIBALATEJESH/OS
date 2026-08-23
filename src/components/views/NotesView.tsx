'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Tag,
  Edit3,
  BookOpen,
  Copy,
  Check,
  Trash2,
  ArrowLeft,
  Save,
  FileText,
  Code2,
  BrainCircuit,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Download,
  FileDown,
  Printer,
  Inbox,
} from 'lucide-react';
import { notesService, NoteItem } from '@/services/notes.service';
import { FormattedMarkdown } from '@/components/ui/FormattedMarkdown';

interface NotesViewProps {
  initialTopic?: string;
  onOpenQuickAdd?: () => void;
}

export const NotesView: React.FC<NotesViewProps> = ({ initialTopic, onOpenQuickAdd }) => {
  const [mode, setMode] = useState<'library' | 'ai-generator' | 'reader-editor'>(initialTopic ? 'ai-generator' : 'library');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mounted, setMounted] = useState<boolean>(false);

  // Notes state - Realtime Supabase Data Only
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Fetch notes strictly from Supabase service */
  const loadNotes = async () => {
    setIsLoading(true);
    const dbNotes = await notesService.getAllNotes();
    setNotes(dbNotes || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadNotes();

    const handleNotesUpdated = () => {
      loadNotes();
    };
    window.addEventListener('studyflow-notes-updated', handleNotesUpdated);
    return () => window.removeEventListener('studyflow-notes-updated', handleNotesUpdated);
  }, []);

  useEffect(() => {
    if (initialTopic) {
      setGenTopic(initialTopic);
      setSearchQuery(initialTopic);
    }
  }, [initialTopic]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Generator form state
  const [genTopic, setGenTopic] = useState(initialTopic || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  // Custom Topic Expansion Modal state
  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);
  const [expandTopicInput, setExpandTopicInput] = useState('');
  const [expandStyle, setExpandStyle] = useState('Deep dive technical analysis & edge cases');

  const presetTopics = [
    '🛡️ Security & Auth Vulnerabilities',
    '⚡ Performance & Memory Optimization',
    '🏗️ Architecture & Design Patterns',
    '🎯 Tricky Interview Edge Cases',
    '🐛 Common Bugs & Debugging',
    '🧪 Testing Strategies & Mocking',
  ];

  const handleExpandNotesWithAI = async (targetTopic?: string) => {
    if (!selectedNote) return;
    const topicToExpand = targetTopic || expandTopicInput || `${editorTitle} - Advanced Concepts`;
    setIsExpanding(true);
    setIsExpandModalOpen(false);

    try {
      const res = await fetch('/api/ai/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          topic: topicToExpand,
          style: expandStyle,
          depth: 'Custom Topic Expansion',
        }),
      });

      const json = await res.json();
      const aiNote = json?.note;

      const expansionMarkdown = aiNote
        ? `\n\n---\n## 🤖 AI Topic Expansion: ${topicToExpand}\n\n### Detailed Breakdown\n${aiNote.summary || ''}\n\n### Key Concepts & Edge Cases\n${(aiNote.key_concepts || []).map((k: string) => `- ${k}`).join('\n')}\n\n### Code & Architectural Examples\n${(aiNote.examples || []).map((e: string) => `- ${e}`).join('\n')}\n\n### Revision Points\n${(aiNote.revision_points || []).map((r: string) => `- ${r}`).join('\n')}`
        : `\n\n---\n## 🤖 AI Topic Expansion: ${topicToExpand}\nAdditional breakdown generated for ${topicToExpand}.\n`;

      const updatedContent = editorContent + expansionMarkdown;
      setEditorContent(updatedContent);

      const updatedNote = await notesService.updateNote(selectedNote.id, {
        title: editorTitle,
        content: updatedContent,
      });

      if (updatedNote) {
        setSelectedNote(updatedNote);
        setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
      }
    } catch (err) {
      console.error('[NotesView] Expand notes error:', err);
    } finally {
      setIsExpanding(false);
    }
  };

  useEffect(() => {
    if (initialTopic) {
      setGenTopic(initialTopic);
      setMode('ai-generator');
    }
  }, [initialTopic]);

  const handleOpenNote = (note: NoteItem) => {
    setSelectedNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setMode('reader-editor');
    setIsEditing(false);
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setIsSaving(true);

    const updated = await notesService.updateNote(selectedNote.id, {
      title: editorTitle,
      content: editorContent,
    });

    if (updated) {
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setSelectedNote(updated);
    }

    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCreateNewNote = async () => {
    setIsSaving(true);
    const newNoteData: Omit<NoteItem, 'id'> = {
      title: 'Untitled Study Note',
      content: '# New Study Note\nStart writing your note content here...',
      source: 'manual',
    };

    const created = await notesService.createNote(newNoteData);
    if (created) {
      setNotes((prev) => [created, ...prev]);
      handleOpenNote(created);
      setIsEditing(true);
    }
    setIsSaving(false);
  };

  const handleGenerateNotes = async () => {
    if (!genTopic.trim()) return;
    setIsGenerating(true);
    try {
      // Call Gemini 3.5 Flash-Lite via secure /api/ai/notes route
      const res = await fetch('/api/ai/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          topic: genTopic,
          style: 'Detailed explanation',
          depth: 'Standard',
        }),
      });

      const json = await res.json();
      const aiNote = json?.note;

      const generatedContent = aiNote
        ? `# ${aiNote.title}\n\n## Summary\n${aiNote.summary}\n\n## Key Concepts\n${(aiNote.key_concepts || []).map((k: string) => `- ${k}`).join('\n')}\n\n## Examples\n${(aiNote.examples || []).map((e: string) => `- ${e}`).join('\n')}\n\n## Common Mistakes\n${(aiNote.common_mistakes || []).map((m: string) => `- ${m}`).join('\n')}\n\n## Revision Points\n${(aiNote.revision_points || []).map((r: string) => `- ${r}`).join('\n')}`
        : `# ${genTopic}\n\n## Overview\nDetailed AI-generated structured notes for revision.\n`;

      const newNoteData: Omit<NoteItem, 'id'> = {
        title: aiNote?.title || `${genTopic} Notes`,
        content: generatedContent,
        source: 'ai_generated',
      };

      const created = await notesService.createNote(newNoteData);
      if (created) {
        setNotes((prev) => [created, ...prev]);
        handleOpenNote(created);
      }
    } catch (err) {
      console.error('[NotesView] AI generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteNote = async (id: string, title: string) => {
    if (confirm(`Delete note "${title}" from Supabase?`)) {
      await notesService.deleteNote(id);
      setNotes((prev) => prev.filter((item) => item.id !== id));
      if (selectedNote?.id === id) {
        setMode('library');
      }
    }
  };

  /* ── Clean PDF Export Handler ── */
  const handleExportPDF = (noteToExport: NoteItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF!');
      return;
    }

    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${noteToExport.title} - StudyFlow Notes</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Inter', sans-serif; color: #111827; line-height: 1.6; margin: 0; background: #fff; }
            .header { border-bottom: 2px solid #10B981; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .logo-title { font-size: 24px; font-weight: 800; color: #064E3B; }
            .badge { background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: uppercase; }
            .meta-bar { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 12px 18px; margin-bottom: 25px; font-size: 12px; color: #4B5563; }
            h1 { font-size: 22px; font-weight: 700; color: #111827; }
            pre { background: #1E293B; color: #38BDF8; padding: 16px; border-radius: 10px; white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
            .footer { margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 15px; text-align: center; font-size: 11px; color: #9CA3AF; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-title">⚡ StudyFlow Notes</div>
            <span class="badge">${noteToExport.source}</span>
          </div>
          <h1>${noteToExport.title}</h1>
          <div class="meta-bar"><div><strong>Date:</strong> ${formattedDate}</div><div><strong>Source:</strong> ${noteToExport.source}</div></div>
          <div class="content">
            ${noteToExport.content
              .replace(/^# (.*$)/gim, '<h1>$1</h1>')
              .replace(/^## (.*$)/gim, '<h2>$1</h2>')
              .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
              .replace(/\n\n/g, '</p><p>')}
          </div>
          <div class="footer">Generated with StudyFlow AI Workspace</div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-16 h-full overflow-y-auto scroll-smooth custom-scrollbar pr-1">
      {/* SCREEN 10: NOTES LIBRARY MODE */}
      {mode === 'library' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 py-3 px-4 -mx-4 rounded-2xl border-b border-white/10 bg-[#0B0F17]/90 backdrop-blur-md shadow-lg">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#F9FAFB]">My Notes</h1>
              <p className="text-xs md:text-sm text-[#9CA3AF]">
                Live Supabase database store. Create and export notes as clean PDF documents.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('ai-generator')}
                className="px-4 py-2 rounded-xl bg-white/5 text-[#F9FAFB] border border-white/10 text-xs font-semibold hover:bg-white/10 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-[#10B981]" />
                <span>Generate with AI</span>
              </button>

              <button
                onClick={handleCreateNewNote}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <Plus className="h-4 w-4" />
                <span>New Note</span>
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="glass-card rounded-2xl p-3 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#121824]/80">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-white/10 text-xs bg-white/5 text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#10B981]"
              />
            </div>

            <button onClick={loadNotes} className="p-2 rounded-xl bg-white/5 text-[#9CA3AF] hover:text-white border border-white/10">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-12 text-center text-xs text-[#9CA3AF] flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 text-[#10B981] animate-spin" />
              <span>Fetching live notes from Supabase database...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredNotes.length === 0 && (
            <div className="glass-card rounded-3xl p-12 text-center border border-white/10 bg-[#121824]/80 space-y-4 max-w-md mx-auto my-8">
              <div className="h-16 w-16 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto">
                <Inbox className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F9FAFB]">No Notes Saved Yet</h3>
                <p className="text-xs text-[#9CA3AF] mt-1">Your Supabase notes database is empty. Click below to add your first note!</p>
              </div>
              <button
                onClick={handleCreateNewNote}
                className="px-5 py-2.5 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:opacity-90 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Create First Note
              </button>
            </div>
          )}

          {/* Realtime Grid / List Cards */}
          {!isLoading && filteredNotes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {filteredNotes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleOpenNote(n)}
                  className="glass-card rounded-2xl p-4 border border-white/10 hover:border-[#10B981]/50 hover:-translate-y-1 transition-all duration-300 space-y-3 bg-[#121824]/80 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#34D399] px-2.5 py-0.5 rounded-full bg-[#10B981]/20 border border-[#10B981]/30">
                        {n.source}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPDF(n);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-[#10B981]/20 text-[#9CA3AF] hover:text-[#34D399] border border-white/10 transition-all flex items-center gap-1 text-[10px] font-bold"
                          title="Export Note as PDF"
                        >
                          <FileDown className="h-3.5 w-3.5" /> PDF
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(n.id, n.title);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#9CA3AF] hover:text-red-400 transition-colors"
                          title="Delete Note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#F9FAFB] group-hover:text-[#10B981] transition-colors">
                        {n.title}
                      </h3>
                      <p className="text-xs text-[#9CA3AF] line-clamp-2 mt-1">{n.content}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px] text-[#9CA3AF]">
                    <span className="text-[#10B981] font-semibold">Supabase Synced</span>
                    <span>Live Record</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCREEN 11: AI NOTES GENERATOR MODE */}
      {mode === 'ai-generator' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF]">
            <button onClick={() => setMode('library')} className="hover:text-[#F9FAFB] flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Notes
            </button>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-white/10 bg-[#121824]/80 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Sparkles className="h-5 w-5 text-[#10B981]" />
              <div>
                <h1 className="text-lg font-bold text-[#F9FAFB]">Generate Study Notes</h1>
                <p className="text-xs text-[#9CA3AF]">Enter any custom topic or select a quick topic preset to generate structured study notes saved to Supabase.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#F9FAFB] mb-1.5">Custom Topic / Subject</label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Express Middleware & Event-Driven Architecture"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#9CA3AF] mb-2">Popular Suggested Topics:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '🚀 Express Middleware & Pipelines',
                    '💾 PostgreSQL Indexing & B-Trees',
                    '🔒 JWT vs Session Authentication',
                    '⚡ React Server Components',
                    '🌐 System Design: Rate Limiter',
                    '☕ Java Multithreading & Concurrency',
                  ].map((st, idx) => (
                    <button
                      key={idx}
                      onClick={() => setGenTopic(st.replace(/^[^\s]+\s/, ''))}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#F9FAFB] hover:border-[#10B981] hover:bg-[#10B981]/10 transition-all font-medium"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateNotes}
                disabled={isGenerating || !genTopic.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>{isGenerating ? 'Structuring Notes...' : 'Generate Notes with AI'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 12: NOTE EDITOR / READER MODE */}
      {mode === 'reader-editor' && selectedNote && (
        <div className="space-y-6">
          <div className="sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-4 -mx-4 rounded-2xl border-b border-white/10 bg-[#0B0F17]/90 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF]">
              <button onClick={() => setMode('library')} className="hover:text-[#F9FAFB] flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Notes
              </button>
              <span>/</span>
              <span className="text-[#10B981] font-bold">{editorTitle}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setExpandTopicInput(`${editorTitle} - Advanced Concepts`);
                  setIsExpandModalOpen(true);
                }}
                disabled={isExpanding}
                className="px-3.5 py-1.5 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 text-[#34D399] hover:bg-[#10B981] hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                title="Expand notes with custom AI topics, edge cases, and architectural code examples"
              >
                {isExpanding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span>{isExpanding ? 'Expanding Notes...' : 'Expand Notes with AI'}</span>
              </button>

              <button
                onClick={() => handleExportPDF(selectedNote)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 flex items-center gap-1.5"
              >
                <FileDown className="h-4 w-4" />
                <span>Export PDF</span>
              </button>

              {isEditing ? (
                <button
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:opacity-90 flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save Note</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10"
                >
                  Edit Note
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 glass-card rounded-3xl p-6 border border-white/10 bg-[#121824]/80 min-h-[500px] space-y-4">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    className="w-full px-4 py-2 text-base font-bold rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                    placeholder="Note Title"
                  />
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="w-full h-full min-h-[420px] font-mono text-xs p-4 rounded-2xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-xs space-y-3 leading-relaxed text-[#F9FAFB]">
                  <h1 className="text-xl font-bold text-[#F9FAFB]">{editorTitle}</h1>
                  <div className="p-3 rounded-2xl bg-[#10B981]/20 border border-[#10B981]/30 text-[#34D399] font-medium">
                    Source: {selectedNote.source} • Synced to Supabase
                  </div>
                  <FormattedMarkdown
                    content={editorContent}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10"
                  />
                </div>
              )}
            </div>

            {/* Right Metadata Panel */}
            <div className="lg:col-span-4 glass-card rounded-3xl p-6 border border-white/10 bg-[#121824]/80 space-y-4">
              <h3 className="text-xs font-bold text-[#F9FAFB] pb-2 border-b border-white/10">Note Attributes</h3>
              <div className="space-y-2 text-xs text-[#F9FAFB]">
                <div><span className="text-[#9CA3AF]">Source:</span> <span className="font-bold">{selectedNote.source}</span></div>
                <div><span className="text-[#9CA3AF]">Status:</span> <span className="font-bold text-[#10B981]">Supabase Synced</span></div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={() => handleExportPDF(selectedNote)}
                  className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#F9FAFB] hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5 text-[#10B981]" /> Print / Save PDF Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM AI TOPIC EXPANSION MODAL */}
      {mounted && createPortal(
        <AnimatePresence>
          {isExpandModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg glass-card rounded-3xl p-6 border border-white/10 bg-[#121824] shadow-2xl space-y-5 my-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[#10B981]/20 text-[#34D399]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#F9FAFB]">Expand Note with AI</h3>
                      <p className="text-xs text-[#9CA3AF]">Specify a custom subtopic or choose a preset focus</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsExpandModalOpen(false)}
                    className="p-1.5 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/10 transition-all"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#F9FAFB] mb-1.5">
                      Expansion Topic / Focus Subject
                    </label>
                    <input
                      type="text"
                      value={expandTopicInput}
                      onChange={(e) => setExpandTopicInput(e.target.value)}
                      placeholder="e.g. Security & Vulnerabilities in Express"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-2">
                      Or select a Quick Preset Topic:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {presetTopics.map((pt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setExpandTopicInput(`${editorTitle} - ${pt.replace(/^[^\s]+\s/, '')}`)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#F9FAFB] hover:border-[#10B981] hover:bg-[#10B981]/10 transition-all font-medium cursor-pointer"
                        >
                          {pt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#F9FAFB] mb-1.5">
                      Expansion Depth & Depth Focus
                    </label>
                    <select
                      value={expandStyle}
                      onChange={(e) => setExpandStyle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0B0F17] text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                    >
                      <option value="Deep dive technical analysis & edge cases">Deep Dive Technical Analysis & Edge Cases</option>
                      <option value="Architectural code examples & practical syntax">Architectural Code Examples & Practical Syntax</option>
                      <option value="Interview questions, pitfalls & cheat sheet">Interview Tricky Questions & Cheat Sheet</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setIsExpandModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-xs font-semibold text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleExpandNotesWithAI()}
                    disabled={isExpanding || !expandTopicInput.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                  >
                    {isExpanding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span>Generate Expansion</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
