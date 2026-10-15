import React, { useState } from 'react';
import { CampaignLevel, GlossaryTerm, QuizQuestion, Badge } from '../types/game';
import { GLOSSARY_TERMS } from '../constants/glossary';
import {
  GraduationCap,
  BookOpen,
  Award,
  CheckCircle2,
  Circle,
  HelpCircle,
  Search,
  Check,
  X,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { soundManager } from '../services/sound';

interface LearnViewProps {
  levels: CampaignLevel[];
  currentLevelId: number;
  badges: Badge[];
  onSelectLevel: (levelId: number) => void;
  onPassQuiz: (levelId: number) => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  levels,
  currentLevelId,
  badges,
  onSelectLevel,
  onPassQuiz,
}) => {
  const [subTab, setSubTab] = useState<'curriculum' | 'glossary' | 'badges'>('curriculum');
  const [searchTerm, setSearchTerm] = useState('');
  const [glossaryCategory, setGlossaryCategory] = useState<string>('ALL');

  // Quiz State
  const [activeQuizLevel, setActiveQuizLevel] = useState<CampaignLevel | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  const activeLevel = levels.find((l) => l.id === currentLevelId) || levels[0];

  const filteredGlossary = GLOSSARY_TERMS.filter((g) => {
    const matchesSearch =
      g.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = glossaryCategory === 'ALL' || g.category === glossaryCategory;
    return matchesSearch && matchesCat;
  });

  const handleStartQuiz = (level: CampaignLevel) => {
    soundManager.playClick();
    setActiveQuizLevel(level);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    soundManager.playClick();
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleGradeQuiz = () => {
    if (!activeQuizLevel) return;
    let correctCount = 0;
    activeQuizLevel.quiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const isAllCorrect = correctCount === activeQuizLevel.quiz.length;
    setQuizScore(correctCount);
    setQuizSubmitted(true);

    if (isAllCorrect) {
      soundManager.playSuccess();
      onPassQuiz(activeQuizLevel.id);
    } else {
      soundManager.playAlert();
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => {
            soundManager.playClick();
            setSubTab('curriculum');
          }}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            subTab === 'curriculum'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> 10-Level Curriculum
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setSubTab('glossary');
          }}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            subTab === 'glossary'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Financial Glossary ({GLOSSARY_TERMS.length})
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setSubTab('badges');
          }}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            subTab === 'badges'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" /> Achievements & Badges ({badges.filter((b) => b.unlocked).length}/{badges.length})
        </button>
      </div>

      {/* Tab 1: Curriculum & Missions */}
      {subTab === 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Level Selector */}
          <div className="space-y-2 lg:col-span-1">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
              Campaign Roadmap
            </h3>
            <div className="space-y-1.5">
              {levels.map((lvl) => {
                const isCurrent = lvl.id === currentLevelId;
                const isCompleted = lvl.id < currentLevelId;
                const isLocked = lvl.id > currentLevelId;

                return (
                  <button
                    key={lvl.id}
                    disabled={isLocked}
                    onClick={() => {
                      soundManager.playClick();
                      onSelectLevel(lvl.id);
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left transition flex items-center justify-between text-xs ${
                      isCurrent
                        ? 'bg-sky-950/60 border-sky-500 text-white shadow-xs'
                        : isCompleted
                        ? 'bg-zinc-950 border-emerald-900/60 text-zinc-300 hover:border-zinc-700'
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        isCompleted
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : isCurrent
                          ? 'bg-sky-500 text-white'
                          : 'bg-zinc-900 text-zinc-600'
                      }`}>
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : lvl.id}
                      </div>
                      <div>
                        <div className="font-bold text-white line-clamp-1">{lvl.title}</div>
                        <div className="text-[10px] text-zinc-400">{lvl.topic}</div>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="text-[10px] uppercase font-bold text-sky-400 px-1.5 py-0.5 rounded bg-sky-950">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Active Level Details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                    Level {activeLevel.id} · {activeLevel.topic}
                  </span>
                  <h2 className="text-base font-black text-white mt-0.5">
                    {activeLevel.title}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-zinc-500 block">Unlocked Orders</span>
                  <div className="flex gap-1 mt-0.5">
                    {activeLevel.unlockedOrderTypes.map((ot) => (
                      <span key={ot} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 font-mono">
                        {ot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Briefing */}
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                <strong className="text-white block mb-0.5">Mission Briefing:</strong>
                {activeLevel.briefing}
              </div>

              {/* Mission Objectives */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Level Objectives
                </h4>
                <div className="space-y-2">
                  {activeLevel.objectives.map((obj) => (
                    <div
                      key={obj.id}
                      className={`p-3 rounded-lg border flex items-start gap-3 text-xs transition ${
                        obj.isDone
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                          : 'bg-zinc-900/60 border-zinc-850 text-zinc-300'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {obj.isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${obj.isDone ? 'line-through text-zinc-400' : 'text-white'}`}>
                          {obj.text}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1">
                          💡 <em>Hint: {obj.hint}</em>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quiz Trigger */}
              <div className="pt-2 flex items-center justify-between border-t border-zinc-900">
                <span className="text-xs text-zinc-400">
                  Ready to test your comprehension?
                </span>
                <button
                  onClick={() => handleStartQuiz(activeLevel)}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-sky-950/40"
                >
                  <Sparkles className="w-4 h-4" /> Start Level {activeLevel.id} Checkpoint Quiz
                </button>
              </div>
            </div>

            {/* Key Takeaways Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Summary of Core Learnings
              </h4>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {activeLevel.summary.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Glossary */}
      {subTab === 'glossary' && (
        <div className="space-y-3">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search financial terms (e.g., P/E, Beta, Circuit Breaker)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs">
              {['ALL', 'Basics', 'Analysis', 'Trading', 'Risk & Strategy'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    soundManager.playClick();
                    setGlossaryCategory(cat);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap text-xs transition ${
                    glossaryCategory === cat
                      ? 'bg-zinc-700 text-white font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Term Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredGlossary.map((item) => (
              <div
                key={item.term}
                className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5 space-y-2 hover:border-zinc-750 transition"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono">{item.term}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{item.definition}</p>
                <div className="p-2 rounded bg-zinc-900/60 border border-zinc-850 text-[11px] text-zinc-400 space-y-1">
                  <div>
                    <strong className="text-zinc-300">Example: </strong>
                    {item.example}
                  </div>
                  <div>
                    <strong className="text-sky-400">Key Takeaway: </strong>
                    {item.keyTakeaway}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Badges */}
      {subTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                b.unlocked
                  ? 'bg-zinc-950 border-amber-500/50 shadow-md shadow-amber-950/20'
                  : 'bg-zinc-950/40 border-zinc-900 opacity-60'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${b.unlocked ? 'bg-amber-950 text-amber-400' : 'bg-zinc-900 text-zinc-600'}`}>
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{b.title}</h4>
                  {b.unlocked && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Quiz Modal */}
      {activeQuizLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-xl w-full my-auto shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
            <div className="flex items-center justify-between p-3.5 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-sky-950 text-sky-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Level {activeQuizLevel.id} Checkpoint Quiz
                  </h3>
                  <p className="text-[11px] text-zinc-400">{activeQuizLevel.topic}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveQuizLevel(null)}
                className="p-1 text-zinc-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {activeQuizLevel.quiz.map((q, qIdx) => {
                const userChoice = selectedAnswers[q.id];
                const isAnswered = userChoice !== undefined;

                return (
                  <div key={q.id} className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5 space-y-2.5">
                    <div className="text-xs font-bold text-white">
                      {qIdx + 1}. {q.question}
                    </div>

                    <div className="space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userChoice === optIdx;
                        let optionStyle = 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700';

                        if (quizSubmitted) {
                          if (optIdx === q.correctIndex) {
                            optionStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                          } else if (isSelected && optIdx !== q.correctIndex) {
                            optionStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 line-through';
                          }
                        } else if (isSelected) {
                          optionStyle = 'bg-sky-950 border-sky-500 text-sky-200 font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() => handleSelectAnswer(q.id, optIdx)}
                            className={`w-full p-2.5 rounded text-left border text-xs transition flex items-center justify-between ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && optIdx === q.correctIndex && (
                              <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="p-2.5 rounded bg-zinc-950 border border-zinc-850 text-[11px] text-zinc-300 leading-relaxed">
                        <strong className="text-sky-400 block mb-0.5">Explanation:</strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              {quizSubmitted && (
                <div className={`p-3.5 rounded-lg border text-center space-y-1 ${
                  quizScore === activeQuizLevel.quiz.length
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                }`}>
                  <div className="text-sm font-bold">
                    Score: {quizScore} / {activeQuizLevel.quiz.length}
                  </div>
                  <p className="text-xs">
                    {quizScore === activeQuizLevel.quiz.length
                      ? 'Outstanding! You have mastered the conceptual foundation of this level.'
                      : 'Review the explanations above and try again to cement your understanding!'}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end gap-2">
              {!quizSubmitted ? (
                <button
                  onClick={handleGradeQuiz}
                  disabled={Object.keys(selectedAnswers).length < activeQuizLevel.quiz.length}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition"
                >
                  Submit & Grade Quiz
                </button>
              ) : (
                <button
                  onClick={() => setActiveQuizLevel(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition"
                >
                  Close Checkpoint
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
