'use client';

import React, { useState, useEffect } from 'react';
import { getUserScopedKey } from '@/lib/supabase/authHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Sparkles, 
  Search, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trophy, 
  Play, 
  RefreshCw, 
  ArrowLeft, 
  HelpCircle, 
  AlertCircle, 
  Check, 
  ArrowRight,
  BookOpen,
  Loader2,
  Trash2
} from 'lucide-react';

export interface QuizQuestionItem {
  question: string;
  options: string[];
  correctAnswer: string;
  correctIdx: number;
  explanation: string;
}

export interface QuizCardItem {
  id: string;
  title: string;
  topic: string;
  questions: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  bestScore: number;
  attempts: number;
  status: 'Completed' | 'In Progress' | 'Needs Review' | 'Not Started';
  questionsData: QuizQuestionItem[];
}

interface QuizzesViewProps {
  initialTopic?: string;
}

export const QuizzesView: React.FC<QuizzesViewProps> = ({ initialTopic }) => {
  const [subMode, setSubMode] = useState<'library' | 'generator' | 'player' | 'result'>(initialTopic ? 'generator' : 'library');

  // Generator form state
  const [genTopic, setGenTopic] = useState(initialTopic || '');
  const [genDifficulty, setGenDifficulty] = useState('Intermediate');
  const [genCount, setGenCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialTopic) {
      setGenTopic(initialTopic);
      setSubMode('generator');
    }
  }, [initialTopic]);

  // Real-time user created quizzes state with persistent localStorage sync
  const [quizzes, setQuizzes] = useState<QuizCardItem[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizCardItem | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [lastScore, setLastScore] = useState<number>(0);

  // Load saved quizzes on mount and listen for real-time quick add / AI events
  const loadQuizzes = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(getUserScopedKey('studyflow_saved_quizzes')) || '[]');
      const custom = JSON.parse(localStorage.getItem(getUserScopedKey('studyflow_quizzes')) || '[]');
      // Merge unique by ID
      const map = new Map<string, QuizCardItem>();
      [...custom, ...saved].forEach((q: any) => {
        map.set(q.id, {
          id: q.id,
          title: q.title || 'Practice Quiz',
          topic: q.topic || 'General',
          questions: q.questionsCount || q.questions?.length || 5,
          difficulty: q.difficulty || 'Intermediate',
          bestScore: q.bestScore || 0,
          attempts: q.attempts || 0,
          status: q.status || 'Not Started',
          questionsData: q.questionsData || q.questions || [],
        });
      });
      setQuizzes(Array.from(map.values()));
    } catch (e) {
      console.warn('Failed to load quizzes from localStorage', e);
    }
  };

  useEffect(() => {
    loadQuizzes();

    const handleQuizzesUpdated = () => {
      loadQuizzes();
    };
    window.addEventListener('studyflow-quizzes-updated', handleQuizzesUpdated);
    return () => window.removeEventListener('studyflow-quizzes-updated', handleQuizzesUpdated);
  }, []);

  // Helper to update quizzes state AND localStorage synchronously
  const saveQuizzes = (updated: QuizCardItem[]) => {
    setQuizzes(updated);
    try {
      localStorage.setItem(getUserScopedKey('studyflow_saved_quizzes'), JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save quizzes to localStorage', e);
    }
  };

  const handleGenerateAIQuiz = async () => {
    if (!genTopic.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genTopic,
          difficulty: genDifficulty,
          count: genCount,
          types: ['MCQ'],
        }),
      });

      const json = await res.json();
      const generatedQuiz = json?.quiz;

      const formattedQuestions: QuizQuestionItem[] = (generatedQuiz?.questions || []).map((q: any) => {
        const correctStr = String(q.correct_answer || '').trim();
        const correctIdx = q.options?.findIndex((opt: string) => opt.trim() === correctStr);
        return {
          question: q.question,
          options: q.options || [],
          correctAnswer: correctStr,
          correctIdx: correctIdx >= 0 ? correctIdx : 0,
          explanation: q.explanation || '',
        };
      });

      const newQuiz: QuizCardItem = {
        id: Date.now().toString(),
        title: generatedQuiz?.title || `${genTopic} Quiz`,
        topic: genTopic,
        questions: formattedQuestions.length || genCount,
        difficulty: genDifficulty as any,
        bestScore: 0,
        attempts: 0,
        status: 'Not Started',
        questionsData: formattedQuestions,
      };

      saveQuizzes([newQuiz, ...quizzes]);
      setSelectedQuiz(newQuiz);
      setCurrentQuestionIdx(0);
      setSelectedAnswers({});
      setSubMode('player');
    } catch (err) {
      console.error('[QuizzesView] Quiz generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartQuiz = (q: QuizCardItem) => {
    setSelectedQuiz(q);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setSubMode('player');
  };

  const handleCalculateScore = () => {
    if (!selectedQuiz || !selectedQuiz.questionsData.length) return;
    let correctCount = 0;
    selectedQuiz.questionsData.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIdx) {
        correctCount++;
      }
    });
    const scorePct = Math.round((correctCount / selectedQuiz.questionsData.length) * 100);
    setLastScore(scorePct);

    // Update best score, attempt count, and status persistently
    const updatedQuizzes = quizzes.map(item => {
      if (item.id === selectedQuiz.id) {
        return {
          ...item,
          attempts: item.attempts + 1,
          bestScore: Math.max(item.bestScore, scorePct),
          status: 'Completed' as const,
        };
      }
      return item;
    });

    saveQuizzes(updatedQuizzes);
    setSubMode('result');
  };

  const handleDeleteQuiz = (id: string, title: string) => {
    if (confirm(`Delete quiz "${title}"?`)) {
      const updated = quizzes.filter(item => item.id !== id);
      saveQuizzes(updated);
    }
  };

  const activeQuestions = selectedQuiz?.questionsData || [];
  const completedCount = quizzes.filter(q => q.status === 'Completed').length;
  const avgScore = quizzes.length > 0 
    ? Math.round(quizzes.reduce((acc, q) => acc + q.bestScore, 0) / quizzes.length) 
    : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* SCREEN: QUIZ LIBRARY MODE */}
      {subMode === 'library' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/10">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#F9FAFB]">Quiz Center</h1>
              <p className="text-xs md:text-sm text-[#9CA3AF]">
                Generate custom practice quizzes powered by Gemini 3.5 Flash-Lite.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSubMode('generator')}
                className="px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-[#059669] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate Quiz with AI</span>
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-1 bg-[#121824]/80">
              <div className="text-[11px] font-semibold text-[#9CA3AF]">Saved Quizzes</div>
              <div className="text-2xl font-bold text-[#F9FAFB]">{quizzes.length}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-1 bg-[#121824]/80">
              <div className="text-[11px] font-semibold text-[#9CA3AF]">Completed</div>
              <div className="text-2xl font-bold text-[#F9FAFB]">{completedCount}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-1 bg-[#121824]/80">
              <div className="text-[11px] font-semibold text-[#9CA3AF]">Average Score</div>
              <div className="text-2xl font-bold text-[#10B981]">{avgScore}%</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-1 bg-[#121824]/80">
              <div className="text-[11px] font-semibold text-[#9CA3AF]">Engine</div>
              <div className="text-xs font-bold text-[#34D399] truncate">Gemini 3.5 Flash-Lite</div>
            </div>
          </div>

          {/* Quiz Cards Grid or Empty State */}
          {quizzes.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 border border-white/10 text-center space-y-4 bg-[#121824]/80">
              <div className="h-14 w-14 rounded-2xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mx-auto border border-[#10B981]/20">
                <BrainCircuit className="h-7 w-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-[#F9FAFB]">No Quizzes Yet</h3>
                <p className="text-xs text-[#9CA3AF]">
                  Create your first practice quiz on any topic using real-time AI generation.
                </p>
              </div>
              <button
                onClick={() => setSubMode('generator')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all inline-flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <Sparkles className="h-4 w-4" /> Create First Quiz
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((q) => (
                <div
                  key={q.id}
                  className="glass-card rounded-3xl p-6 border border-white/10 hover:border-[#10B981]/50 transition-all space-y-4 bg-[#121824]/80 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                        {q.topic}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${q.status === 'Completed' ? 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30' : 'bg-white/10 text-[#9CA3AF] border border-white/10'}`}>
                          {q.status}
                        </span>
                        <button
                          onClick={() => handleDeleteQuiz(q.id, q.title)}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-[#9CA3AF] hover:text-red-400 transition-colors"
                          title="Delete Quiz"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-[#F9FAFB]">{q.title}</h3>
                    <div className="text-xs text-[#9CA3AF]">{q.questions} Questions • {q.difficulty}</div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9CA3AF]">Best Score</span>
                      <span className="font-bold text-[#10B981]">{q.bestScore}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartQuiz(q)}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" /> Play Quiz
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCREEN: AI QUIZ GENERATOR MODE */}
      {subMode === 'generator' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF]">
            <button onClick={() => setSubMode('library')} className="hover:text-[#F9FAFB] flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Quiz Library
            </button>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-white/10 bg-[#121824]/80 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Sparkles className="h-5 w-5 text-[#10B981]" />
              <div>
                <h1 className="text-lg font-bold text-[#F9FAFB]">Generate a Quiz with AI</h1>
                <p className="text-xs text-[#9CA3AF]">Type any topic to instantly generate practice questions powered by Gemini 3.5 Flash-Lite.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#F9FAFB] mb-1">Topic</label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Docker Commands, React Hooks, Python Data Structures"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#F9FAFB] mb-1">Difficulty</label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-[#121824] text-[#F9FAFB]"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#F9FAFB] mb-1">Questions Count</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={genCount}
                    onChange={(e) => setGenCount(Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="Custom question count (e.g. 7)"
                    className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <button
                disabled={isGenerating || !genTopic.trim()}
                onClick={handleGenerateAIQuiz}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                    Generating Real-time Questions with Gemini 3.5 Flash-Lite...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate & Start Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN: QUIZ PLAYER MODE */}
      {subMode === 'player' && selectedQuiz && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <span className="text-[10px] font-bold text-[#10B981] uppercase">{selectedQuiz.topic}</span>
              <h1 className="text-lg font-bold text-[#F9FAFB]">{selectedQuiz.title}</h1>
            </div>
            <div className="text-xs font-bold text-[#9CA3AF]">
              Question {currentQuestionIdx + 1} of {activeQuestions.length}
            </div>
          </div>

          {activeQuestions.length > 0 ? (
            <div className="glass-card rounded-3xl p-8 border border-white/10 bg-[#121824]/80 space-y-6">
              <h2 className="text-base font-bold text-[#F9FAFB]">
                {activeQuestions[currentQuestionIdx]?.question}
              </h2>

              <div className="space-y-2.5">
                {activeQuestions[currentQuestionIdx]?.options.map((opt, i) => {
                  const isSelected = selectedAnswers[currentQuestionIdx] === i;
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedAnswers(prev => ({ ...prev, [currentQuestionIdx]: i }))}
                      className={`p-4 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${isSelected ? 'bg-[#10B981] text-white border-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10 text-[#F9FAFB] hover:border-[#10B981]/50'}`}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#9CA3AF] disabled:opacity-40"
                >
                  Previous
                </button>

                {currentQuestionIdx < activeQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                    className="px-5 py-2.5 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-[#059669]"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleCalculateScore}
                    className="px-5 py-2.5 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-[#059669]"
                  >
                    Submit Quiz
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#9CA3AF]">
              No questions found for this quiz. Try generating a new quiz.
            </div>
          )}
        </div>
      )}

      {/* SCREEN: QUIZ RESULT MODE */}
      {subMode === 'result' && selectedQuiz && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="glass-card rounded-3xl p-8 border border-white/10 bg-[#121824]/80 space-y-6 text-center">
            <div className="h-20 w-20 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center mx-auto text-2xl font-bold border-4 border-[#10B981]/30">
              {lastScore}%
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F9FAFB]">Quiz Complete!</h1>
              <p className="text-xs text-[#9CA3AF]">
                {selectedQuiz.title} • Score: {lastScore}%
              </p>
            </div>

            {/* Answer Explanations */}
            <div className="text-left space-y-3 pt-4 border-t border-white/10">
              <h3 className="text-xs font-bold text-[#F9FAFB] uppercase tracking-wider">Question Review & Explanations:</h3>
              {selectedQuiz.questionsData.map((q, idx) => {
                const userAnsIdx = selectedAnswers[idx];
                const isCorrect = userAnsIdx === q.correctIdx;
                return (
                  <div key={idx} className={`p-4 rounded-2xl border text-xs space-y-2 ${isCorrect ? 'bg-[#10B981]/10 border-[#10B981]/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className="font-bold text-[#F9FAFB] flex items-start gap-2">
                      <span>{idx + 1}. {q.question}</span>
                    </div>
                    <div className="text-[#9CA3AF]">
                      Your Answer: <span className={isCorrect ? 'text-[#34D399] font-bold' : 'text-red-400 font-bold'}>{userAnsIdx !== undefined ? q.options[userAnsIdx] : 'Unanswered'}</span>
                    </div>
                    {!isCorrect && (
                      <div className="text-[#34D399]">
                        Correct Answer: <span className="font-bold">{q.correctAnswer}</span>
                      </div>
                    )}
                    {q.explanation && (
                      <div className="text-[11px] text-[#9CA3AF] pt-1 border-t border-white/5">
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button onClick={() => handleStartQuiz(selectedQuiz)} className="px-5 py-2.5 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-[#059669]">
                Try Again
              </button>
              <button onClick={() => setSubMode('library')} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#F9FAFB]">
                Back to Quiz Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
